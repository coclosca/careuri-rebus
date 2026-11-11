/* PlayLudiq — banner de consimțământ cookies, comun tuturor paginilor */
(function(){
  var KEY='pl_consent';
  var choice=null; try{ choice=localStorage.getItem(KEY); }catch(e){}
  if(choice){ return; } // deja a ales

  var css=
    '#plCk{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:100000;width:calc(100% - 24px);max-width:440px;'+
      'background:#fffdf8;color:#23303d;border:1px solid rgba(0,0,0,.14);border-radius:16px;box-shadow:0 10px 34px rgba(0,0,0,.26);'+
      'padding:15px 16px;font:400 13.5px/1.5 "Source Sans 3",system-ui,sans-serif;animation:plUp .35s ease}'+
    '@keyframes plUp{from{opacity:0;transform:translate(-50%,14px)}to{opacity:1;transform:translate(-50%,0)}}'+
    '#plCk b{font-weight:800}#plCk a{color:#176b63;font-weight:700;text-decoration:underline}'+
    '#plCk .row{display:flex;gap:8px;margin-top:12px}'+
    '#plCk button{flex:1;appearance:none;border:1px solid var(--line,#d9cfba);border-radius:10px;padding:10px;font:700 13.5px/1 inherit;cursor:pointer;background:#f4efe3;color:#23303d}'+
    '#plCk button.ok{background:#176b63;color:#fff;border-color:#176b63}'+
    '@media(prefers-color-scheme:dark){#plCk{background:#1f2932;color:#eef2f4;border-color:rgba(255,255,255,.16)}#plCk a{color:#49b3a6}#plCk button{background:#2a3742;color:#eef2f4;border-color:#36424d}#plCk button.ok{background:#49b3a6;color:#09211d;border-color:#49b3a6}}';
  var st=document.createElement('style'); st.textContent=css; (document.head||document.documentElement).appendChild(st);

  function save(v){ try{ localStorage.setItem(KEY, v); }catch(e){} var b=document.getElementById('plCk'); if(b) b.remove(); }

  function build(){
    if(!document.body){ return setTimeout(build,40); }
    var d=document.createElement('div'); d.id='plCk';
    d.innerHTML='<div>🍪 <b>Cookies.</b> PlayLudiq folosește stocarea locală a dispozitivului ca jocurile să funcționeze. '+
      'În viitor am putea afișa reclame (Google), care pot folosi cookies. Detalii în '+
      '<a href="confidentialitate.html">Politica de confidențialitate</a>.</div>'+
      '<div class="row"><button id="plCkNo">Doar necesare</button><button class="ok" id="plCkYes">Accept</button></div>';
    document.body.appendChild(d);
    document.getElementById('plCkYes').onclick=function(){ save('all'); };
    document.getElementById('plCkNo').onclick=function(){ save('essential'); };
  }
  build();
})();
