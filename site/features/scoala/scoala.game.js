/* PlayLudiq · Teste școlare · game logic, moved as-is */
const $=i=>document.getElementById(i);
const LET=["A","B","C","D"];
let DATA=null, curMod=null, qs,idx,score,answered;

function show(id){["pickMod","pickTest","game","end"].forEach(x=>$(x).classList.toggle("hidden",x!==id));}
function setBack(mode){const b=$("back");if(mode==="menu"){b.textContent="← Meniu";b.setAttribute("href","index.html");b.onclick=null;}else{b.removeAttribute("href");b.onclick=mode;}}
const ICONS="assets/icons/icons.svg#";
// Sprite icon markup; ids are fixed strings from this file, never from data.
function icon(id){return '<svg class="icon" aria-hidden="true"><use href="'+ICONS+id+'"/></svg>';}
// Puts a sprite icon in front of plain text; the text is added as a text node.
function setIconText(el,id,text){el.innerHTML=icon(id)+" ";el.appendChild(document.createTextNode(text));}
function roman(n){return ["","I","II","III","IV","V"][n]||n;}

// ---- clase (taburi) -> materii -> module ----
const EXTRA=[{"clasa": "I", "subject": "Limba engleză · Integrame", "info": "7 integrame cu imagini", "manual": "Culori, numere, animale, fructe, jucării, familia, corpul", "href": "integrame.html?d=%F0%9F%87%AC%F0%9F%87%A7%20Englez%C4%83%20%C2%B7%20clasa%20I"}];
let classes=[], curClass=0;
function distinctClasses(){var s={},a=[];EXTRA.concat(COURSES).forEach(c=>{if(!s[c.clasa]){s[c.clasa]=1;a.push(c.clasa);}});return a;}
// Subject -> sprite icon id for the list-row tile.
function subjIcon(n){return /engl|franc/i.test(n)?"message":/biolog/i.test(n)?"heart":/muzic/i.test(n)?"disc":/matemat/i.test(n)?"grid":/rom[aâ]n/i.test(n)?"book":/istor/i.test(n)?"calendar":/geograf/i.test(n)?"flag":"graduation";}
function buildTabs(){
  classes=distinctClasses();
  const box=$("tabs");box.innerHTML="";
  classes.forEach((cl,i)=>{
    const b=document.createElement("button");b.className="tab"+(i===curClass?" active":"");
    b.textContent="Clasa "+cl;
    b.onclick=()=>selectClass(i);box.appendChild(b);
  });
}
function selectClass(i){ curClass=i; buildTabs(); showSubjects(); }
function showSubjects(){
  $("htitle").textContent="Teste școlare";
  $("ph").textContent="Alege materia";
  const box=$("mods");box.innerHTML="";
  COURSES.forEach(c=>{ if(c.clasa!==classes[curClass])return;
    const nTeste=c.modules.reduce((s,m)=>s+m.tests.length,0)+c.combined.length;
    const b=document.createElement("button");b.className="mbtn";
    b.innerHTML='<span class="n">'+icon(subjIcon(c.subject))+'</span><span><span class="tt">'+c.subject+'</span><span class="mt">'+c.modules.length+' module · '+nTeste+' teste</span><span class="per">'+icon("book")+' '+c.manual+'</span></span><span class="go">'+icon("arrow-right")+'</span>';
    b.onclick=()=>openSubject(c);box.appendChild(b);
  });
  EXTRA.forEach(c=>{ if(c.clasa!==classes[curClass])return;
    const b=document.createElement("a");b.className="mbtn";b.href=c.href;
    b.innerHTML='<span class="n">'+icon(subjIcon(c.subject))+'</span><span><span class="tt">'+c.subject+'</span><span class="mt">'+c.info+'</span><span class="per">'+icon("layout-grid")+' '+c.manual+'</span></span><span class="go">'+icon("arrow-right")+'</span>';
    box.appendChild(b);
  });
  setBack("menu");show("pickMod");
}
function openSubject(c){ DATA=c; $("htitle").textContent=DATA.subject; showModules(); }
function showModules(){ $("ph").textContent="Alege modulul"; buildMods(); setBack(()=>showSubjects()); show("pickMod"); }
function goMods(){ showModules(); }

// ---- module ----
function buildMods(){
  const box=$("mods");box.innerHTML="";
  DATA.modules.forEach(m=>{
    const b=document.createElement("button");b.className="mbtn";
    b.innerHTML='<span class="n">'+roman(m.id)+'</span><span><span class="tt">'+m.theme+'</span><span class="mt">'+m.name+' · '+m.tests.length+' teste</span><span class="per">'+icon("calendar")+' '+m.per+' · '+m.sapt+'</span></span><span class="go">'+icon("arrow-right")+'</span>';
    b.onclick=()=>openMod(m);box.appendChild(b);
  });
  const c=document.createElement("button");c.className="mbtn comb";
  c.innerHTML='<span class="n">'+icon("star")+'</span><span><span class="tt">Teste combinate</span><span class="mt">Întrebări din toate modulele · '+DATA.combined.length+' teste</span></span><span class="go">'+icon("arrow-right")+'</span>';
  c.onclick=()=>openCombined();box.appendChild(c);
}
function openMod(m){
  curMod={name:m.name,tests:m.tests};
  $("mhTitle").textContent=m.name+" — "+m.theme;
  $("mhTheme").textContent="Conținut aliniat la manualul "+DATA.manual+".";
  setIconText($("mhPer"),"calendar",m.per+" · "+m.sapt);
  const comps=[...new Set(m.tests.flatMap(t=>t.cmp))].sort();
  $("mhChips").innerHTML=comps.map(c=>'<span class="chip">Comp. '+c+'</span>').join("");
  renderTests(m.tests);
  setBack(()=>goMods());
  show("pickTest");
}
function openCombined(){
  curMod={name:"Teste combinate",tests:DATA.combined};
  $("mhTitle").textContent="Teste combinate";
  $("mhTheme").textContent="Întrebări amestecate din toate modulele.";
  $("mhPer").textContent="";
  const comps=[...new Set(DATA.combined.flatMap(t=>t.cmp))].sort();
  $("mhChips").innerHTML=comps.map(c=>'<span class="chip">Comp. '+c+'</span>').join("");
  renderTests(DATA.combined);
  setBack(()=>goMods());
  show("pickTest");
}
function renderTests(tests){
  const box=$("tests");box.innerHTML="";
  tests.forEach((t,i)=>{
    const b=document.createElement("button");b.className="mbtn";
    b.innerHTML='<span class="n">'+(i+1)+'</span><span><span class="tt">'+t.n+'</span><span class="mt">'+t.q.length+' întrebări</span><span class="chips">'+t.cmp.map(c=>'<span class="chip">'+c+'</span>').join("")+'</span></span><span class="go">'+icon("arrow-right")+'</span>';
    b.onclick=()=>startTest(t);box.appendChild(b);
  });
}

// ---- quiz ----
function startTest(t){
  qs=t.q;idx=0;score=0;
  $("scoreWrap").classList.remove("hidden");
  setBack(()=>{show("pickTest");$("scoreWrap").classList.add("hidden");});
  show("game");render();
}
function render(){
  const q=qs[idx];answered=false;
  $("qn").textContent="Întrebarea "+(idx+1)+" / "+qs.length;
  $("cmp").textContent="Competența "+q.cmp;
  $("qt").textContent=q.q;$("barI").style.width=(idx/qs.length*100)+"%";$("score").textContent=score;
  const box=$("opts");box.innerHTML="";
  q.opts.forEach((o,i)=>{const b=document.createElement("button");b.className="opt";b.innerHTML='<span class="lt">'+LET[i]+'</span><span>'+o+'</span>';b.onclick=()=>pick(b,i);box.appendChild(b);});
  $("explain").classList.add("hidden");$("fact").classList.add("hidden");$("next").classList.add("hidden");
}
function pick(btn,i){
  if(answered)return;answered=true;const q=qs[idx];
  [...document.querySelectorAll(".opt")].forEach((b,j)=>{if(j===q.c)b.classList.add("correct");else if(b===btn)b.classList.add("wrong");else b.classList.add("dim");b.onclick=null;});
  if(i===q.c){score++;$("score").textContent=score;}
  $("explainText").textContent=q.e;$("explain").classList.remove("hidden");
  if(q.f){$("factText").textContent=q.f;$("fact").classList.remove("hidden");}
  $("next").classList.remove("hidden");
}
$("next").onclick=()=>{idx++;if(idx>=qs.length)finish();else render();};
function finish(){
  $("barI").style.width="100%";$("scoreWrap").classList.add("hidden");
  const tot=qs.length;$("finalScore").textContent=score+"/"+tot;
  const pct=score/tot;let m,mi;if(pct>=.9){m="Excelent!";mi="trophy";}else if(pct>=.7){m="Foarte bine!";mi="thumbs-up";}else if(pct>=.5){m="Bine, mai exersează";mi="smile";}else{m="Mai citește lecția";mi="book";}
  setIconText($("finalMsg"),mi,m);$("finalSub").textContent=curMod.name+" · ai răspuns corect la "+score+" din "+tot+".";
  setBack(()=>show("pickTest"));
  show("end");
}
$("againTest").onclick=()=>show("pickTest");
$("againMod").onclick=()=>goMods();

buildTabs();selectClass(0);
