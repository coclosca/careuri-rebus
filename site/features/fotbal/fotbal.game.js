/* PlayLudiq · Quiz Fotbal · game logic, moved as-is */
const $=i=>document.getElementById(i);
const icon=(id,extra)=>'<svg class="icon'+(extra?" "+extra:"")+'" aria-hidden="true"><use href="assets/icons/icons.svg#'+id+'"/></svg>';
const TPQ=15; // secunde pe intrebare
let qs,idx,score,streak,best,chosen=12,timer,tleft,answered,catSel='all';
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;}
$("lenrow").onclick=e=>{const b=e.target.closest('button');if(!b)return;chosen=+b.dataset.n;[...$("lenrow").children].forEach(x=>x.classList.toggle('on',x===b));};
$("catrow").onclick=e=>{const b=e.target.closest('button');if(!b)return;catSel=b.dataset.c;[...$("catrow").children].forEach(x=>x.classList.toggle('on',x===b));};
$("startBtn").onclick=begin; $("again").onclick=begin;
function begin(){qs=shuffle(catSel==='all'?ALL:ALL.filter(q=>q.cat===catSel)).slice(0,chosen).map(q=>{const o=shuffle(q.opts.map((t,i)=>({t,ok:i===q.c})));return Object.assign({},q,{opts:o.map(x=>x.t),c:o.findIndex(x=>x.ok)});});idx=0;score=0;streak=0;$("start").classList.add("hidden");$("end").classList.add("hidden");$("game").classList.remove("hidden");$("hud").style.visibility="visible";$("timewrap").style.visibility="visible";render();}
function render(){
  const q=qs[idx];answered=false;
  $("cat").textContent=q.cat+" · "+(idx+1)+"/"+qs.length;
  $("qt").textContent=q.q;
  $("score").textContent=score;$("streak").textContent=streak;
  const box=$("opts");box.innerHTML="";
  const ICON=["triangle","diamond","disc"].map(id=>icon(id,"icon--filled"));
  q.opts.forEach((o,i)=>{const b=document.createElement("button");b.className="opt o"+i;b.innerHTML='<span class="ic">'+ICON[i]+'</span><span>'+o+'</span>';b.onclick=()=>pick(i,b);box.appendChild(b);});
  $("fact").classList.add("hidden");$("next").classList.add("hidden");
  // timer
  tleft=TPQ;$("time").style.width="100%";
  clearInterval(timer);
  timer=setInterval(()=>{tleft-=0.1;const pct=Math.max(0,tleft/TPQ*100);$("time").style.width=pct+"%";if(tleft<=0){clearInterval(timer);timeout();}},100);
}
function lockOpts(correct,chosenI){
  [...document.querySelectorAll(".opt")].forEach((b,i)=>{b.onclick=null;if(i===correct)b.classList.add("win");else if(i===chosenI)b.classList.add("lose");else b.classList.add("mut");});
}
function showAfter(q){
  if(q.f){$("factText").textContent=q.f;$("fact").classList.remove("hidden");}
  $("next").classList.remove("hidden");
}
function pick(i,btn){
  if(answered)return;answered=true;clearInterval(timer);
  const q=qs[idx];
  if(i===q.c){
    const bonus=Math.round(tleft*10),pts=100+bonus;score+=pts;streak++;
    if(streak>=2){flash(icon("zap")+" x"+streak);}
    $("score").textContent=score;$("streak").textContent=streak;
  }else{streak=0;$("streak").textContent=0;}
  lockOpts(q.c,i);showAfter(q);
}
function timeout(){
  if(answered)return;answered=true;streak=0;$("streak").textContent=0;
  const q=qs[idx];lockOpts(q.c,-1);showAfter(q);
}
function flash(t){const f=$("flash");f.innerHTML=t;f.classList.remove("go");void f.offsetWidth;f.classList.add("go");}
$("next").onclick=()=>{idx++;if(idx>=qs.length)finish();else render();};
function finish(){
  clearInterval(timer);$("game").classList.add("hidden");$("end").classList.remove("hidden");
  $("hud").style.visibility="hidden";$("timewrap").style.visibility="hidden";
  $("finalScore").textContent=score;
  const max=qs.length*250, pct=score/max;
  let emo,msg;
  if(pct>=.75){emo="trophy";msg="Enciclopedie de fotbal!";}
  else if(pct>=.5){emo="sparkles";msg="Foarte bine!";}
  else if(pct>=.3){emo="thumbs-up";msg="Bun! Mai încearcă.";}
  else{emo="smile";msg="Se poate și mai sus!";}
  $("endEmo").innerHTML=icon(emo);$("endMsg").textContent=msg;
  $("endSub").textContent="Ai strâns "+score+" puncte din "+qs.length+" întrebări.";
}
$("hud").style.visibility="hidden";$("timewrap").style.visibility="hidden";
