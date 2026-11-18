/* PlayLudiq · Popa Prostul · game logic, moved as-is */
(function(){
var $=function(i){return document.getElementById(i);};
var SU=["♠","♥","♦","♣"];
function red(s){return s===1||s===2;}
function rl(r){return r===14?"A":r===13?"K":r===12?"Q":r===11?"J":(""+r);}
var ICONS="assets/icons/icons.svg#";
// Puts a sprite icon in front of plain text; the text is added as a text node.
function setIconText(el, iconId, text){
  el.innerHTML='<svg class="icon" aria-hidden="true"><use href="'+ICONS+iconId+'"/></svg> ';
  el.appendChild(document.createTextNode(text));
}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.random()*(i+1)|0;var t=a[i];a[i]=a[j];a[j]=t;}return a;}

var mode="bot", hands=[[],[]], pairs=[0,0], names=["Tu","Bot"], toAct=0, busy=false, revealed=false, over=false;

function deck(){var d=[];for(var s=0;s<4;s++)for(var r=7;r<=14;r++)d.push({r:r,s:s});
  // scoate 3 regi, lasa doar K de pica (popa prostul)
  d=d.filter(function(c){return !(c.r===13 && c.s!==0);});
  return shuffle(d);}

function normalize(hand){
  var by={}; hand.forEach(function(c){(by[c.r]=by[c.r]||[]).push(c);});
  var out=[],pr=0;
  Object.keys(by).forEach(function(r){var arr=by[r];pr+=Math.floor(arr.length/2);if(arr.length%2===1)out.push(arr[arr.length-1]);});
  return {hand:shuffle(out),pairs:pr};
}
function startGame(m){
  mode=m; names = m==="bot"?["Tu","Bot"]:["Jucător 1","Jucător 2"];
  var d=deck(); hands=[[],[]];
  for(var i=0;i<d.length;i++) hands[i%2].push(d[i]);
  var n0=normalize(hands[0]), n1=normalize(hands[1]);
  hands[0]=n0.hand; hands[1]=n1.hand; pairs=[n0.pairs,n1.pairs];
  toAct=0; busy=false; over=false;
  $("pick").classList.add("hidden"); $("game").classList.remove("hidden");
  $("meName").textContent=names[0]; $("oppName").textContent=names[1];
  beginTurn();
}
function humanActor(p){ return mode==="pvp" ? true : p===0; }

function beginTurn(){
  if(over)return;
  $("msg").textContent = names[toAct]+" trage o carte de la "+names[1-toAct]+".";
  $("sub").textContent = "Cărțile se iau pe nevăzute.";
  promptTurn();
}
function promptTurn(){
  if(busy||over)return;
  shuffle(hands[1-toAct]); // reshuffle source so pozitia nu poate fi memorata
  if(humanActor(toAct)){
    if(mode==="pvp"){ revealed=false; $("curtName").textContent="Rândul: "+names[toAct]; $("curtain").classList.remove("hidden"); }
    else { revealed=true; $("curtain").classList.add("hidden"); }
    render();
  } else { busy=true; setTimeout(botDraw, 800); }
}
function botDraw(){
  var src=hands[1-toAct];
  var i=Math.random()*src.length|0;
  doDraw(i);
}
function doDraw(i){
  var src=hands[1-toAct], me=hands[toAct];
  var card=src.splice(i,1)[0];
  me.push(card);
  var n=normalize(me); hands[toAct]=n.hand; pairs[toAct]=n.pairs;
  busy=false;
  render();
  // end check
  if(hands[0].length===0 || hands[1].length===0){ return setTimeout(finish, 500); }
  toAct=1-toAct; setTimeout(beginTurn, 350);
}
function finish(){
  over=true;
  // cel cu carti (popa prostul) pierde
  var loser = hands[0].length>0 ? 0 : 1;
  var win = 1-loser;
  var t, icon="trophy";
  if(mode==="bot"){ t = loser===1 ? "Ai câștigat!" : "Ai rămas cu Popa Prostul!"; if(loser===0)icon="crown"; }
  else { t = names[win]+" câștigă!"; }
  setIconText($("endT"),icon,t);
  $("endP").textContent = names[loser]+" a rămas cu Popa Prostul (regele fără pereche).";
  $("endOv").classList.add("on");
}
function render(){
  $("mePairs").textContent=pairs[0]; $("oppPairs").textContent=pairs[1];
  var actor=toAct, other=1-actor;
  var bottom = mode==="bot"?0:actor, top = mode==="bot"?1:other;
  $("meName").textContent=names[bottom]; $("oppName").textContent=names[top];
  $("mePairs").textContent=pairs[bottom]; $("oppPairs").textContent=pairs[top];
  // top = opponent backs; pickable if it's the bottom player's turn to draw and bottom is the human acting
  var canPick = !busy && !over && (mode==="bot" ? toAct===0 : revealed) && (top===(1-toAct));
  var ob="";for(var i=0;i<hands[top].length;i++) ob+='<div class="back'+(canPick?" pick":"")+'" data-i="'+i+'"></div>';
  $("oppHand").innerHTML=ob;
  if(canPick){ [].forEach.call($("oppHand").querySelectorAll(".back"),function(el){ el.onclick=function(){ if(busy||over)return; busy=true; doDraw(+el.getAttribute("data-i")); }; }); }
  $("turn").textContent = busy&&!humanActor(toAct) ? (names[toAct]+" trage…") : ("Rândul: "+names[toAct]);
  // bottom hand
  if(mode==="bot"){
    var hh="";hands[0].forEach(function(c){hh+=cardHTML(c);});
    $("hand").innerHTML=hh; $("curtain").classList.add("hidden");
  } else {
    if(revealed){ var h2="";hands[actor].forEach(function(c){h2+=cardHTML(c);}); $("hand").innerHTML=h2; $("curtain").classList.add("hidden"); }
    else { $("hand").innerHTML=""; }
  }
}
function cardHTML(c){ return '<div class="card '+(red(c.s)?"red":"black")+'"><span class="r">'+rl(c.r)+'</span><span class="s">'+SU[c.s]+'</span></div>'; }

$("curtain").onclick=function(){ revealed=true; $("curtain").classList.add("hidden"); render(); };
$("mBot").onclick=function(){startGame("bot");};
$("mPvp").onclick=function(){startGame("pvp");};
$("newBtn").onclick=function(){startGame(mode);};
$("modeBtn").onclick=function(){$("game").classList.add("hidden");$("pick").classList.remove("hidden");$("endOv").classList.remove("on");};
$("endNew").onclick=function(){$("endOv").classList.remove("on");startGame(mode);};
$("rulesBtn").onclick=function(){$("rulesOv").classList.add("on");};
$("rulesClose").onclick=function(){$("rulesOv").classList.remove("on");};
$("rulesOv").onclick=function(e){if(e.target.id==="rulesOv")$("rulesOv").classList.remove("on");};
$("endOv").onclick=function(e){if(e.target.id==="endOv")$("endOv").classList.remove("on");};
})();
