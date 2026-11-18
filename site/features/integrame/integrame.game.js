/* PlayLudiq · Integrame & Rebus · game logic, moved as-is */
const SKEY = "integrame.v1";
const norm = s => (s||"").toUpperCase()
  .replace(/[ĂÂ]/g,"A").replace(/Î/g,"I").replace(/[ȘŞ]/g,"S").replace(/[ȚŢ]/g,"T")
  .replace(/[^A-Z]/g,"");

let store = {};
try{ store = JSON.parse(localStorage.getItem(SKEY)||"{}"); }catch(e){ store={}; }
function save(){ try{ localStorage.setItem(SKEY, JSON.stringify(store)); }catch(e){} }

let pi=0, P=null, dir="A", cur={r:0,c:0}, state=[], solvedOnce=false;
let secs=0, timerId=null, running=false;

const $=id=>document.getElementById(id);
const iconMarkup=id=>'<svg class="icon" aria-hidden="true"><use href="assets/icons/icons.svg#'+id+'"/></svg>';
const gridEl=$("grid"), hidden=$("hiddenInput");

function startTimer(){ if(timerId) return; timerId=setInterval(()=>{ if(running){secs++; renderTimer();} },1000); }
function renderTimer(){ const m=String(Math.floor(secs/60)).padStart(2,"0"), s=String(secs%60).padStart(2,"0"); $("timer").textContent=m+":"+s; }

function cellKey(r,c){return r+"_"+c;}
function isCell(r,c){ return P.grid[r] && P.grid[r][c]; }

function wordAt(r,c,d){
  if(!isCell(r,c)) return null;
  let sr=r, sc=c;
  if(d==="A"){ while(isCell(sr,sc-1)) sc--; }
  else{ while(isCell(sr-1,sc)) sr--; }
  const cells=[];
  let rr=sr,cc=sc;
  while(isCell(rr,cc)){ cells.push({r:rr,c:cc}); if(d==="A") cc++; else rr++; }
  if(cells.length<2) return null;
  return {cells, sr, sc};
}
function entryFor(r,c,d){
  const w=wordAt(r,c,d); if(!w) return null;
  const list = d==="A"?P.across:P.down;
  return list.find(e=>e.row===w.sr && e.col===w.sc) || null;
}

function buildGrid(){
  gridEl.style.gridTemplateColumns=`repeat(${P.cols},1fr)`;
  gridEl.innerHTML="";
  for(let r=0;r<P.rows;r++)for(let c=0;c<P.cols;c++){
    const g=P.grid[r][c];
    const d=document.createElement("div");
    d.className="cell"+(g?"":" block");
    if(g){
      d.dataset.r=r; d.dataset.c=c;
      if(g.num){ const n=document.createElement("span"); n.className="num"; n.textContent=g.num; d.appendChild(n); }
      const t=document.createElement("span"); t.className="lt"; d.appendChild(t);
    }
    gridEl.appendChild(d);
  }
}
function cellDiv(r,c){ return gridEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`); }

function renderLetters(){
  for(let r=0;r<P.rows;r++)for(let c=0;c<P.cols;c++){
    if(!isCell(r,c)) continue;
    const dv=cellDiv(r,c); const lt=dv.querySelector(".lt");
    lt.textContent=state[r][c]||"";
    dv.classList.remove("good","bad");
  }
}
function highlight(){
  gridEl.querySelectorAll(".cell.hl,.cell.cur").forEach(e=>e.classList.remove("hl","cur"));
  const w=wordAt(cur.r,cur.c,dir); if(!w) return;
  w.cells.forEach(({r,c})=>cellDiv(r,c).classList.add("hl"));
  cellDiv(cur.r,cur.c).classList.remove("hl"); cellDiv(cur.r,cur.c).classList.add("cur");
  const e=entryFor(cur.r,cur.c,dir);
  if(e){ $("clueMeta").textContent=(dir==="A"?"Orizontal ":"Vertical ")+e.num; $("clueTxt").textContent=e.clue; }
  document.querySelectorAll(".lists li").forEach(li=>li.classList.remove("activeclue"));
  if(e){ const li=document.querySelector(`.lists li[data-d="${dir}"][data-n="${e.num}"]`); if(li) li.classList.add("activeclue"); }
}
function select(r,c,toggle){
  if(!isCell(r,c)) return;
  if(toggle && cur.r===r && cur.c===c){ dir = dir==="A"?"D":"A"; if(!wordAt(r,c,dir)) dir=dir==="A"?"D":"A"; }
  else if(!wordAt(r,c,dir)){ dir=dir==="A"?"D":"A"; }
  cur={r,c};
  highlight();
  focusHidden();
}
function focusHidden(){ try{ hidden.value=""; hidden.focus({preventScroll:true}); }catch(e){} }

function advance(){
  const w=wordAt(cur.r,cur.c,dir); if(!w) return;
  const i=w.cells.findIndex(x=>x.r===cur.r&&x.c===cur.c);
  for(let j=i+1;j<w.cells.length;j++){ if(!state[w.cells[j].r][w.cells[j].c]){ cur=w.cells[j]; highlight(); return; } }
  if(i+1<w.cells.length){ cur=w.cells[i+1]; }
  highlight();
}
function retreat(){
  const w=wordAt(cur.r,cur.c,dir); if(!w) return;
  const i=w.cells.findIndex(x=>x.r===cur.r&&x.c===cur.c);
  if(i>0){ cur=w.cells[i-1]; highlight(); }
}
function typeLetter(ch){
  ch=norm(ch); if(!ch) return;
  if(!running){ running=true; startTimer(); }
  state[cur.r][cur.c]=ch[0];
  cellDiv(cur.r,cur.c).querySelector(".lt").textContent=ch[0];
  cellDiv(cur.r,cur.c).classList.remove("good","bad");
  persist(); advance(); checkWin();
}
function del(){
  if(state[cur.r][cur.c]){ state[cur.r][cur.c]=""; cellDiv(cur.r,cur.c).querySelector(".lt").textContent=""; }
  else retreat();
  if(state[cur.r][cur.c]!==undefined){ state[cur.r][cur.c]=""; const lt=cellDiv(cur.r,cur.c).querySelector(".lt"); if(lt) lt.textContent=""; }
  cellDiv(cur.r,cur.c).classList.remove("good","bad");
  persist();
}
function move(dr,dc){
  let r=cur.r+dr,c=cur.c+dc;
  while(r>=0&&r<P.rows&&c>=0&&c<P.cols&&!isCell(r,c)){ r+=dr;c+=dc; }
  if(isCell(r,c)){ dir = dr!==0?"D":"A"; if(!wordAt(r,c,dir)) dir=dir==="A"?"D":"A"; cur={r,c}; highlight(); focusHidden(); }
}

function persist(){ store[pi]={g:state.map(row=>row.map(x=>x||"")), t:secs, done:solvedOnce}; save(); markSolvedClues(); }

function checkWin(){
  for(let r=0;r<P.rows;r++)for(let c=0;c<P.cols;c++){
    if(isCell(r,c) && norm(state[r][c])!==P.grid[r][c].ch) return false;
  }
  running=false; solvedOnce=true; persist();
  $("mTime").textContent=$("timer").textContent;
  $("overlay").classList.add("on");
  syncNav();
  return true;
}
function wordSolved(e,d){
  const w=wordAt(e.row,e.col,d); if(!w) return false;
  return w.cells.every(({r,c})=>norm(state[r][c])===P.grid[r][c].ch);
}
function markSolvedClues(){
  P.across.forEach(e=>{ const li=document.querySelector(`.lists li[data-d="A"][data-n="${e.num}"]`); if(li) li.classList.toggle("solved",wordSolved(e,"A")); });
  P.down.forEach(e=>{ const li=document.querySelector(`.lists li[data-d="D"][data-n="${e.num}"]`); if(li) li.classList.toggle("solved",wordSolved(e,"D")); });
}

function buildLists(){
  const mk=(list,d,el)=>{ el.innerHTML=""; list.forEach(e=>{
    const li=document.createElement("li"); li.dataset.d=d; li.dataset.n=e.num;
    li.innerHTML=`<b>${e.num}</b><span>${e.clue}</span>`;
    li.onclick=()=>{ dir=d; select(e.row,e.col,false); };
    el.appendChild(li);
  });};
  mk(P.across,"A",$("listA")); mk(P.down,"D",$("listD"));
}

const DOMAINS=[]; PUZZLES.forEach(p=>{const t=p.theme||p.cat||"Teme"; if(!DOMAINS.includes(t))DOMAINS.push(t);});
const LVLORDER={"Ușor":0,"Mediu":1,"Greu":2};
let navDom="", navLvl="";
function levelsFor(dom){ const s=[]; PUZZLES.forEach(p=>{ if((p.theme||p.cat||"")===dom){ const l=p.level||""; if(!s.includes(l))s.push(l); } }); s.sort((a,b)=>(LVLORDER[a]??9)-(LVLORDER[b]??9)); return s; }
function idxFor(dom,lvl){ const a=[]; PUZZLES.forEach((p,i)=>{ if((p.theme||p.cat||"")===dom && (p.level||"")===lvl) a.push(i); }); return a; }
function buildNav(){
  const sel=$("domain"); sel.innerHTML="";
  DOMAINS.forEach(d=>{ const o=document.createElement("option"); o.value=d; o.textContent=d; sel.appendChild(o); });
  sel.onchange=()=>{ navDom=sel.value; navLvl=levelsFor(navDom)[0]||""; renderLevels(); renderChips(); const ix=idxFor(navDom,navLvl); if(ix.length) loadPuzzle(ix[0]); };
}
function renderLevels(){
  const box=$("levels"); if(!box) return; box.innerHTML="";
  const lb=$("lvlLabel"); if(lb) lb.textContent=/Englez/.test(navDom)?"Tema":"Dificultate";
  levelsFor(navDom).forEach(l=>{
    const b=document.createElement("button"); b.className="lvl"+(l===navLvl?" on":""); b.textContent=l||"Joacă";
    b.onclick=()=>{ navLvl=l; renderLevels(); renderChips(); const ix=idxFor(navDom,navLvl); if(ix.length) loadPuzzle(ix[0]); };
    box.appendChild(b);
  });
}
function renderChips(){
  const box=$("chips"); if(!box) return; box.innerHTML="";
  const ix=idxFor(navDom,navLvl);
  if(ix.length<=1){ box.style.display="none"; return; }
  box.style.display="flex";
  ix.forEach((i,k)=>{ const b=document.createElement("button"); b.className="chip"+(i===pi?" on":""); const done=store[i]&&store[i].done; b.innerHTML=(done?iconMarkup("check"):"")+(k+1); b.onclick=()=>loadPuzzle(i); box.appendChild(b); });
}
function syncNav(){
  const p=PUZZLES[pi]; navDom=p.theme||p.cat||""; navLvl=p.level||"";
  const sel=$("domain"); if(sel) sel.value=navDom;
  renderLevels(); renderChips();
}

function firstClue(){
  if(P.across.length){ dir="A"; select(P.across[0].row,P.across[0].col,false); }
  else if(P.down.length){ dir="D"; select(P.down[0].row,P.down[0].col,false); }
}
function cycleClue(step){
  const order=[...P.across.map(e=>({e,d:"A"})),...P.down.map(e=>({e,d:"D"}))];
  const e=entryFor(cur.r,cur.c,dir);
  let idx=order.findIndex(o=>o.d===dir && o.e.num===(e?e.num:-1));
  if(idx<0) idx=0;
  idx=(idx+step+order.length)%order.length;
  dir=order[idx].d; select(order[idx].e.row,order[idx].e.col,false);
}

function loadPuzzle(i){
  pi=i; P=PUZZLES[i];
  state=Array.from({length:P.rows},()=>Array(P.cols).fill(""));
  secs=0; running=false; solvedOnce=false;
  if(store[i]){
    if(store[i].g) store[i].g.forEach((row,r)=>row.forEach((v,c)=>{ if(isCell(r,c)) state[r][c]=v||""; }));
    secs=store[i].t||0; solvedOnce=!!store[i].done;
  }
  buildGrid(); buildLists(); renderLetters(); renderTimer();
  firstClue(); markSolvedClues(); syncNav();
  if(timerId){clearInterval(timerId);timerId=null;}
  startTimer(); if(secs>0&&!solvedOnce) running=false;
}

/* events */
gridEl.addEventListener("click",e=>{
  const dv=e.target.closest(".cell"); if(!dv||dv.classList.contains("block")) return;
  select(+dv.dataset.r,+dv.dataset.c,true);
});
hidden.addEventListener("input",e=>{
  const v=e.target.value; e.target.value="";
  for(const ch of v){ const n=norm(ch); if(n) typeLetter(n); }
});
hidden.addEventListener("keydown",e=>{
  if(e.key==="Backspace"){ e.preventDefault(); del(); }
  else if(e.key==="ArrowRight"){ e.preventDefault(); move(0,1); }
  else if(e.key==="ArrowLeft"){ e.preventDefault(); move(0,-1); }
  else if(e.key==="ArrowDown"){ e.preventDefault(); move(1,0); }
  else if(e.key==="ArrowUp"){ e.preventDefault(); move(-1,0); }
  else if(e.key===" "||e.key==="Enter"){ e.preventDefault(); dir=dir==="A"?"D":"A"; if(!wordAt(cur.r,cur.c,dir)) dir=dir==="A"?"D":"A"; highlight(); }
  else if(/^[a-zA-Z]$/.test(e.key)){ /* handled by input on mobile; desktop: */ }
});
document.addEventListener("keydown",e=>{
  if(document.activeElement===hidden) return;
  if(/^[a-zA-Z]$/.test(e.key)){ typeLetter(e.key); }
  else if(e.key==="Backspace"){ e.preventDefault(); del(); }
});

$("prevClue").onclick=()=>cycleClue(-1);
$("nextClue").onclick=()=>cycleClue(1);

$("bCheck").onclick=()=>{
  let anyWrong=false;
  for(let r=0;r<P.rows;r++)for(let c=0;c<P.cols;c++){
    if(!isCell(r,c)) continue; const dv=cellDiv(r,c); dv.classList.remove("good","bad");
    if(state[r][c]){ if(norm(state[r][c])===P.grid[r][c].ch) dv.classList.add("good"); else {dv.classList.add("bad");anyWrong=true;} }
  }
  setTimeout(()=>gridEl.querySelectorAll(".good,.bad").forEach(e=>e.classList.remove("good","bad")),1600);
};
/* ---- sistem indicii: 3 gratis/zi, apoi reclamă (slot AdMob) sau Premium ---- */
const FREE_HINTS=3;
function _today(){return new Date().toISOString().slice(0,10);}
let hintsLeft=FREE_HINTS;
try{const h=JSON.parse(localStorage.getItem("ic_hints")||"null"); if(h&&h.date===_today())hintsLeft=h.left;}catch(e){}
function saveHints(){try{localStorage.setItem("ic_hints",JSON.stringify({date:_today(),left:hintsLeft}));}catch(e){}}
function renderHints(){const b=$("hintbar"); if(b) b.innerHTML=iconMarkup("lightbulb")+" Indicii azi: <b>"+hintsLeft+"</b>/"+FREE_HINTS;}
function useHint(fn){ if(hintsLeft>0){ hintsLeft--; saveHints(); renderHints(); fn(); } else { openAd(); } }
$("bHint").onclick=()=>useHint(()=>{
  state[cur.r][cur.c]=P.grid[cur.r][cur.c].ch;
  cellDiv(cur.r,cur.c).querySelector(".lt").textContent=P.grid[cur.r][cur.c].ch;
  if(!running){running=true;startTimer();}
  persist(); advance(); checkWin();
});
$("bReveal").onclick=()=>useHint(()=>{
  const w=wordAt(cur.r,cur.c,dir); if(!w){ hintsLeft++; saveHints(); renderHints(); return; }
  w.cells.forEach(({r,c})=>{ state[r][c]=P.grid[r][c].ch; cellDiv(r,c).querySelector(".lt").textContent=P.grid[r][c].ch; });
  persist(); checkWin(); highlight();
});
/* reclamă recompensată — simulată pe web; la Android se înlocuiește cu AdMob rewarded */
let adTimer=null;
function openAd(){ const ov=$("adOverlay"); if(!ov)return; ov.classList.add("on");
  let t=5; const cd=$("adCount"),claim=$("adClaim");
  claim.disabled=true; claim.textContent="Așteaptă "+t+"s…"; cd.textContent=t;
  if(adTimer)clearInterval(adTimer);
  adTimer=setInterval(()=>{ t--; if(t<=0){ clearInterval(adTimer);adTimer=null; cd.innerHTML=iconMarkup("check"); claim.disabled=false; claim.textContent="Revendică +3 indicii"; } else { cd.textContent=t; claim.textContent="Așteaptă "+t+"s…"; } },1000);
}
function closeAd(){ const ov=$("adOverlay"); if(ov)ov.classList.remove("on"); if(adTimer){clearInterval(adTimer);adTimer=null;} }
$("adClaim").onclick=()=>{ if(hintsLeft<FREE_HINTS)hintsLeft=FREE_HINTS; saveHints(); renderHints(); closeAd(); toast("+3 indicii","check"); };
$("adClose").onclick=closeAd;
$("adPremium").onclick=()=>toast("Premium — în curând","sparkles");
$("bClear").onclick=()=>{
  for(let r=0;r<P.rows;r++)for(let c=0;c<P.cols;c++){ if(isCell(r,c)){ state[r][c]=""; } }
  secs=0; running=false; solvedOnce=false;
  renderLetters(); renderTimer(); markSolvedClues(); persist(); highlight();
};
$("mClose").onclick=()=>$("overlay").classList.remove("on");
$("mNext").onclick=()=>{ $("overlay").classList.remove("on"); loadPuzzle((pi+1)%PUZZLES.length); };

const SHARE_URL="https://playludiq.com/integrame.html";
function toast(msg,iconId){const t=$("toast");t.textContent=msg;if(iconId)t.insertAdjacentHTML("afterbegin",iconMarkup(iconId));t.classList.add("show");clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove("show"),1800);}
$("bRandom").onclick=()=>{let n;do{n=Math.floor(Math.random()*PUZZLES.length);}while(PUZZLES.length>1&&n===pi);loadPuzzle(n);};
$("bShare").onclick=async()=>{try{if(navigator.share){await navigator.share({title:"Careuri & Rebus",text:"Joacă integrame și rebus gratis:",url:SHARE_URL});}else{await navigator.clipboard.writeText(SHARE_URL);toast("Link copiat","check");}}catch(e){try{await navigator.clipboard.writeText(SHARE_URL);toast("Link copiat","check");}catch(_){toast(SHARE_URL);}}};
const REPORT_FORM_URL="https://forms.gle/wpvRtTFxxNjmib5j6";
let liked=false; try{liked=localStorage.getItem("ic_liked")==="1";}catch(e){}
function renderLike(){const b=$("bLike"); b.innerHTML='<svg class="icon'+(liked?" icon--filled":"")+'" aria-hidden="true"><use href="assets/icons/icons.svg#heart"/></svg> Îmi place'; b.classList.toggle("on",liked);}
$("bLike").onclick=()=>{liked=!liked; try{localStorage.setItem("ic_liked",liked?"1":"0");}catch(e){} renderLike(); if(liked) toast("Mulțumesc!","heart");};
renderLike();
$("bReport").onclick=()=>{
  if(REPORT_FORM_URL){ const a=document.createElement("a"); a.href=REPORT_FORM_URL; a.target="_blank"; a.rel="noopener"; a.click(); }
  else { toast("Formular de raportare — în curând"); }
};
buildNav();
renderHints();
(function(){var st=0;try{var d=new URLSearchParams(location.search).get('d');if(d){var k=PUZZLES.findIndex(function(x){return (x.theme||x.cat)===d;});if(k>=0)st=k;}}catch(e){} loadPuzzle(st);})();
