/* PlayLudiq · Piramida · game logic, moved as-is */
const $=id=>document.getElementById(id);
const iconMarkup=id=>'<svg class="icon" aria-hidden="true"><use href="assets/icons/icons.svg#'+id+'"/></svg>';
const SUITS=[{s:"♠",c:"black"},{s:"♥",c:"red"},{s:"♦",c:"red"},{s:"♣",c:"black"}];
const RANKS=[{r:"A",v:1},{r:"2",v:2},{r:"3",v:3},{r:"4",v:4},{r:"5",v:5},{r:"6",v:6},{r:"7",v:7},{r:"8",v:8},{r:"9",v:9},{r:"10",v:10},{r:"J",v:11},{r:"D",v:12},{r:"K",v:13}];
let pyr, stock, waste, removed, selected, passes, pairs, startT, timer, history;

function newDeck(){
  let d=[];
  for(const su of SUITS)for(const rk of RANKS)d.push({r:rk.r,v:rk.v,s:su.s,c:su.c});
  for(let i=d.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[d[i],d[j]]=[d[j],d[i]];}
  return d;
}
function deal(){
  const d=newDeck();
  pyr=[]; let k=0;
  for(let r=0;r<7;r++){pyr[r]=[];for(let i=0;i<=r;i++)pyr[r][i]=d[k++];}
  removed=pyr.map(row=>row.map(()=>false));
  stock=d.slice(28); waste=[]; selected=null; passes=3; pairs=0; history=[];
  startT=Date.now(); clearInterval(timer); timer=setInterval(tick,1000);
  $("ov").classList.remove("on"); render(); tick();
}
function tick(){const s=(Date.now()-startT)/1000|0;$("sTime").textContent=(s/60|0)+":"+String(s%60).padStart(2,"0");}

function covered(r,i){ if(r===6)return false; return !(removed[r+1][i] && removed[r+1][i+1]); }
function isFreePyr(r,i){ return !removed[r][i] && !covered(r,i); }

function layout(){
  const board=$("board").clientWidth || 360;
  const maxW=Math.min(board, 520);
  // card width so bottom row (7 cards, slight overlap horizontally) fits
  const cw=Math.min(66, (maxW-8)/7.4);
  const ch=cw*1.42;
  const ox=cw*0.07;           // horizontal gap addition
  const voff=ch*0.44;         // vertical overlap
  const py=$("pyramid");
  py.style.height=(voff*6+ch+6)+"px";
  const totalW=maxW;
  return {cw,ch,ox,voff,totalW};
}
function render(){
  const {cw,ch,ox,voff,totalW}=layout();
  const py=$("pyramid"); py.innerHTML="";
  const stepX=cw+ox*0;        // horizontal distance between adjacent cards in a row
  const spacing=cw*1.02;
  for(let r=0;r<7;r++){
    const rowW=(r)*spacing+cw;
    const startX=(totalW-rowW)/2;
    for(let i=0;i<=r;i++){
      if(removed[r][i])continue;
      const card=pyr[r][i];
      const el=document.createElement("div");
      el.className="card "+card.c+(isFreePyr(r,i)?" free":" covered");
      el.style.width=cw+"px"; el.style.height=ch+"px";
      el.style.left=(startX+i*spacing)+"px";
      el.style.top=(r*voff)+"px";
      el.style.fontSize=(cw*0.34)+"px";
      el.innerHTML='<div class="r">'+card.r+'</div><div class="s">'+card.s+'</div>';
      if(selected&&selected.t==="pyr"&&selected.r===r&&selected.i===i)el.classList.add("sel");
      if(isFreePyr(r,i))el.onclick=()=>pick({t:"pyr",r,i,v:card.v});
      py.appendChild(el);
    }
  }
  // stock + waste
  const sc=$("stock"); sc.classList.toggle("empty",stock.length===0);
  sc.style.width=cw+"px"; sc.style.height=ch+"px";
  $("stockCnt").innerHTML=stock.length|| (passes>0?iconMarkup("restart"):"–");
  const wc=$("waste"); wc.style.width=cw+"px"; wc.style.height=ch+"px"; wc.innerHTML='<div class="lbl">Descartat</div>';
  if(waste.length){
    const card=waste[waste.length-1];
    const el=document.createElement("div");
    el.className="card "+card.c+" free"; el.style.width="100%"; el.style.height="100%";
    el.style.fontSize=(cw*0.34)+"px";
    el.innerHTML='<div class="r">'+card.r+'</div><div class="s">'+card.s+'</div>';
    if(selected&&selected.t==="waste")el.classList.add("sel");
    el.onclick=()=>pick({t:"waste",v:card.v});
    wc.appendChild(el);
  }
  $("sPairs").textContent=pairs; $("sPass").textContent=passes;
  $("hint").textContent="";
}
function snapshot(){history.push(JSON.stringify({pyr,stock,waste,removed,passes,pairs}));if(history.length>40)history.shift();}
function pick(sel){
  const val=sel.v;
  if(val===13){ snapshot(); removeCard(sel); pairs++; afterMove(); return; }
  if(!selected){ selected=sel; render(); return; }
  if(sameSel(selected,sel)){ selected=null; render(); return; }
  if(selected.v+val===13){ snapshot(); removeCard(selected); removeCard(sel); selected=null; pairs++; afterMove(); }
  else { selected=sel; render(); }
}
function sameSel(a,b){ if(a.t!==b.t)return false; if(a.t==="waste")return true; return a.r===b.r&&a.i===b.i; }
function removeCard(sel){
  if(sel.t==="pyr")removed[sel.r][sel.i]=true;
  else waste.pop();
}
function afterMove(){
  render();
  if(removed.every(row=>row.every(x=>x))){ win(); return; }
  checkDead();
}
function drawStock(){
  selected=null;
  if(stock.length>0){ snapshot(); waste.push(stock.shift()); render(); checkDead(); }
  else if(passes>1){ snapshot(); passes--; stock=waste.slice().reverse(); waste=[]; render(); }
  else { $("hint").textContent="Nu mai ai treceri prin pachet."; }
}
$("stock").onclick=drawStock;

function freeValues(){
  const vals=[];
  for(let r=0;r<7;r++)for(let i=0;i<=r;i++)if(isFreePyr(r,i))vals.push(pyr[r][i].v);
  if(waste.length)vals.push(waste[waste.length-1].v);
  return vals;
}
function hasMove(){
  const v=freeValues();
  if(v.includes(13))return true;
  for(let i=0;i<v.length;i++)for(let j=i+1;j<v.length;j++)if(v[i]+v[j]===13)return true;
  return false;
}
function checkDead(){
  if(removed.every(row=>row.every(x=>x)))return;
  if(!hasMove() && stock.length===0 && passes<=1){ lose(); }
}
function win(){ clearInterval(timer); $("ovT").innerHTML=iconMarkup("trophy")+" Felicitări!"; $("ovP").textContent="Ai demolat toată piramida. Dorința ți se împlinește!"; $("ov").classList.add("on"); }
function lose(){ clearInterval(timer); $("ovT").textContent="Joc blocat"; $("ovP").textContent="Nu mai sunt mutări posibile. Mai încearcă o dată!"; $("ov").classList.add("on"); }

$("bHint").onclick=()=>{
  const spots=[];
  for(let r=0;r<7;r++)for(let i=0;i<=r;i++)if(isFreePyr(r,i))spots.push({r,i,v:pyr[r][i].v});
  const w=waste.length?{w:true,v:waste[waste.length-1].v}:null;
  // caută pereche
  let found=null;
  for(const a of spots){ if(a.v===13){found=[a];break;} }
  if(!found)for(let x=0;x<spots.length;x++)for(let y=x+1;y<spots.length;y++)if(spots[x].v+spots[y].v===13){found=[spots[x],spots[y]];break;}
  if(!found&&w)for(const a of spots)if(a.v+w.v===13){found=[a];break;}
  if(found){ $("hint").textContent="Încearcă: "+found.map(c=>pyr[c.r][c.i].r+pyr[c.r][c.i].s).join(" + ")+(found.length===1&&found[0].v!==13?" + cartea descartată":""); }
  else $("hint").textContent=stock.length?"Nicio pereche liberă — trage o carte din pachet.":"Nicio mutare — reciclează pachetul.";
};
$("bUndo").onclick=()=>{
  if(!history.length){$("hint").textContent="Nimic de anulat.";return;}
  const s=JSON.parse(history.pop());
  pyr=s.pyr;stock=s.stock;waste=s.waste;removed=s.removed;passes=s.passes;pairs=s.pairs;selected=null;render();
};
$("bNew").onclick=deal; $("ovNew").onclick=deal;
$("bRules").onclick=()=>$("rules").classList.add("on");
$("rulesClose").onclick=()=>$("rules").classList.remove("on");
$("rules").onclick=e=>{if(e.target.id==="rules")$("rules").classList.remove("on");};
window.addEventListener("resize",()=>{if(pyr)render();});
deal();
