/* PlayLudiq · Potriviri · game logic, moved as-is */
(function(){
var $=function(i){return document.getElementById(i);};
function icon(id){return '<svg class="icon" aria-hidden="true"><use href="assets/icons/icons.svg#'+id+'"/></svg>';}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.random()*(i+1)|0;var t=a[i];a[i]=a[j];a[j]=t;}return a;}
// fiecare puzzle: 4 grupe in ordinea dificultatii (0=usor ... 3=greu)
var PUZZLES=[
 [ {c:"Fructe",w:["MĂR","PARĂ","PRUNĂ","CIREAȘĂ"]},
   {c:"Culori",w:["ROȘU","VERDE","ALBASTRU","GALBEN"]},
   {c:"Zile ale săptămânii",w:["LUNI","MARȚI","JOI","VINERI"]},
   {c:"Animale de companie",w:["CÂINE","PISICĂ","HAMSTER","PAPAGAL"]} ],
 [ {c:"Planete",w:["MARTE","VENUS","SATURN","JUPITER"]},
   {c:"Instrumente muzicale",w:["VIOARĂ","PIAN","CHITARĂ","TOBĂ"]},
   {c:"Sporturi",w:["FOTBAL","TENIS","ÎNOT","BOX"]},
   {c:"Orașe din România",w:["CLUJ","IAȘI","BRAȘOV","SIBIU"]} ],
 [ {c:"Legume",w:["MORCOV","CEAPĂ","ROȘIE","CARTOF"]},
   {c:"Metale",w:["AUR","ARGINT","FIER","CUPRU"]},
   {c:"Forme geometrice",w:["CERC","PĂTRAT","TRIUNGHI","ROMB"]},
   {c:"Râuri din România",w:["OLT","MUREȘ","SIRET","PRUT"]} ],
 [ {c:"Luni ale anului",w:["IANUARIE","MARTIE","MAI","AUGUST"]},
   {c:"Păsări",w:["VRABIE","CIOARĂ","BARZĂ","RÂNDUNICĂ"]},
   {c:"Părți ale corpului",w:["MÂNĂ","PICIOR","COT","GENUNCHI"]},
   {c:"Mijloace de transport",w:["MAȘINĂ","TREN","AVION","VAPOR"]} ],
 [ {c:"Dulciuri",w:["CIOCOLATĂ","BOMBOANĂ","PRĂJITURĂ","ÎNGHEȚATĂ"]},
   {c:"Materii școlare",w:["MATEMATICĂ","ISTORIE","BIOLOGIE","GEOGRAFIE"]},
   {c:"Anotimpuri",w:["PRIMĂVARĂ","VARĂ","TOAMNĂ","IARNĂ"]},
   {c:"Mobilă",w:["MASĂ","SCAUN","DULAP","PAT"]} ],
 [ {c:"Băuturi",w:["APĂ","CEAI","CAFEA","SUC"]},
   {c:"Îmbrăcăminte",w:["CĂMAȘĂ","PANTALON","ROCHIE","FUSTĂ"]},
   {c:"Insecte",w:["ALBINĂ","FLUTURE","FURNICĂ","GREIER"]},
   {c:"Forme de relief",w:["MUNTE","DEAL","CÂMPIE","PODIȘ"]} ]
];

var puz=null, tiles=[], sel=[], solved=[], lives=4, over=false;

function newGame(){
  puz=PUZZLES[Math.random()*PUZZLES.length|0];
  tiles=[]; puz.forEach(function(g,gi){ g.w.forEach(function(w){ tiles.push({w:w,g:gi}); }); });
  shuffle(tiles);
  sel=[]; solved=[]; lives=4; over=false;
  $("endOv").classList.remove("on"); $("hint").textContent=""; $("hint").className="hint";
  render();
}
function render(){
  $("lives").textContent=lives;
  // solved bands
  var sb="";solved.forEach(function(gi){ var g=puz[gi]; sb+='<div class="band g'+gi+'"><div class="c">'+g.c+'</div><div class="w">'+g.w.join(" · ")+'</div></div>'; });
  $("solved").innerHTML=sb;
  // grid of remaining
  var box=$("grid");box.innerHTML="";
  tiles.forEach(function(t,i){
    if(solved.indexOf(t.g)>=0) return; // hidden (în band)
    var el=document.createElement("div");
    el.className="cell"+(sel.indexOf(i)>=0?" sel":"");
    el.textContent=t.w; el.setAttribute("data-i",i);
    el.onclick=function(){ toggle(i); };
    box.appendChild(el);
  });
  $("checkBtn").disabled = sel.length!==4 || over;
}
function toggle(i){
  if(over)return;
  var k=sel.indexOf(i);
  if(k>=0) sel.splice(k,1);
  else { if(sel.length>=4) return; sel.push(i); }
  $("hint").textContent=""; $("hint").className="hint";
  render();
}
function check(){
  if(sel.length!==4||over)return;
  var gs=sel.map(function(i){return tiles[i].g;});
  var g0=gs[0], allSame=gs.every(function(x){return x===g0;});
  if(allSame){
    solved.push(g0); sel=[];
    $("hint").innerHTML=icon("check")+" Corect!"; $("hint").className="hint";
    render();
    if(solved.length===4){ return setTimeout(win,400); }
  } else {
    // one away?
    var cnt={}; gs.forEach(function(x){cnt[x]=(cnt[x]||0)+1;});
    var max=Math.max.apply(null,Object.keys(cnt).map(function(k){return cnt[k];}));
    lives--;
    shakeSel();
    if(max===3){ $("hint").textContent="Aproape! O singură greșeală."; }
    else { $("hint").textContent="Nu e grupul corect."; }
    $("hint").className="hint warn";
    $("lives").textContent=lives;
    if(lives<=0){ return setTimeout(lose,500); }
  }
}
function shakeSel(){
  [].forEach.call($("grid").querySelectorAll(".cell.sel"),function(el){ el.classList.add("shake"); });
  setTimeout(function(){ sel=[]; render(); },450);
}
function win(){
  over=true; $("endT").innerHTML=icon("trophy")+" Rezolvat!";
  $("endP").textContent="Ai găsit toate cele 4 grupe"+(lives===4?" fără nicio greșeală! Perfect!":" cu "+(4-lives)+" greșeli.");
  $("endOv").classList.add("on");
}
function lose(){
  over=true;
  // dezvaluie tot
  solved=[0,1,2,3]; render();
  $("endT").textContent="Gata viețile";
  $("endP").textContent="Iată grupele corecte. Încearcă alt joc!";
  $("endOv").classList.add("on");
}
$("checkBtn").onclick=check;
$("shuffleBtn").onclick=function(){ if(over)return; shuffle(tiles); render(); };
$("clearBtn").onclick=function(){ sel=[]; render(); };
$("newBtn").onclick=newGame;
$("endNew").onclick=newGame;
$("endOv").onclick=function(e){if(e.target.id==="endOv")$("endOv").classList.remove("on");};
newGame();
})();
