/* PlayLudiq · Ceasul · game logic, moved as-is */
const $=id=>document.getElementById(id);
const iconMarkup=id=>'<svg class="icon" aria-hidden="true"><use href="assets/icons/icons.svg#'+id+'"/></svg>';
const SUITS=[{s:"♠",c:"black"},{s:"♥",c:"red"},{s:"♦",c:"red"},{s:"♣",c:"black"}];
const RANKS=[{r:"A",v:1},{r:"2",v:2},{r:"3",v:3},{r:"4",v:4},{r:"5",v:5},{r:"6",v:6},{r:"7",v:7},{r:"8",v:8},{r:"9",v:9},{r:"10",v:10},{r:"J",v:11},{r:"D",v:12},{r:"K",v:13}];
let piles,active,revealed,kings,autoT;

function deal(){
  let d=[];for(const su of SUITS)for(const rk of RANKS)d.push({r:rk.r,v:rk.v,s:su.s,c:su.c});
  for(let i=d.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[d[i],d[j]]=[d[j],d[i]];}
  piles=[];for(let i=0;i<13;i++)piles.push({down:[],up:[]});
  for(let i=0;i<52;i++)piles[i%13].down.push(d[i]);
  active=12;revealed=0;kings=0;stopAuto();$("ov").classList.remove("on");layout();render();
}
function layout(){
  const cl=$("clock");cl.innerHTML="";
  const sz=cl.clientWidth;const cx=sz/2,cy=sz/2;const R=sz/2-42;
  for(let i=0;i<13;i++){
    const el=document.createElement("div");el.className="pile";el.id="pile"+i;el.dataset.i=i;
    let x=cx,y=cy;
    if(i<12){const hour=i+1;const a=hour*30*Math.PI/180;x=cx+R*Math.sin(a);y=cy-R*Math.cos(a);}
    el.style.left=x+"px";el.style.top=y+"px";
    cl.appendChild(el);
  }
}
function render(){
  for(let i=0;i<13;i++){
    const el=$("pile"+i);if(!el)continue;el.className="pile"+(i===active?" active":"");
    const p=piles[i];const label=i<12?(i+1):"K";
    let html='<div class="hr">'+label+'</div>';
    if(p.up.length){const c=p.up[p.up.length-1];html+='<div class="up '+c.c+'"><div class="r">'+c.r+'</div><div class="s">'+c.s+'</div></div>';}
    else if(p.down.length){html+='<div class="down"></div>';}
    else {html+='<div class="seat"></div>';}
    if(p.down.length)html+='<div class="cnt">'+p.down.length+'</div>';
    el.innerHTML=html;
    el.onclick=(i===active&&p.down.length)?step:null;
  }
  $("sRev").textContent=revealed;$("sK").textContent=kings;
}
function step(){
  const p=piles[active];
  if(!p.down.length){stopAuto();return;}
  const card=p.down.pop();
  const h=card.v===13?12:card.v-1;
  piles[h].up.push(card);revealed++;
  if(card.v===13)kings++;
  active=h;render();
  if(revealed===52){stopAuto();win();return;}
  if(!piles[active].down.length){stopAuto();setTimeout(lose,350);}
}
function win(){$("ovT").innerHTML=iconMarkup("trophy")+" Felicitări!";$("ovP").textContent="Ai întors toate cele 52 de cărți! Pasiența a reușit — se spune că ți se împlinește dorința.";$("ov").classList.add("on");}
function lose(){$("ovT").textContent="Ceasul s-a oprit";$("ovP").textContent="A ieșit al "+kings+"-lea Pop și nu mai ai de unde trage. Ai întors "+revealed+" cărți. Mai încearcă!";$("ov").classList.add("on");}
function stopAuto(){if(autoT){clearInterval(autoT);autoT=null;}$("bAuto").innerHTML=iconMarkup("play")+" Auto";}
$("bStep").onclick=()=>{if(piles[active].down.length)step();};
$("bAuto").onclick=()=>{if(autoT){stopAuto();}else{$("bAuto").textContent="Stop";autoT=setInterval(()=>{if(piles[active].down.length)step();else stopAuto();},420);}};
$("bNew").onclick=deal;$("ovNew").onclick=deal;
$("bRules").onclick=()=>$("rules").classList.add("on");
$("rulesClose").onclick=()=>$("rules").classList.remove("on");
$("rules").onclick=e=>{if(e.target.id==="rules")$("rules").classList.remove("on");};
window.addEventListener("resize",()=>{if(piles){layout();render();}});
deal();
