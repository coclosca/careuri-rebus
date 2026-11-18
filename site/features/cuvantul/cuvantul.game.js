/* PlayLudiq · Cuvântul zilei · game logic, moved as-is */
const ANS=DATA.answers, VALID=new Set(DATA.valid); DATA.answers.forEach(w=>VALID.add(w));
const $=i=>document.getElementById(i);
const iconMarkup=id=>'<svg class="icon" aria-hidden="true"><use href="assets/icons/icons.svg#'+id+'"/></svg>';
const EPOCH=new Date(2026,9,12);
function dayNum(){const n=new Date();const a=new Date(n.getFullYear(),n.getMonth(),n.getDate());return Math.floor((a-EPOCH)/864e5);}
const DAY=dayNum(), NO=DAY+1, DAILY=ANS[((DAY%ANS.length)+ANS.length)%ANS.length];
const ROWS=6, COLS=5;
let target=DAILY, mode="daily", archDay=-1;
let guesses=[], cur="", done=false, win=false;

// ---- storage ----
function loadState(){try{const s=JSON.parse(localStorage.getItem("pl_wordle"));if(s&&s.day===DAY){guesses=s.guesses||[];done=!!s.done;win=!!s.win;}}catch(e){}}
function saveState(){if(mode!=="daily")return;try{localStorage.setItem("pl_wordle",JSON.stringify({day:DAY,guesses,done,win}));}catch(e){}}
function loadStats(){try{return JSON.parse(localStorage.getItem("pl_wordle_stats"))||{};}catch(e){return{};}}
function saveStats(s){try{localStorage.setItem("pl_wordle_stats",JSON.stringify(s));}catch(e){}}

// ---- build grid + keyboard ----
function buildGrid(){const g=$("grid");g.innerHTML="";for(let r=0;r<ROWS;r++){const row=document.createElement("div");row.className="row";row.id="row"+r;for(let c=0;c<COLS;c++){const cell=document.createElement("div");cell.className="cell";cell.id="c"+r+"_"+c;row.appendChild(cell);}g.appendChild(row);}}
const KEYS=[["Q","W","E","R","T","Y","U","I","O","P"],["A","S","D","F","G","H","J","K","L"],["↵","Z","X","C","V","B","N","M","⌫"]];
function buildKb(){const kb=$("kb");kb.innerHTML="";KEYS.forEach(r=>{const row=document.createElement("div");row.className="kr";r.forEach(k=>{const b=document.createElement("button");const special=(k==="↵"||k==="⌫");b.className="key"+(special?" wide":"")+(k==="↵"?" enter":"");b.textContent=(k==="↵"?"↵ ENTER":k);b.dataset.k=k;b.onclick=()=>press(k);row.appendChild(b);});kb.appendChild(row);});}

function toast(t){const e=$("toast");e.textContent=t;e.classList.add("on");clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove("on"),1800);}
function shakeRow(){const r=$("row"+guesses.length);if(r){r.classList.remove("shake");void r.offsetWidth;r.classList.add("shake");}}

function renderRow(r,word,marks){for(let c=0;c<COLS;c++){const cell=$("c"+r+"_"+c);cell.textContent=word[c]||"";if(marks){cell.classList.add(marks[c]);}else{cell.classList.toggle("fill",!!word[c]);}}}
function colorMarks(guess){const marks=Array(COLS).fill("absent");const t=target.split("");const left={};
  for(let i=0;i<COLS;i++){if(guess[i]===t[i]){marks[i]="good";t[i]=null;}else{left[guess[i]]=(left[guess[i]]||0);}}
  for(let i=0;i<COLS;i++){if(marks[i]==="good")continue;const idx=t.indexOf(guess[i]);if(idx>-1){marks[i]="warn";t[idx]=null;}}
  return marks;}
function colorKeys(guess,marks){const rank={absent:0,warn:1,good:2};for(let i=0;i<COLS;i++){const kb=document.querySelector('.key[data-k="'+guess[i]+'"]');if(!kb)continue;const cums=['absent','warn','good'];const cur=kb.classList.contains('good')?2:kb.classList.contains('warn')?1:kb.classList.contains('absent')?0:-1;if(rank[marks[i]]>cur){kb.classList.remove('good','warn','absent');kb.classList.add(marks[i]);}}}

function restore(){let r=0;for(const gw of guesses){const marks=colorMarks(gw);renderRow(r,gw,marks);colorKeys(gw,marks);r++;}if(!done&&r<ROWS){/*current row*/}}

function press(k){
  if(done)return;
  if(k==="⌫"){cur=cur.slice(0,-1);renderRow(guesses.length,cur,null);return;}
  if(k==="↵"){submit();return;}
  if(/^[A-Z]$/.test(k)&&cur.length<COLS){cur+=k;renderRow(guesses.length,cur,null);const cell=$("c"+guesses.length+"_"+(cur.length-1));cell.classList.add("pop");setTimeout(()=>cell.classList.remove("pop"),90);}
}
function submit(){
  if(cur.length<COLS){toast("Scrie un cuvânt de 5 litere");shakeRow();return;}
  if(!VALID.has(cur)){toast("Cuvântul nu e în listă — încearcă altul");shakeRow();return;}
  const r=guesses.length;const marks=colorMarks(cur);
  renderRow(r,cur,marks);colorKeys(cur,marks);
  guesses.push(cur);
  if(cur===target){win=true;done=true;finish();}
  else if(guesses.length>=ROWS){done=true;finish();}
  cur="";saveState();
}

function updateStatsEls(ids,st){const played=st.played||0,wins=st.wins||0;const pct=played?Math.round(wins/played*100):0;
  $(ids[0]).textContent=played;$(ids[1]).textContent=pct+"%";$(ids[2]).textContent=st.streak||0;$(ids[3]).textContent=st.max||0;}

function wordForDay(d){return ANS[((d%ANS.length)+ANS.length)%ANS.length];}
function loadArch(){try{return JSON.parse(localStorage.getItem("pl_wordle_arch"))||{};}catch(e){return{};}}
function saveArch(a){try{localStorage.setItem("pl_wordle_arch",JSON.stringify(a));}catch(e){}}
function closeOverlays(){["endOvl","archOvl","statsOvl","helpOvl"].forEach(x=>$(x).classList.remove("on"));}
function resetBoard(){guesses=[];cur="";done=false;win=false;buildGrid();buildKb();}
function finish(){
  const daily=(mode==="daily"), arch=(mode==="archive");
  if(daily){
    const st=loadStats();
    if(st.lastDay!==DAY){
      st.played=(st.played||0)+1;
      if(win){st.wins=(st.wins||0)+1;st.streak=(st.lastDay===DAY-1?(st.streak||0):0)+1;st.max=Math.max(st.max||0,st.streak);}
      else{st.streak=0;}
      st.lastDay=DAY;saveStats(st);
    }
  } else if(arch){const a=loadArch();a[archDay]={done:true,win:win};saveArch(a);}
  setTimeout(()=>{
    $("endTitle").textContent=win?(["Genial!","Excelent!","Bravo!","Bine!","Uf, la limită!","Scăpat ca prin urechile acului!"][guesses.length-1]||"Bravo!"):"Altădată!";
    $("endWord").textContent=win?("în "+guesses.length+"/6"):target;
    $("endMsg").textContent=win?(daily?"Ai ghicit cuvântul zilei!":"Ai ghicit cuvântul!"):("Cuvântul era: "+target);
    $("statsEnd").style.display=daily?"flex":"none";
    $("shareBtn").style.display=daily?"block":"none";
    $("cdWrap").style.display=daily?"block":"none";
    $("backDaily").style.display=daily?"none":"block";
    $("playPastBtn").innerHTML=iconMarkup("calendar")+(daily?" Joacă din zilele trecute":" Altă zi din arhivă");
    $("playPastBtn").style.display=(NO>1)?"block":"none";
    if(daily){updateStatsEls(["sPlayed","sWin","sStreak","sMax"],loadStats());startCd();}
    $("endOvl").classList.add("on");
  },win?350:650);
}
function playArchive(d){mode="archive";archDay=d;target=wordForDay(d);closeOverlays();resetBoard();}
function backToDaily(){mode="daily";target=DAILY;closeOverlays();loadState();buildGrid();buildKb();restore();if(done)finish();}
function openArchive(){
  const list=$("archList");list.innerHTML="";
  if(NO<=1){list.innerHTML='<p class="archive-empty">Încă nu sunt zile trecute. Revino mâine!</p>';}
  else{const a=loadArch();
    for(let p=NO-1;p>=1;p--){const idx=p-1;const rec=a[idx];
      const b=document.createElement("button");b.className="archrow";
      const st=rec?(rec.win?'<span class="ok">'+iconMarkup("check")+' câștigat</span>':'<span class="ko">'+iconMarkup("x")+' pierdut</span>'):'<span class="np">joacă '+iconMarkup("arrow-right")+'</span>';
      b.innerHTML='<span>Ziua '+p+'</span>'+st;b.onclick=()=>playArchive(idx);list.appendChild(b);}}
  closeOverlays();$("archOvl").classList.add("on");
}
function shareText(){
  let s="Cuvântul zilei #"+NO+" "+(win?guesses.length:"X")+"/6\n\n";
  for(const gw of guesses){const m=colorMarks(gw);s+=m.map(x=>x==="good"?"🟩":x==="warn"?"🟨":"⬛").join("")+"\n";}
  s+="\nplayludiq.com";return s;}
function doShare(){const t=shareText();if(navigator.share){navigator.share({text:t}).catch(()=>{});}else{try{navigator.clipboard.writeText(t);toast("Copiat! Lipește oriunde");}catch(e){toast("Nu s-a putut copia");}}}

let cdT;
function startCd(){clearInterval(cdT);function tick(){const n=new Date();const nx=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1);const d=nx-n;const h=String(Math.floor(d/36e5)).padStart(2,"0");const m=String(Math.floor(d%36e5/6e4)).padStart(2,"0");const s=String(Math.floor(d%6e4/1e3)).padStart(2,"0");$("cd").textContent=h+":"+m+":"+s;}tick();cdT=setInterval(tick,1000);}

// physical keyboard
addEventListener("keydown",e=>{if($("endOvl").classList.contains("on")||$("statsOvl").classList.contains("on")||$("helpOvl").classList.contains("on")||$("archOvl").classList.contains("on"))return;if(e.key==="Enter")press("↵");else if(e.key==="Backspace")press("⌫");else{const k=e.key.toUpperCase();if(/^[A-Z]$/.test(k))press(k);}});

$("statsBtn").onclick=()=>{updateStatsEls(["s2Played","s2Win","s2Streak","s2Max"],loadStats());$("statsOvl").classList.add("on");};
$("closeStats").onclick=()=>$("statsOvl").classList.remove("on");
$("shareBtn").onclick=doShare;
$("archBtn").onclick=openArchive;
$("playPastBtn").onclick=openArchive;
$("backDaily").onclick=backToDaily;
$("closeArch").onclick=()=>$("archOvl").classList.remove("on");
$("archOvl").onclick=e=>{if(e.target.id==="archOvl")$("archOvl").classList.remove("on");};
$("helpBtn").onclick=()=>$("helpOvl").classList.add("on");
$("closeHelp").onclick=()=>{$("helpOvl").classList.remove("on");try{localStorage.setItem("pl_wordle_seen","1");}catch(e){}};
$("helpOvl").onclick=e=>{if(e.target.id==="helpOvl")$("helpOvl").classList.remove("on");};
$("endOvl").onclick=e=>{if(e.target.id==="endOvl")$("endOvl").classList.remove("on");};
$("statsOvl").onclick=e=>{if(e.target.id==="statsOvl")$("statsOvl").classList.remove("on");};

buildGrid();buildKb();loadState();restore();
try{if(!localStorage.getItem("pl_wordle_seen")&&guesses.length===0&&!done){$("helpOvl").classList.add("on");}}catch(e){}
if(done)finish();
