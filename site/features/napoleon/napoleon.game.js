/* PlayLudiq · Napoleon · game logic, moved as-is */
const $=id=>document.getElementById(id);
const iconMarkup=id=>'<svg class="icon" aria-hidden="true"><use href="assets/icons/icons.svg#'+id+'"/></svg>';
const SUITS=[{s:"♠",c:"black"},{s:"♥",c:"red"},{s:"♦",c:"red"},{s:"♣",c:"black"}];
const RANKS=[{r:"A",v:1},{r:"2",v:2},{r:"3",v:3},{r:"4",v:4},{r:"5",v:5},{r:"6",v:6},{r:"7",v:7},{r:"8",v:8},{r:"9",v:9},{r:"10",v:10},{r:"J",v:11},{r:"D",v:12},{r:"K",v:13}];
const rLabel=v=>RANKS.find(x=>x.v===v).r;
let deck,talon,active,queens,six,five,passes,startT,timer;
const DESC_NEXT={5:4,4:3,3:2,2:1,1:13}; // 5->4->3->2->A->K

function newDeck(){let d=[];for(const su of SUITS)for(const rk of RANKS)d.push({r:rk.r,v:rk.v,s:su.s,c:su.c});
  for(let i=d.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[d[i],d[j]]=[d[j],d[i]];}return d;}
function deal(){
  deck=newDeck();talon=[];active=null;passes=3;
  queens={};six={};five={};
  for(const su of SUITS){queens[su.s]=null;six[su.s]=[];five[su.s]=[];}
  startT=Date.now();clearInterval(timer);timer=setInterval(tick,1000);
  $("ov").classList.remove("on");render();tick();
}
function tick(){const s=(Date.now()-startT)/1000|0;$("sTime").textContent=(s/60|0)+":"+String(s%60).padStart(2,"0");}

function target(card){
  if(!card)return null;const v=card.v,s=card.s;
  if(v===12)return queens[s]===null?{p:"q",s}:null;
  if(v===6)return six[s].length===0?{p:"6",s}:null;
  if(v>=7&&v<=11){const t=six[s];return t.length&&t[t.length-1].v===v-1?{p:"6",s}:null;}
  if(v===5)return five[s].length===0?{p:"5",s}:null;
  // descendent: 4,3,2,A,K
  const t=five[s];if(!t.length)return null;const top=t[t.length-1].v;
  if(DESC_NEXT[top]===v)return{p:"5",s};
  return null;
}
function placed(){let n=0;for(const su of SUITS){if(queens[su.s])n++;n+=six[su.s].length+five[su.s].length;}return n;}

function cardHTML(card){return '<div class="card '+card.c+'"><div class="r">'+card.r+'</div><div class="s">'+card.s+'</div></div>';}
function slot(topCard,ph,okClick){
  const d=document.createElement("div");d.className="slot";
  if(topCard)d.innerHTML=cardHTML(topCard);
  else d.innerHTML='<div class="ph">'+ph+'</div>';
  if(okClick)d.classList.add("ok"),d.onclick=okClick;
  return d;
}
function render(){
  // highlight valid target for active
  const tg=target(active);
  const six_row=$("rowSix");six_row.innerHTML="";
  SUITS.forEach(su=>{const t=six[su.s];const top=t[t.length-1];
    const ok=tg&&tg.p==="6"&&tg.s===su.s;
    six_row.appendChild(slot(top, "6"+su.s+"↑", ok?()=>play():null));});
  const q_row=$("rowQ");q_row.innerHTML="";
  SUITS.forEach(su=>{const ok=tg&&tg.p==="q"&&tg.s===su.s;
    q_row.appendChild(slot(queens[su.s], "D"+su.s, ok?()=>play():null));});
  const five_row=$("rowFive");five_row.innerHTML="";
  SUITS.forEach(su=>{const t=five[su.s];const top=t[t.length-1];
    const ok=tg&&tg.p==="5"&&tg.s===su.s;
    five_row.appendChild(slot(top, "5"+su.s+"↓", ok?()=>play():null));});
  // deck + active
  $("deck").classList.toggle("empty",deck.length===0);
  $("deckCnt").innerHTML=deck.length|| (passes>1?iconMarkup("restart"):"–");
  const a=$("active");a.classList.toggle("canplay",!!tg);
  if(active){a.innerHTML=cardHTML(active);a.firstChild.onclick=()=>play();}
  else a.innerHTML='<div class="ph">carte<br>activă</div>';
  $("sDone").textContent=placed();$("sPass").textContent=passes;
  $("hint").textContent="";
}
function play(){
  const tg=target(active);if(!tg){$("hint").textContent="Cartea activă nu se poate așeza — trage alta.";return;}
  if(tg.p==="q")queens[tg.s]=active;
  else if(tg.p==="6")six[tg.s].push(active);
  else five[tg.s].push(active);
  active=null;render();
  if(placed()===52){win();return;}
}
function draw(){
  // daca cartea activa inca poate fi jucata, nu o ingropa fara sa avertizezi? o ducem in pachet jos.
  if(active){deck.push(active);active=null;}
  if(deck.length===0){
    if(passes>1){passes--;deck=talon.reverse();talon=[];}
    else {render();$("hint").textContent="Nu mai ai treceri. Joc blocat dacă nu mai poți așeza.";checkDead();return;}
  }
  active=deck.shift();render();
  // auto-play dame? le lasam manual pt claritate; dar aratam daca se poate
  if(!target(active)){ /* ramane activa */ }
  checkDead();
}
function anyPlayable(){
  // activa sau orice din pachet poate deveni jucabila candva? simplificat: daca activa nu merge si nu mai sunt trageri
  if(target(active))return true;
  return deck.length>0 || passes>1;
}
function checkDead(){
  if(placed()===52)return;
  if(!target(active) && deck.length===0 && passes<=1){
    // mai verificam daca vreo carte din talon ar putea fi jucata la reciclare — dar nu mai avem treceri
    lose();
  }
}
function win(){clearInterval(timer);$("ovT").innerHTML=iconMarkup("trophy")+" Felicitări!";$("ovP").textContent="Ai așezat toate cele 52 de cărți. Pasiența a reușit!";$("ov").classList.add("on");}
function lose(){clearInterval(timer);$("ovT").textContent="Joc blocat";$("ovP").textContent="Nu mai sunt mutări și s-au terminat trecerile. Mai încearcă!";$("ov").classList.add("on");}

$("bDraw").onclick=draw;
$("deck").onclick=draw;
$("bNew").onclick=deal;$("ovNew").onclick=deal;
$("bRules").onclick=()=>$("rules").classList.add("on");
$("rulesClose").onclick=()=>$("rules").classList.remove("on");
$("rules").onclick=e=>{if(e.target.id==="rules")$("rules").classList.remove("on");};
deal();
