/* PlayLudiq · Septică · game logic, moved as-is */
(function(){
var $=function(i){return document.getElementById(i);};
var SU=["♠","♥","♦","♣"];
function red(s){return s===1||s===2;}
function rl(r){return r===14?"A":r===13?"K":r===12?"Q":r===11?"J":(""+r);}
function isPt(c){return c.r===10||c.r===14;}
var ICONS="assets/icons/icons.svg#";
// Puts a sprite icon in front of plain text; the text is added as a text node.
function setIconText(el, iconId, text){
  el.innerHTML='<svg class="icon" aria-hidden="true"><use href="'+ICONS+iconId+'"/></svg> ';
  el.appendChild(document.createTextNode(text));
}

var mode="bot", stock=[], hands=[[],[]], won=[[],[]], pile=[], base=null,
    leader=0, toAct=0, lastCov=0, names=["Tu","Bot"], busy=false, lastTrickWinner=0, revealed=false;
// player 0 = human "me" (bottom). player 1 = opponent (top: bot or human2).

function deck(){var d=[];for(var s=0;s<4;s++)for(var r=7;r<=14;r++)d.push({r:r,s:s});
  for(var i=d.length-1;i>0;i--){var j=Math.random()*(i+1)|0;var t=d[i];d[i]=d[j];d[j]=t;}return d;}

function startGame(m){
  mode=m; names = m==="bot"?["Tu","Bot"]:["Jucător 1","Jucător 2"];
  stock=deck(); hands=[[],[]]; won=[[],[]];
  for(var k=0;k<4;k++){hands[0].push(stock.pop());hands[1].push(stock.pop());}
  pile=[]; base=null; leader=0; toAct=0; lastCov=0; lastTrickWinner=0; busy=false;
  $("pick").classList.add("hidden"); $("game").classList.remove("hidden");
  $("meName").textContent=names[0]; $("oppName").textContent=names[1];
  beginTrick();
}
function humanActor(p){ return mode==="pvp" ? true : p===0; } // in bot mode only p0 is human

function beginTrick(){
  // ensure leader has cards
  if(hands[0].length===0 && hands[1].length===0){return finish();}
  if(hands[leader].length===0){ leader=1-leader; }
  toAct=leader; lastCov=leader; pile=[]; base=null;
  render(); promptTurn();
}
function promptTurn(){
  if(busy)return;
  if(hands[toAct].length===0){ return setTimeout(function(){endTrick(lastCov);}, 400); }
  if(humanActor(toAct)){
    if(mode==="pvp"){ // show curtain for whichever human is to act
      revealed=false; $("curtName").textContent="Rândul: "+names[toAct];
      $("curtain").classList.remove("hidden");
    } else { revealed=true; $("curtain").classList.add("hidden"); }
    render();
  } else { // bot
    busy=true; setTimeout(botPlay, 650);
  }
}
function playCard(p, idx){
  var c=hands[p].splice(idx,1)[0];
  if(base===null){ base=c.r; pile.push(c); lastCov=p; afterPlay(p,true); return; }
  pile.push(c);
  var covered = (c.r===base || c.r===7);
  if(covered){ lastCov=p; afterPlay(p,true); }
  else { afterPlay(p,false); }
}
function afterPlay(p, covered){
  render();
  if(base!==null && pile.length===1){ // leader just set base
    if(hands[1-leader].length===0){ return setTimeout(function(){endTrick(leader);}, 400); }
    toAct=1-leader; return cont();
  }
  if(!covered){ return setTimeout(function(){endTrick(lastCov);}, 500); }
  // covered: other acts if has cards, else trick ends
  var other=1-p;
  if(hands[other].length===0){ return setTimeout(function(){endTrick(lastCov);}, 500); }
  toAct=other; cont();
}
function cont(){ busy=false; promptTurn(); }

function endTrick(winner){
  for(var i=0;i<pile.length;i++) won[winner].push(pile[i]);
  lastTrickWinner=winner; pile=[]; base=null;
  // draw: winner first then loser
  [winner,1-winner].forEach(function(p){ while(hands[p].length<4 && stock.length) hands[p].push(stock.pop()); });
  updatePts();
  var nm=names[winner], pts=pileNote();
  $("msg").textContent=nm+" ia mâna"+(pts?(" ("+pts+")"):"");
  render();
  if(stock.length===0 && hands[0].length===0 && hands[1].length===0){ return setTimeout(finish, 900); }
  leader=winner; busy=true;
  setTimeout(function(){ busy=false; beginTrick(); }, 950);
}
var lastWonCount=[0,0];
function pileNote(){ return ""; }
function updatePts(){
  $("mePts").textContent=won[0].filter(isPt).length;
  $("oppPts").textContent=won[1].filter(isPt).length;
}
function finish(){
  var p0=won[0].filter(isPt).length, p1=won[1].filter(isPt).length;
  if(lastTrickWinner===0)p0++; else p1++;
  var t,icon;
  if(p0>p1){icon="trophy";t=(mode==="bot"?"Ai câștigat!":names[0]+" câștigă!");}
  else if(p1>p0){icon=(mode==="bot"?"bot":"trophy");t=(mode==="bot"?"Botul a câștigat":names[1]+" câștigă!");}
  else {icon="users";t="Egal!";}
  setIconText($("endT"),icon,t);
  $("endP").textContent=names[0]+": "+p0+" puncte · "+names[1]+": "+p1+" puncte  (ultima mână +1).";
  $("endOv").classList.add("on");
}

// ---- bot ----
function botPlay(){
  var h=hands[1], idx;
  if(base===null){ idx=botLead(h); }
  else { idx=botRespond(h); }
  busy=false; playCard(1, idx);
}
function botLead(h){
  // prefer lowest non-point, non-seven
  var cand=h.map(function(c,i){return {c:c,i:i};});
  var plain=cand.filter(function(x){return !isPt(x.c)&&x.c.r!==7;});
  var pool=plain.length?plain:cand.filter(function(x){return x.c.r!==7;});
  if(!pool.length)pool=cand;
  pool.sort(function(a,b){return a.c.r-b.c.r;});
  return pool[0].i;
}
function botRespond(h){
  var pts=pile.filter(isPt).length;
  var covers=h.map(function(c,i){return {c:c,i:i};}).filter(function(x){return x.c.r===base||x.c.r===7;});
  var sameRank=covers.filter(function(x){return x.c.r===base && x.c.r!==7;});
  var sevens=covers.filter(function(x){return x.c.r===7;});
  var plain=h.map(function(c,i){return {c:c,i:i};}).filter(function(x){return !isPt(x.c)&&x.c.r!==7;});
  if(pts>0 && covers.length){ // worth taking -> cover, prefer same-rank non-7
    if(sameRank.length){sameRank.sort(function(a,b){return a.c.r-b.c.r;});return sameRank[0].i;}
    return sevens[0].i;
  }
  // no points on table: avoid wasting covers -> dump a low plain card
  if(plain.length){ plain.sort(function(a,b){return a.c.r-b.c.r;}); return plain[0].i; }
  // only points/sevens left: better cover (take empty pile) than dump a point
  if(covers.length){ if(sameRank.length)return sameRank[0].i; return sevens[0].i; }
  // must dump a point: lowest (10 before A)
  var all=h.map(function(c,i){return {c:c,i:i};}); all.sort(function(a,b){return a.c.r-b.c.r;}); return all[0].i;
}

// ---- render ----
function cardHTML(c,extra){
  return '<div class="card '+(red(c.s)?"red":"black")+(c.r===7?" seven":"")+(extra||"")+'"><span class="r">'+rl(c.r)+'</span><span class="s">'+SU[c.s]+'</span></div>';
}
function render(){
  var actor=toAct, other=1-actor;
  var bottom = (mode==="bot")?0:actor;   // actor's hand shown at bottom
  var top = (mode==="bot")?1:other;      // other player's cards (face down) at top
  // labels + points
  $("meName").textContent=names[bottom];
  $("oppName").textContent=names[top];
  $("mePts").textContent=won[bottom].filter(isPt).length;
  $("oppPts").textContent=won[top].filter(isPt).length;
  // opponent (top) backs
  var ob="";for(var i=0;i<hands[top].length;i++)ob+='<div class="back"></div>';
  $("oppHand").innerHTML=ob;
  // pile
  var ph="";for(var j=0;j<pile.length;j++){ph+=cardHTML(pile[j], (base!==null&&j===0)?" base":"");}
  $("pile").innerHTML=ph||'<span class="pile-empty">—</span>';
  $("stockc").textContent="Pachet: "+stock.length+" cărți rămase";
  // turn label
  $("turn").textContent = busy&&!humanActor(toAct) ? (names[toAct]+" se gândește…") : ("Rândul: "+names[toAct]);
  if(base!==null) $("msg").textContent = "Taie cu "+rl(base)+" sau cu 7 — altfel închizi mâna.";
  // bottom hand
  if(mode==="bot"){
    var hh="";hands[0].forEach(function(c,i){hh+=cardHTML(c,(isPt(c)?" pt":"")+'" data-i="'+i+'" data-click="1');});
    $("hand").innerHTML=hh;
    bindHand(0, toAct===0 && !busy);
    $("curtain").classList.add("hidden");
  } else {
    if(revealed){
      var hh2="";hands[actor].forEach(function(c,i){hh2+=cardHTML(c,(isPt(c)?" pt":"")+'" data-i="'+i+'" data-click="1');});
      $("hand").innerHTML=hh2; bindHand(actor, !busy); $("curtain").classList.add("hidden");
    } else {
      $("hand").innerHTML="";
    }
  }
}
function bindHand(p, clickable){
  [].forEach.call($("hand").querySelectorAll('.card[data-click]'),function(el){
    if(clickable){ el.onclick=function(){ onPlay(p, +el.getAttribute("data-i")); }; el.style.opacity=""; }
    else { el.onclick=null; el.style.opacity=".65"; }
  });
}
function onPlay(p, idx){
  if(busy) return; if(toAct!==p) return;
  busy=true; $("msg").textContent="";
  playCard(p, idx);
}

// curtain tap
$("curtain").onclick=function(){ revealed=true; $("curtain").classList.add("hidden"); render(); };

$("mBot").onclick=function(){startGame("bot");};
$("mPvp").onclick=function(){startGame("pvp");};
$("newBtn").onclick=function(){startGame(mode);};
$("modeBtn").onclick=function(){$("game").classList.add("hidden");$("pick").classList.remove("hidden");$("endOv").classList.remove("on");};
$("endNew").onclick=function(){$("endOv").classList.remove("on");startGame(mode);};
$("rulesBtn").onclick=function(){$("rulesOv").classList.add("on");};
$("rulesClose").onclick=function(){$("rulesOv").classList.remove("on");};
$("rulesOv").onclick=function(e){if(e.target.id==="rulesOv")$("rulesOv").classList.remove("on");};
})();
