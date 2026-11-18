/* PlayLudiq · Macao · game logic, moved as-is */
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

var mode="bot", stock=[], pileBuried=[], top=null, curSuit=0, curRank=0,
    hands=[[],[]], toAct=0, drawPending=0, names=["Tu","Bot"], busy=false, over=false, revealed=false, jackCb=null;

function deck(){var d=[];for(var s=0;s<4;s++)for(var r=7;r<=14;r++)d.push({r:r,s:s});return shuffle(d);}
function start(m){
  mode=m; names=m==="bot"?["Tu","Bot"]:["Jucător 1","Jucător 2"];
  stock=deck(); pileBuried=[]; hands=[[],[]];
  for(var k=0;k<5;k++){hands[0].push(stock.pop());hands[1].push(stock.pop());}
  // prima carte de pe masa: evita sa fie J/7/A pentru un start simplu
  var first=stock.pop(); while((first.r===11||first.r===7||first.r===14)&&stock.length){pileBuried.push(first);first=stock.pop();}
  top=first; curSuit=first.s; curRank=first.r;
  toAct=0; drawPending=0; busy=false; over=false; revealed=false;
  $("pick").classList.add("hidden"); $("game").classList.remove("hidden");
  beginTurn();
}
function humanActor(p){return mode==="pvp"?true:p===0;}
function legal(c){
  if(drawPending>0){ return c.r===7; } // doar 7 peste 7
  if(c.r===11) return true; // valet oricand
  return c.s===curSuit || c.r===curRank;
}
function hasLegal(p){ return hands[p].some(legal); }

function beginTurn(){
  if(over)return;
  if(drawPending>0) $("msg").textContent = names[toAct]+": pui un 7 sau tragi "+drawPending+" cărți.";
  else $("msg").textContent = names[toAct]+" la rând.";
  promptTurn();
}
function promptTurn(){
  if(busy||over)return;
  if(humanActor(toAct)){
    if(mode==="pvp"){revealed=false;$("curtName").textContent="Rândul: "+names[toAct];$("curtain").classList.remove("hidden");}
    else {revealed=true;$("curtain").classList.add("hidden");}
    render();
  } else { busy=true; setTimeout(botMove, 750); }
}
function drawFromStock(){
  if(!stock.length){ // reshuffle buried
    if(pileBuried.length){ stock=shuffle(pileBuried.slice()); pileBuried=[]; }
  }
  return stock.length?stock.pop():null;
}
function doDrawAction(){
  var n = drawPending>0?drawPending:1;
  for(var k=0;k<n;k++){var c=drawFromStock(); if(c)hands[toAct].push(c);}
  drawPending=0;
  render();
  advance(false);
}
function playCard(p, idx){
  var c=hands[p][idx];
  if(!legal(c)) return false;
  hands[p].splice(idx,1);
  pileBuried.push(top); top=c;
  if(c.r===11){ // valet -> alege culoare
    curRank=11;
    if(humanActor(p) && (mode==="pvp"? revealed : p===0)){
      busy=true; openSuit(function(s){ curSuit=s; afterPlay(c,p); });
      return true;
    } else { // bot alege culoarea cu cele mai multe carti
      curSuit=botSuit(p); afterPlay(c,p); return true;
    }
  }
  curSuit=c.s; curRank=c.r;
  afterPlay(c,p);
  return true;
}
function afterPlay(c,p){
  render();
  if(hands[p].length===0){ return setTimeout(function(){finish(p);},350); }
  if(c.r===7){ drawPending+=2; advance(false); return; }
  if(c.r===14){ advance(true); return; } // As -> sari adversarul (acelasi joaca iar)
  advance(false);
}
function advance(skip){
  busy=false;
  if(!skip) toAct=1-toAct; // skip=true in 2 jucatori => acelasi ramane la rand
  setTimeout(beginTurn, 300);
}
function botSuit(p){
  var cnt=[0,0,0,0]; hands[p].forEach(function(c){if(c.r!==11)cnt[c.s]++;});
  var best=0;for(var s=1;s<4;s++)if(cnt[s]>cnt[best])best=s;return best;
}
function botMove(){
  busy=false;
  var h=hands[1];
  if(drawPending>0){
    var sevenIdx=h.findIndex(function(c){return c.r===7;});
    if(sevenIdx>=0){ busy=true; playCard(1,sevenIdx); return; }
    busy=true; doDrawAction(); return;
  }
  // priority: As, 7, normal, Valet (pastreaza valetul)
  var order=[14,7,null,11];
  var pick=-1;
  // normal cards first among order: As
  function findLegal(pred){for(var i=0;i<h.length;i++){if(legal(h[i])&&pred(h[i]))return i;}return -1;}
  pick=findLegal(function(c){return c.r===14;});
  if(pick<0)pick=findLegal(function(c){return c.r===7;});
  if(pick<0)pick=findLegal(function(c){return c.r!==11&&c.r!==14&&c.r!==7;});
  if(pick<0)pick=findLegal(function(c){return c.r===11;});
  if(pick>=0){ busy=true; playCard(1,pick); return; }
  busy=true; doDrawAction();
}
function finish(winner){
  over=true;
  var t = mode==="bot" ? (winner===0?"Ai câștigat!":"Botul a câștigat") : (names[winner]+" câștigă!");
  var icon = (mode==="bot" && winner!==0) ? "bot" : "trophy";
  setIconText($("endT"),icon,t);
  $("endP").textContent = names[winner]+" a scăpat primul de toate cărțile!";
  $("endOv").classList.add("on");
}
function openSuit(cb){ jackCb=cb; $("suitOv").classList.add("on"); }
[].forEach.call(document.querySelectorAll("#suitOv .suits button"),function(b){
  b.onclick=function(){ $("suitOv").classList.remove("on"); var s=+b.getAttribute("data-s"); var cb=jackCb; jackCb=null; if(cb)cb(s); };
});

function render(){
  $("meCount").textContent=hands[mode==="bot"?0:toAct].length;
  var actor=toAct, other=1-actor;
  var bottom=mode==="bot"?0:actor, topP=mode==="bot"?1:other;
  $("meName").textContent=names[bottom]; $("oppName").textContent=names[topP];
  $("meCount").textContent=hands[bottom].length; $("oppCount").textContent=hands[topP].length;
  var ob="";for(var i=0;i<hands[topP].length;i++)ob+='<div class="back"></div>';$("oppHand").innerHTML=ob;
  $("stock").textContent=stock.length;
  $("topCard").innerHTML=top?cardHTML(top):"";
  $("suitBadge").innerHTML='culoare: <span class="suit '+(red(curSuit)?'red':'black')+'">'+SU[curSuit]+'</span>';
  $("turn").textContent = busy&&!humanActor(toAct) ? (names[toAct]+" se gândește…") : ("Rândul: "+names[toAct]);
  // draw button state
  var myTurnHuman = !busy && !over && (mode==="bot"? toAct===0 : revealed);
  $("drawBtn").disabled = !myTurnHuman;
  setIconText($("drawBtn"),"layers", drawPending>0 ? ("Trage "+drawPending+" cărți") : "Trage o carte");
  // hand
  var showP = mode==="bot"?0:actor;
  if(mode==="bot" || revealed){
    var hh="";hands[showP].forEach(function(c,idx){
      var ok = myTurnHuman && legal(c);
      hh+='<div class="card '+(red(c.s)?"red":"black")+(ok?" playable":(myTurnHuman?" dim":""))+'" data-i="'+idx+'"><span class="r">'+rl(c.r)+'</span><span class="s">'+SU[c.s]+'</span></div>';
    });
    $("hand").innerHTML=hh;
    [].forEach.call($("hand").querySelectorAll(".card"),function(el){
      el.onclick=function(){ if(!myTurnHuman)return; var idx=+el.getAttribute("data-i"); var c=hands[showP][idx];
        if(!legal(c)){ $("msg").textContent="Cartea nu se potrivește. Pune aceeași culoare/valoare, un Valet, sau trage."; return; }
        busy=true; playCard(showP, idx);
      };
    });
    $("curtain").classList.add("hidden");
  } else { $("hand").innerHTML=""; }
}
function cardHTML(c){return '<div class="card '+(red(c.s)?"red":"black")+'"><span class="r">'+rl(c.r)+'</span><span class="s">'+SU[c.s]+'</span></div>';}

$("curtain").onclick=function(){revealed=true;$("curtain").classList.add("hidden");render();};
$("drawBtn").onclick=function(){ if($("drawBtn").disabled)return; busy=true; doDrawAction(); };
$("mBot").onclick=function(){start("bot");};
$("mPvp").onclick=function(){start("pvp");};
$("newBtn").onclick=function(){start(mode);};
$("modeBtn").onclick=function(){$("game").classList.add("hidden");$("pick").classList.remove("hidden");$("endOv").classList.remove("on");};
$("endNew").onclick=function(){$("endOv").classList.remove("on");start(mode);};
$("rulesBtn").onclick=function(){$("rulesOv").classList.add("on");};
$("rulesClose").onclick=function(){$("rulesOv").classList.remove("on");};
$("rulesOv").onclick=function(e){if(e.target.id==="rulesOv")$("rulesOv").classList.remove("on");};
$("endOv").onclick=function(e){if(e.target.id==="endOv")$("endOv").classList.remove("on");};
})();
