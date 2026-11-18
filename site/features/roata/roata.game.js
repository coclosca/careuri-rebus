/* PlayLudiq · Roata Cuvintelor · game logic, moved as-is */
(function(){
var $=function(i){return document.getElementById(i);};
var iconMarkup=function(id){return '<svg class="icon" aria-hidden="true"><use href="assets/icons/icons.svg#'+id+'"/></svg>';};
var VOW={A:1,E:1,I:1,O:1,U:1};
function isL(ch){return ch>="A"&&ch<="Z";}
// proverbe / maxime (fara diacritice, MAJUSCULE)
var LIST=[
 {t:"VORBA DULCE MULT ADUCE",a:"Proverb romanesc"},
 {t:"OMUL SFINTESTE LOCUL",a:"Proverb romanesc"},
 {t:"APA TRECE PIETRELE RAMAN",a:"Proverb romanesc"},
 {t:"GRABA STRICA TREABA",a:"Proverb romanesc"},
 {t:"PRIETENUL LA NEVOIE SE CUNOASTE",a:"Proverb romanesc"},
 {t:"BUTURUGA MICA RASTOARNA CARUL MARE",a:"Proverb romanesc"},
 {t:"PICATURA MICA GAURESTE PIATRA TARE",a:"Proverb romanesc"},
 {t:"NU LASA PE MAINE CE POTI FACE AZI",a:"Proverb romanesc"},
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
 {t:"TOT PASAREA PE LIMBA EI PIERE",a:"Proverb romanesc"},
 {t:"LUPUL ISI SCHIMBA PARUL DAR NARAVUL BA",a:"Proverb romanesc"},
 {t:"CINE SE SCOALA DE DIMINEATA DEPARTE AJUNGE",a:"Proverb romanesc"},
 {t:"CINE FUGE DUPA DOI IEPURI NU PRINDE NICIUNUL",a:"Proverb romanesc"},
 {t:"CUNOASTE-TE PE TINE INSUTI",a:"Socrate"},
 {t:"STIU CA NU STIU NIMIC",a:"Socrate"},
 {t:"AM VENIT AM VAZUT AM INVINS",a:"Iulius Cezar"},
 {t:"OMUL ESTE MASURA TUTUROR LUCRURILOR",a:"Protagoras"},
 {t:"INDOIALA E INCEPUTUL INTELEPCIUNII",a:"Aristotel"},
 {t:"GRABESTE-TE INCET",a:"Imparatul Augustus"}
];
var KROWS=[["A","B","C","D","E","F","G","H","I","J"],["K","L","M","N","O","P","Q","R","S","T"],["U","V","W","X","Y","Z"]];

var cur=null, vLeft=3, cLeft=4, revealed={}, used={}, score=0, solved=false, usedLetters=0;

function norm(s){return s.toUpperCase().replace(/[^A-Z]/g,"");}
function newRound(){
  cur=LIST[Math.random()*LIST.length|0];
  vLeft=3;cLeft=4;revealed={};used={};solved=false;usedLetters=0;
  $("cat").textContent=cur.a;
  $("endOv").classList.remove("on");$("guessOv").classList.remove("on");
  $("hint").textContent="Alege litere, apoi apasă Ghicește!";
  render();renderKb();
}
function render(){
  $("vLeft").textContent=vLeft;$("cLeft").textContent=cLeft;$("score").textContent=score;
  var box=$("board");box.innerHTML="";var word=null;
  for(var i=0;i<cur.t.length;i++){
    var ch=cur.t[i];
    if(ch===" "){word=null;continue;}
    if(!word){word=document.createElement("div");word.className="word";box.appendChild(word);}
    if(!isL(ch)){var pu=document.createElement("div");pu.className="punc";pu.textContent=ch;word.appendChild(pu);continue;}
    var t=document.createElement("div");
    var show = solved || revealed[ch];
    t.className="tile"+(show?(VOW[ch]?" tile vow":""):" blank");
    t.textContent=show?ch:"";
    word.appendChild(t);
  }
}
function renderKb(){
  var kb=$("kb");kb.innerHTML="";
  KROWS.forEach(function(row){
    var r=document.createElement("div");r.className="krow";
    row.forEach(function(L){
      var b=document.createElement("button");
      b.className="key"+(VOW[L]?" vow":"")+(used[L]?(cur.t.indexOf(L)>=0?" hit":" miss"):"");
      if(used[L])b.className+=" used";
      b.textContent=L;b.onclick=function(){pick(L);};
      r.appendChild(b);
    });
    kb.appendChild(r);
  });
}
function pick(L){
  if(solved||used[L])return;
  var isV=!!VOW[L];
  if(isV && vLeft<=0){flash("Nu mai ai vocale. Apasă Ghicește soluția.");return;}
  if(!isV && cLeft<=0){flash("Nu mai ai consoane. Apasă Ghicește soluția.");return;}
  used[L]=1; if(isV)vLeft--; else cLeft--; usedLetters++;
  var exists=cur.t.indexOf(L)>=0;
  if(exists){revealed[L]=1;flash("Da! „"+L+"\" apare în proverb.");} else {flash("„"+L+"\" nu există. Ai pierdut o alegere.");}
  render();renderKb();
  // auto win if everything revealed
  if(allRevealed()){doWin(true);}
}
function allRevealed(){
  for(var i=0;i<cur.t.length;i++){var ch=cur.t[i];if(isL(ch)&&!revealed[ch])return false;}
  return true;
}
function flash(m){$("hint").innerHTML=m;}
function doWin(auto){
  solved=true;render();
  var bonus = Math.max(1, 10 - usedLetters);
  score += bonus;
  $("score").textContent=score;
  $("endT").innerHTML = iconMarkup("trophy") + (auto? " Dezvăluit!" : " Corect!");
  $("endAuthor").innerHTML='„'+cur.t+'" <span>— '+cur.a+'</span><br><span>+'+bonus+' puncte</span>';
  $("endOv").classList.add("on");
}
function reveal(){ solved=true;render();$("endT").textContent="Soluția";$("endAuthor").innerHTML='„'+cur.t+'" <span>— '+cur.a+'</span>';$("endOv").classList.add("on"); }

// guess modal
$("guessBtn").onclick=function(){ if(solved)return; $("guessInp").value="";$("guessInp").classList.remove("bad");$("guessOv").classList.add("on");setTimeout(function(){$("guessInp").focus();},50); };
$("guessCancel").onclick=function(){$("guessOv").classList.remove("on");};
$("guessOk").onclick=function(){
  if(norm($("guessInp").value)===norm(cur.t)){ $("guessOv").classList.remove("on"); for(var i=0;i<cur.t.length;i++){var ch=cur.t[i];if(isL(ch))revealed[ch]=1;} doWin(false); }
  else { $("guessInp").classList.add("bad"); setTimeout(function(){$("guessInp").classList.remove("bad");},500); }
};
$("guessInp").addEventListener("keydown",function(e){if(e.key==="Enter")$("guessOk").click();});
$("revealBtn").onclick=reveal;
$("newBtn").onclick=newRound;
$("endNew").onclick=newRound;
$("endOv").onclick=function(e){if(e.target.id==="endOv")$("endOv").classList.remove("on");};
$("guessOv").onclick=function(e){if(e.target.id==="guessOv")$("guessOv").classList.remove("on");};
newRound();
})();
