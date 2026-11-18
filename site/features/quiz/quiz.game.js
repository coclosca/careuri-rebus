/* PlayLudiq · Quiz · game logic, moved as-is */
const $=id=>document.getElementById(id);
const icon=id=>'<svg class="icon" aria-hidden="true"><use href="assets/icons/icons.svg#'+id+'"/></svg>';
const THEMES=[{k:"__ALL__",icon:"shuffle",t:"Toate temele"},{k:"Astronomie",icon:"star",t:"Astronomie"},{k:"Geografie",icon:"flag",t:"Geografie"},{k:"Istorie",icon:"book",t:"Istorie"},{k:"Natură",icon:"sparkles",t:"Natură"},{k:"Sport",icon:"trophy",t:"Sport"},{k:"Muzică & Artă",icon:"palette",t:"Muzică & Artă"},{k:"Mitologie",icon:"zap",t:"Mitologie"},{k:"Cultură generală",icon:"lightbulb",t:"Cultură gen."}];
const N=10;let qs,idx,score,answered,curLevel="Mediu",curTheme;
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;}
function buildThemes(){const box=$("themes");box.innerHTML="";THEMES.forEach(th=>{const b=document.createElement("button");b.className="tbtn"+(th.k==="__ALL__"?" all":"");b.innerHTML='<span class="e">'+icon(th.icon)+'</span><span class="t">'+th.t+'</span>';b.onclick=()=>startTheme(th.k);box.appendChild(b);});}
document.querySelectorAll("#levelsel button").forEach(b=>{b.onclick=()=>{curLevel=b.dataset.l;document.querySelectorAll("#levelsel button").forEach(x=>x.classList.remove("on"));b.classList.add("on");};});
function startTheme(k){
  curTheme=k;
  let main=POOL.filter(x=>x.lvl===curLevel&&(k==="__ALL__"||x.theme===k));shuffle(main);
  let chosen=main.slice(0,N);
  if(chosen.length<N){const extra=shuffle(POOL.filter(x=>x.lvl===curLevel&&!chosen.includes(x)));chosen=chosen.concat(extra.slice(0,N-chosen.length));}
  qs=chosen;idx=0;score=0;
  $("pick").classList.add("hidden");$("end").classList.add("hidden");$("game").classList.remove("hidden");
  render();
}
function distractors(q){
  const same=POOL.filter(x=>x.a!==q.a);
  let cand=same.filter(x=>x.sub===q.sub);
  if(cand.length<3)cand=cand.concat(same.filter(x=>x.theme===q.theme&&x.sub!==q.sub));
  if(cand.length<3)cand=cand.concat(same);
  // dedupe, then keep the plausible set (similar length) and pick 3 at random from it
  const seen=new Set(),uniq=[];
  for(const x of cand){if(x.a!==q.a&&!seen.has(x.a)){seen.add(x.a);uniq.push(x);}}
  uniq.sort((a,b)=>Math.abs(a.a.length-q.a.length)-Math.abs(b.a.length-q.a.length));
  const plausible=uniq.slice(0,Math.max(3,Math.min(8,uniq.length)));
  shuffle(plausible);
  return plausible.slice(0,3).map(x=>x.a);
}
function factFor(q){
  if(FACTS[q.a])return FACTS[q.a];
  const tf=THEME_FACTS[q.theme];
  if(tf&&tf.length)return tf[Math.random()*tf.length|0];
  return null;
}
function render(){
  const q=qs[idx];answered=false;
  $("qn").textContent="Întrebarea "+(idx+1)+" din "+qs.length+" · "+curLevel;
  $("qt").textContent=q.c;$("bar").style.width=(idx/qs.length*100)+"%";$("score").textContent=score;
  const opts=shuffle([q.a,...distractors(q)]);
  const box=$("opts");box.innerHTML="";
  opts.forEach(o=>{const b=document.createElement("button");b.className="opt";b.textContent=o;b.onclick=()=>pick(b,o,q.a);box.appendChild(b);});
  $("fact").classList.add("hidden");$("next").classList.add("hidden");
}
function pick(btn,choice,correct){
  if(answered)return;answered=true;
  document.querySelectorAll(".opt").forEach(b=>{if(b.textContent===correct)b.classList.add("correct");else if(b===btn)b.classList.add("wrong");else b.classList.add("dim");b.onclick=null;});
  if(choice===correct){score++;$("score").textContent=score;}
  const f=factFor(qs[idx]);
  if(f){$("factText").textContent=f;$("fact").classList.remove("hidden");}
  $("next").classList.remove("hidden");
}
$("next").onclick=()=>{idx++;if(idx>=qs.length)finish();else render();};
function finish(){
  $("bar").style.width="100%";$("game").classList.add("hidden");$("end").classList.remove("hidden");
  const tot=qs.length;$("finalScore").textContent=score+"/"+tot;
  const pct=score/tot;let m;if(pct>=.9)m="Geniu! "+icon("trophy");else if(pct>=.7)m="Foarte bine! "+icon("thumbs-up");else if(pct>=.5)m="Binișor "+icon("smile");else m="Mai exersezi "+icon("target");
  $("finalMsg").innerHTML=m;$("finalSub").textContent="Nivel "+curLevel+" · ai răspuns corect la "+score+" din "+tot+".";
}
$("again").onclick=()=>{$("end").classList.add("hidden");$("game").classList.add("hidden");$("pick").classList.remove("hidden");$("bar").style.width="0";};
buildThemes();
