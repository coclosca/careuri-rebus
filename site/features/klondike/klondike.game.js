/* PlayLudiq · Solitaire (Klondike) · game logic, moved as-is */
(function(){
var $=function(i){return document.getElementById(i);};
function iconMarkup(id){return '<svg class="icon" aria-hidden="true"><use href="assets/icons/icons.svg#'+id+'"/></svg>';}
var SUIT=["♠","♥","♦","♣"]; // spade heart diamond club
function red(s){return s===1||s===2;}
function rlabel(r){return r===1?"A":r===11?"J":r===12?"Q":r===13?"K":(""+r);}

var S=null, hist=[], moves=0, draw=1, startT=0, timer=null, sel=null;

function freshDeck(){var d=[];for(var s=0;s<4;s++)for(var r=1;r<=13;r++)d.push({r:r,s:s,up:false});
  for(var i=d.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=d[i];d[i]=d[j];d[j]=t;}return d;}

function deal(){
  var d=freshDeck();
  S={stock:[],waste:[],found:[[],[],[],[]],tab:[[],[],[],[],[],[],[]]};
  for(var c=0;c<7;c++){for(var k=0;k<=c;k++){var card=d.pop();card.up=(k===c);S.tab[c].push(card);}}
  S.stock=d; // rest face-down
  hist=[];moves=0;sel=null;
  $("moves").textContent="0";
  startT=Date.now();if(timer)clearInterval(timer);timer=setInterval(tick,1000);$("time").textContent="0:00";
  render();
}
function tick(){var s=Math.floor((Date.now()-startT)/1000);$("time").textContent=Math.floor(s/60)+":"+("0"+(s%60)).slice(-2);}

function snapshot(){return JSON.stringify(S);}
function pushHist(){hist.push(snapshot());if(hist.length>200)hist.shift();}
function undo(){if(!hist.length)return;S=JSON.parse(hist.pop());sel=null;moves++;$("moves").textContent=moves;render();}

function sizeBoard(){
  var wrap=document.querySelector(".wrap");var W=wrap.clientWidth;
  var gap=Math.max(3,Math.round(W*0.012));
  var cw=Math.floor((W-6*gap)/7);
  var ch=Math.round(cw*1.42);
  document.documentElement.style.setProperty("--gap",gap+"px");
  document.documentElement.style.setProperty("--cw",cw+"px");
  document.documentElement.style.setProperty("--ch",ch+"px");
  return {cw:cw,ch:ch};
}

function cardEl(card){
  var e=document.createElement("div");
  e.className="card "+(card.up?(red(card.s)?"red":"black"):"down");
  if(card.up){e.innerHTML='<span class="r">'+rlabel(card.r)+'</span><span class="s">'+SUIT[card.s]+'</span><span class="big">'+SUIT[card.s]+'</span>';}
  return e;
}

function render(){
  var sz=sizeBoard();var ch=sz.ch;
  var peekUp=Math.round(ch*0.34), peekDown=Math.round(ch*0.17);
  // stock
  var st=$("stock");st.innerHTML="";
  if(S.stock.length){var sc=document.createElement("div");sc.className="card down";sc.onclick=drawStock;st.appendChild(sc);}
  else{var se=document.createElement("div");se.className="stockempty";se.innerHTML=iconMarkup("restart");se.onclick=drawStock;st.appendChild(se);}
  // waste (show up to last 3 if draw3, else last)
  var wa=$("waste");wa.innerHTML="";
  if(S.waste.length){
    var show=draw===3?S.waste.slice(-3):S.waste.slice(-1);
    var base=S.waste.length-show.length;
    var fanW=Math.round(sz.cw*0.26);
    show.forEach(function(card,i){var e=cardEl(card);e.style.left=(i*fanW)+"px";e.style.width=(sz.cw)+"px";
      var isTop=(base+i===S.waste.length-1);
      if(isTop){e.onclick=function(){selectWaste();};e.ondblclick=function(){autoOne('waste');};if(sel&&sel.src==='waste')e.classList.add('sel');}
      else{e.style.pointerEvents="none";}
      wa.appendChild(e);});
    wa.style.position="relative";
  }
  // foundations
  for(var f=0;f<4;f++){var fe=$("f"+f);fe.innerHTML="";var pile=S.found[f];
    if(pile.length){var e=cardEl(pile[pile.length-1]);e.onclick=(function(fi){return function(){clickFound(fi);};})(f);fe.appendChild(e);}
    else{var em=document.createElement("div");em.className="empty f";em.textContent=SUIT[f];em.onclick=(function(fi){return function(){clickFound(fi);};})(f);
      if(sel&&canToFound(selTopCard(),f)&&selIsSingle())em.classList.add("hintdst");fe.appendChild(em);}
  }
  // tableau
  for(var c=0;c<7;c++){
    var col=$("t"+c);col.innerHTML="";var pile=S.tab[c];var top=0;
    if(!pile.length){var em2=document.createElement("div");em2.className="empty";em2.style.height="var(--ch)";em2.textContent="K";
      em2.onclick=(function(ci){return function(){clickTab(ci,-1);};})(c);
      if(sel&&canToTabEmpty())em2.classList.add("hintdst");col.appendChild(em2);col.style.height="var(--ch)";continue;}
    for(var i=0;i<pile.length;i++){
      var card=pile[i];var e=cardEl(card);e.style.top=top+"px";
      (function(ci,ii,up){ e.onclick=function(){clickTab(ci,ii);}; if(up){e.ondblclick=function(){autoOne('tab',ci,ii);};} })(c,i,card.up);
      if(sel&&sel.src==='tab'&&sel.col===c&&i>=sel.idx)e.classList.add('sel');
      col.appendChild(e);
      top+=(i===pile.length-1)?0:(card.up?peekUp:peekDown);
    }
    col.style.height=(top+ch)+"px";
  }
  // destination hints on tableau tops
  if(sel){for(var c2=0;c2<7;c2++){var pile2=S.tab[c2];if(!pile2.length)continue;
    if(canToTab(selTopCard(),c2)){var last=$("t"+c2).lastChild;if(last)last.classList.add("hintdst");}}}
}

// ---- selection helpers ----
function selTopCard(){if(!sel)return null;if(sel.src==='waste')return S.waste[S.waste.length-1];return S.tab[sel.col][sel.idx];}
function selIsSingle(){if(!sel)return false;if(sel.src==='waste')return true;return sel.idx===S.tab[sel.col].length-1;}
function canToFound(card,f){if(!card)return false;if(card.s!==f)return false;var pile=S.found[f];if(!pile.length)return card.r===1;return pile[pile.length-1].r===card.r-1;}
function canToTab(card,c){if(!card)return false;var pile=S.tab[c];if(!pile.length)return card.r===13;var t=pile[pile.length-1];if(!t.up)return false;return red(card.s)!==red(t.s)&&card.r===t.r-1;}
function canToTabEmpty(){var card=selTopCard();return card&&card.r===13;}

// ---- interactions ----
function clearSel(){sel=null;}
function selectWaste(){if(sel&&sel.src==='waste'){clearSel();render();return;}sel={src:'waste'};render();}
function clickTab(c,i){
  var pile=S.tab[c];
  // empty column tapped
  if(i===-1){ if(sel){tryMoveTo('tab',c);} return; }
  var card=pile[i];
  if(!card.up){ // face-down: only flip if it's the top card and nothing selected handling
    if(i===pile.length-1){pushHist();card.up=true;moves++;$("moves").textContent=moves;clearSel();render();}
    return;
  }
  // if we have a selection, this tap is a destination (drop on this column)
  if(sel){ tryMoveTo('tab',c); return; }
  // otherwise select this run (i..end)
  sel={src:'tab',col:c,idx:i};render();
}
function clickFound(f){
  if(sel){ if(selIsSingle()){tryMoveToFound(f);} return; }
  // selecting from foundation not allowed (keep simple)
}
function tryMoveTo(kind,c){
  var card=selTopCard();if(!card){clearSel();render();return;}
  if(!canToTab(card,c)){ clearSel();render();return; }
  pushHist();
  var run=takeSel();
  for(var k=0;k<run.length;k++)S.tab[c].push(run[k]);
  afterMove();
}
function tryMoveToFound(f){
  var card=selTopCard();if(!card||!selIsSingle()||!canToFound(card,f)){clearSel();render();return;}
  pushHist();var run=takeSel();S.found[f].push(run[0]);afterMove();
}
function takeSel(){ // remove selected cards from source, return array
  if(sel.src==='waste'){return [S.waste.pop()];}
  var pile=S.tab[sel.col];var run=pile.splice(sel.idx);
  if(pile.length&&!pile[pile.length-1].up)pile[pile.length-1].up=true; // flip exposed
  return run;
}
function afterMove(){moves++;$("moves").textContent=moves;clearSel();render();checkWin();}

function drawStock(){
  pushHist();
  if(!S.stock.length){ // recycle
    while(S.waste.length){var c=S.waste.pop();c.up=false;S.stock.push(c);}
  } else {
    var n=Math.min(draw,S.stock.length);
    for(var k=0;k<n;k++){var c=S.stock.pop();c.up=true;S.waste.push(c);}
  }
  moves++;$("moves").textContent=moves;clearSel();render();
}

// double-tap: send a single card straight to its foundation
function autoOne(src,c,i){
  var card;
  if(src==='waste')card=S.waste[S.waste.length-1];
  else{var pile=S.tab[c];if(i!==pile.length-1)return;card=pile[i];}
  if(!card)return;
  if(canToFound(card,card.s)){pushHist();
    if(src==='waste')S.waste.pop();else{S.tab[c].pop();if(S.tab[c].length&&!S.tab[c][S.tab[c].length-1].up)S.tab[c][S.tab[c].length-1].up=true;}
    S.found[card.s].push(card);moves++;$("moves").textContent=moves;clearSel();render();checkWin();}
}
// auto to foundations (as many as possible)
function autoFinish(){
  pushHist();
  var startMoves=moves, guard=0, stale=0;
  while(guard++<600){
    var m=false;
    // send any available top (waste or tableau) to its foundation
    if(S.waste.length){var w=S.waste[S.waste.length-1];if(canToFound(w,w.s)){S.found[w.s].push(S.waste.pop());m=true;moves++;}}
    for(var c=0;c<7;c++){var pile=S.tab[c];if(!pile.length)continue;var t=pile[pile.length-1];if(t.up&&canToFound(t,t.s)){S.found[t.s].push(pile.pop());if(pile.length&&!pile[pile.length-1].up)pile[pile.length-1].up=true;m=true;moves++;}}
    if(m){stale=0;continue;}
    // nothing from tops -> draw from stock to bring new cards up
    if(S.stock.length){var n=Math.min(draw,S.stock.length);for(var k=0;k<n;k++){var cc=S.stock.pop();cc.up=true;S.waste.push(cc);}continue;}
    // stock empty -> recycle waste once or twice to retry
    if(S.waste.length){ stale++; if(stale>2)break;
      while(S.waste.length){var c2=S.waste.pop();c2.up=false;S.stock.push(c2);} continue; }
    break;
  }
  if(moves!==startMoves){$("moves").textContent=moves;clearSel();render();checkWin();}
  else { hist.pop(); }
}
function checkWin(){var n=0;for(var f=0;f<4;f++)n+=S.found[f].length;
  if(n===52){if(timer)clearInterval(timer);$("winSub").textContent="Rezolvată din "+moves+" mutări, în "+$("time").textContent+".";$("win").classList.add("on");}}

// ---- controls ----
$("newBtn").onclick=function(){deal();};
$("undoBtn").onclick=function(){undo();};
$("autoBtn").onclick=function(){autoFinish();};
$("winNew").onclick=function(){$("win").classList.remove("on");deal();};
$("win").onclick=function(e){if(e.target.id==='win')$("win").classList.remove("on");};
$("d1").onclick=function(){draw=1;$("d1").classList.add("on");$("d3").classList.remove("on");};
$("d3").onclick=function(){draw=3;$("d3").classList.add("on");$("d1").classList.remove("on");};
var rz;addEventListener("resize",function(){clearTimeout(rz);rz=setTimeout(function(){if(S)render();},120);});
deal();
})();
