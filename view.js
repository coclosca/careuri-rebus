/* PlayLudiq — comutator Mobil / Desktop, comun tuturor paginilor */
(function(){
  var KEY='pl_view', root=document.documentElement;
  function apply(v){ root.setAttribute('data-view', v); }
  var saved=null; try{ saved=localStorage.getItem(KEY); }catch(e){}
  // implicit: pe ecran mare pornește pe Desktop, pe ecran mic pe Mobil
  var v = saved || (window.innerWidth>=1000 ? 'wide' : 'mobile');
  apply(v);

  var css =
    'html[data-view="wide"] body{zoom:1.3}'+
    'html[data-view="wide"] .wrap{max-width:660px}'+
    '@media(max-width:760px){html[data-view="wide"] body{zoom:1}}'+  /* niciodată zoom pe ecran mic */
    '#plView{position:fixed;top:10px;right:10px;z-index:99999;display:inline-flex;align-items:center;gap:6px;'+
      'background:rgba(255,253,248,.94);color:#23303d;border:1px solid rgba(0,0,0,.14);border-radius:999px;'+
      'padding:7px 13px;font:700 12.5px/1 system-ui,-apple-system,sans-serif;box-shadow:0 3px 12px rgba(0,0,0,.16);'+
      'cursor:pointer;-webkit-tap-highlight-color:transparent}'+
    '#plView:active{transform:scale(.96)}'+
    '@media(prefers-color-scheme:dark){#plView{background:rgba(31,41,50,.96);color:#eef2f4;border-color:rgba(255,255,255,.16)}}';
  var st=document.createElement('style'); st.textContent=css; (document.head||root).appendChild(st);

  function label(){ return root.getAttribute('data-view')==='wide' ? '💻 Desktop' : '📱 Mobil'; }
  var btn=document.createElement('button'); btn.id='plView'; btn.type='button';
  function sync(){ btn.textContent=label(); }
  btn.onclick=function(){
    var nv = root.getAttribute('data-view')==='wide' ? 'mobile' : 'wide';
    apply(nv); try{ localStorage.setItem(KEY, nv); }catch(e){} sync();
  };
  // butonul stă în <html>, în afara <body>, ca să nu fie afectat de zoom-ul pe body
  function add(){ if(root){ root.appendChild(btn); sync(); } else { setTimeout(add,30); } }
  add();
})();
