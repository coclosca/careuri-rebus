/* PlayLudiq · Criptograma · game logic, moved as-is */
(function(){
var $=function(i){return document.getElementById(i);};
// citate: text deja fara diacritice, MAJUSCULE; a = autor
var QUOTES=[
 {t:"OMUL SFINTESTE LOCUL",a:"Proverb romanesc"},
 {t:"VORBA DULCE MULT ADUCE",a:"Proverb romanesc"},
 {t:"APA TRECE PIETRELE RAMAN",a:"Proverb romanesc"},
 {t:"GRABA STRICA TREABA",a:"Proverb romanesc"},
 {t:"PRIETENUL LA NEVOIE SE CUNOASTE",a:"Proverb romanesc"},
 {t:"CINE SE SCOALA DE DIMINEATA DEPARTE AJUNGE",a:"Proverb romanesc"},
 {t:"BUTURUGA MICA RASTOARNA CARUL MARE",a:"Proverb romanesc"},
 {t:"PICATURA MICA GAURESTE PIATRA TARE",a:"Proverb romanesc"},
 {t:"NU LASA PE MAINE CE POTI FACE AZI",a:"Proverb romanesc"},
 {t:"LUPUL ISI SCHIMBA PARUL DAR NARAVUL BA",a:"Proverb romanesc"},
 {t:"MINCIUNA ARE PICIOARE SCURTE",a:"Proverb romanesc"},
 {t:"POMUL SE CUNOASTE DUPA ROADE",a:"Proverb romanesc"},
 {t:"FIERUL SE BATE CAT E CALD",a:"Proverb romanesc"},
 {t:"PAZA BUNA TRECE PRIMEJDIA REA",a:"Proverb romanesc"},
 {t:"OCHII CARE NU SE VAD SE UITA",a:"Proverb romanesc"},
 {t:"DUPA FAPTA SI RASPLATA",a:"Proverb romanesc"},
 {t:"NEVOIA INVATA PE OM",a:"Proverb romanesc"},
 {t:"CAPUL PLECAT SABIA NU-L TAIE",a:"Proverb romanesc"},
 {t:"MESERIA E BRATARA DE AUR",a:"Proverb romanesc"},
 {t:"AI CARTE AI PARTE",a:"Proverb romanesc"},
 {t:"BINE FACI BINE GASESTI",a:"Proverb romanesc"},
 {t:"CINE FUGE DUPA DOI IEPURI NU PRINDE NICIUNUL",a:"Proverb romanesc"},
 {t:"TOT PASAREA PE LIMBA EI PIERE",a:"Proverb romanesc"},
 {t:"GURA LUMII NUMAI PAMANTUL O ASTUPA",a:"Proverb romanesc"},
 {t:"CUNOASTE-TE PE TINE INSUTI",a:"Socrate"},
 {t:"STIU CA NU STIU NIMIC",a:"Socrate"},
 {t:"AM VENIT AM VAZUT AM INVINS",a:"Iulius Cezar"},
 {t:"GRABESTE-TE INCET",a:"Imparatul Augustus"},
 {t:"OMUL ESTE MASURA TUTUROR LUCRURILOR",a:"Protagoras"},
 {t:"NIMENI NU SE SCALDA DE DOUA ORI IN ACELASI RAU",a:"Heraclit"},
 {t:"STIINTA FARA CONSTIINTA E RUINA SUFLETULUI",a:"Rabelais"},
 {t:"CELE MAI MARI CALATORII INCEP CU UN SINGUR PAS",a:"Lao Zi"},
 {t:"NU EXISTA VANT PRIELNIC PENTRU CEL CE NU STIE INCOTRO MERGE",a:"Seneca"},
 {t:"INDOIALA E INCEPUTUL INTELEPCIUNII",a:"Aristotel"}
];
var ALPHA="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
var KROWS=[["A","B","C","D","E","F","G","H","I"],["J","K","L","M","N","O","P","Q","R"],["S","T","U","V","W","X","Y","Z"]];
var cipher={}, decode={}, plain="", codeStr="", guess={}, locked={}, curSel=-1, cells=[], hints=3, solved=false;

function shuffledPerm(){ // derangement-ish over A-Z (no fixed point)
  while(true){
    var p=ALPHA.slice();
    for(var i=p.length-1;i>0;i--){var j=Math.random()*(i+1)|0;var t=p[i];p[i]=p[j];p[j]=t;}
    var ok=true;for(var k=0;k<26;k++){if(p[k]===ALPHA[k]){ok=false;break;}}
    if(ok)return p;
  }
}
function newGame(){
  var q=QUOTES[Math.random()*QUOTES.length|0];
  plain=q.t; curAuthor=q.a;
  var perm=shuffledPerm(); cipher={}; decode={};
  for(var i=0;i<26;i++){cipher[ALPHA[i]]=perm[i];decode[perm[i]]=ALPHA[i];}
  // build code string (cipher text)
  codeStr=""; for(var c=0;c<plain.length;c++){var ch=plain[c];codeStr+=(ch>="A"&&ch<="Z")?cipher[ch]:ch;}
  guess={}; locked={}; curSel=-1; hints=3; solved=false;
  $("hints").textContent=hints; $("winBox").classList.add("hidden"); $("author").textContent="";
  render();
}
var curAuthor="";

function render(){
  var box=$("puzzle"); box.innerHTML=""; cells=[];
  var word=null;
  for(var i=0;i<codeStr.length;i++){
    var ch=codeStr[i], orig=plain[i];
    if(orig===" "){ word=null; continue; }
    if(!(ch>="A"&&ch<="Z")){ // punctuation
      if(!word){word=document.createElement("div");word.className="word";box.appendChild(word);}
      var pu=document.createElement("div");pu.className="punc";pu.textContent=ch;word.appendChild(pu);continue;
    }
    if(!word){word=document.createElement("div");word.className="word";box.appendChild(word);}
    var cell=document.createElement("div");cell.className="cell";cell.dataset.code=ch;cell.dataset.pos=i;
    var g=guess[ch]||"";
    cell.innerHTML='<div class="box">'+(g||"")+'</div><div class="code">'+ch+'</div>';
    (function(pos){cell.onclick=function(){selectPos(pos);};})(i);
    word.appendChild(cell); cells.push({el:cell,code:ch,pos:i});
    if(locked[ch])cell.classList.add("lock");
  }
  // selection highlight
  if(curSel>=0){var selCode=codeStr[curSel];
    cells.forEach(function(c){if(c.pos===curSel)c.el.classList.add("sel");else if(c.code===selCode)c.el.classList.add("same");});
  }
  // progress
  var distinct={},done={};
  for(var j=0;j<codeStr.length;j++){var cc=codeStr[j];if(cc>="A"&&cc<="Z"){distinct[cc]=1;if(guess[cc])done[cc]=1;}}
  $("prog").textContent=Object.keys(done).length+"/"+Object.keys(distinct).length;
  // keyboard used state
  var used={};for(var k in guess){if(guess[k])used[guess[k]]=1;}
  [].forEach.call(document.querySelectorAll(".key[data-l]"),function(b){b.classList.toggle("used",!!used[b.dataset.l]&&!solved);});
  $("hintrow").innerHTML=curSel>=0?("Cod selectat: <b>"+codeStr[curSel]+"</b> — alege litera lui"):"Apasă o căsuță ca să începi";
}
function selectPos(pos){ if(solved)return; var ch=codeStr[pos]; if(locked[ch]){curSel=pos;render();return;} curSel=pos; render(); }
function nextUnsolved(){ // move selection to next cell without a guess
  if(curSel<0)return; var start=cells.findIndex(function(c){return c.pos===curSel;});
  for(var n=1;n<=cells.length;n++){var c=cells[(start+n)%cells.length];if(!guess[c.code]&&!locked[c.code]){curSel=c.pos;return;}}
}
function setLetter(L){
  if(solved||curSel<0)return; var code=codeStr[curSel]; if(locked[code])return;
  // 1-1: if L already used by another code, clear that one
  for(var c in guess){if(guess[c]===L&&c!==code)delete guess[c];}
  guess[code]=L; nextUnsolved(); render(); checkWin();
}
function backspace(){ if(solved||curSel<0)return; var code=codeStr[curSel]; if(locked[code])return; delete guess[code]; render(); }
function checkWin(){
  var ok=true;
  for(var i=0;i<codeStr.length;i++){var cc=codeStr[i];if(cc>="A"&&cc<="Z"){if(guess[cc]!==plain[i]){ok=false;break;}}}
  if(ok){solved=true;curSel=-1;$("winBox").classList.remove("hidden");$("author").innerHTML='„'+plain+'" <span>— '+curAuthor+'</span>';
    cells.forEach(function(c){c.el.classList.add("done");});render();}
}
function giveHint(){
  if(solved||hints<=0)return;
  // find a code whose guess is wrong/empty
  var cand=[];var seen={};
  for(var i=0;i<codeStr.length;i++){var cc=codeStr[i];if(cc>="A"&&cc<="Z"&&!seen[cc]){seen[cc]=1;if(guess[cc]!==decode[cc])cand.push(cc);}}
  if(!cand.length)return;
  var code=cand[Math.random()*cand.length|0];
  // clear any other code using that letter
  var L=decode[code];for(var c in guess){if(guess[c]===L&&c!==code)delete guess[c];}
  guess[code]=L; locked[code]=1; hints--; $("hints").textContent=hints; render(); checkWin();
}
function verify(){
  if(solved)return;
  cells.forEach(function(c){c.el.classList.remove("bad");if(guess[c.code]&&guess[c.code]!==decode[c.code])c.el.classList.add("bad");});
  setTimeout(function(){cells.forEach(function(c){c.el.classList.remove("bad");});},1100);
}
function solveAll(){
  for(var i=0;i<codeStr.length;i++){var cc=codeStr[i];if(cc>="A"&&cc<="Z")guess[cc]=decode[cc];}
  solved=true;curSel=-1;$("winBox").classList.add("hidden");$("author").innerHTML='„'+plain+'" <span>— '+curAuthor+'</span>';
  render();cells.forEach(function(c){c.el.classList.add("done");});
}
// keyboard
var kb=$("kb");
KROWS.forEach(function(row,ri){
  var r=document.createElement("div");r.className="krow";
  if(ri===2){var del=document.createElement("button");del.className="key wide";del.textContent="⌫";del.onclick=backspace;r.appendChild(del);}
  row.forEach(function(L){var b=document.createElement("button");b.className="key";b.dataset.l=L;b.textContent=L;b.onclick=function(){setLetter(L);};r.appendChild(b);});
  kb.appendChild(r);
});
// physical keyboard
addEventListener("keydown",function(e){
  var k=e.key.toUpperCase();
  if(k.length===1&&k>="A"&&k<="Z"){setLetter(k);e.preventDefault();}
  else if(e.key==="Backspace"){backspace();e.preventDefault();}
});
$("newBtn").onclick=newGame;
$("hintBtn").onclick=giveHint;
$("checkBtn").onclick=verify;
$("solveBtn").onclick=solveAll;
newGame();
})();
