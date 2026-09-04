/** HTML pages served by the tablet LocalServer (port 3000) for TV / browser on LAN. */

export const HUB_HTML = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<meta name="theme-color" content="#0B1220"/>
<title>Totem QuickBite — Hub LAN</title>
<style>
:root { --bg:#090D16; --card:#131B2E; --border:#1E293B; --cyan:#06B6D4; --accent:#FF6B6B; --text:#F8FAFC; --muted:#94A3B8; }
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.25rem}
.wrap{max-width:540px;width:100%}
.brand{display:flex;align-items:center;gap:12px;margin-bottom:1.5rem}
.brand-icon{width:44px;height:44px;background:linear-gradient(135deg,#0F766E,#06B6D4);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px}
h1{font-size:1.35rem;font-weight:900;letter-spacing:-0.02em}
.sub{color:var(--muted);font-size:.85rem;margin-top:2px}
.cards{display:flex;flex-direction:column;gap:12px}
.card{display:flex;align-items:center;gap:16px;background:var(--card);border:1.5px solid var(--border);border-radius:16px;padding:1.1rem 1.25rem;text-decoration:none;color:inherit;transition:transform .15s ease,border-color .15s ease}
.card:hover,.card:active{border-color:var(--cyan);transform:translateY(-2px)}
.card-icon{width:48px;height:48px;border-radius:12px;background:#1E293B;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0}
.card-body strong{display:block;font-size:1.05rem;font-weight:800;color:#fff;margin-bottom:3px}
.card-body span{font-size:.82rem;color:var(--muted);line-height:1.3}
.badge{margin-left:auto;font-size:.7rem;font-weight:800;background:rgba(6,182,212,0.15);color:var(--cyan);border:1px solid rgba(6,182,212,0.3);padding:4px 10px;border-radius:999px;white-space:nowrap}
.foot{text-align:center;color:var(--muted);font-size:.78rem;margin-top:1.5rem}
</style>
</head>
<body>
<div class="wrap">
  <div class="brand">
    <div class="brand-icon">🍔</div>
    <div>
      <h1>Totem QuickBite Hub</h1>
      <div class="sub">Seleziona lo schermo da visualizzare su questo dispositivo</div>
    </div>
  </div>

  <div class="cards">
    <a class="card" href="/queue/">
      <div class="card-icon">🎫</div>
      <div class="card-body">
        <strong>Tabellone Coda & Ritiro</strong>
        <span>Numeri pronti e chiamata vocale/acustica per Smart TV</span>
      </div>
      <div class="badge">TV SALA</div>
    </a>

    <a class="card" href="/kitchen/">
      <div class="card-icon">🍳</div>
      <div class="card-body">
        <strong>KDS Monitor Cucina</strong>
        <span>Comande in tempo reale, stati di preparazione e chime</span>
      </div>
      <div class="badge">CUCINA</div>
    </a>

    <a class="card" href="/remote/">
      <div class="card-icon">🌐</div>
      <div class="card-body">
        <strong>Pannello di Amministrazione</strong>
        <span>Gestione menu, categorie, stampanti e statistiche</span>
      </div>
      <div class="badge">OPERATORE</div>
    </a>
  </div>

  <div class="foot">Totem Embedded Server · Rete Locale LAN</div>
</div>
</body>
</html>
`;

export const KITCHEN_HTML = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<meta name="theme-color" content="#0B1220"/>
<title>KDS Cucina — Totem</title>
<style>
:root{--bg:#0B1220;--card:#1E293B;--text:#F8FAFC;--muted:#94A3B8;--pending:#EAB308;--prep:#3B82F6;--ready:#22C55E;--accent:#FF6B6B}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;background:var(--bg);color:var(--text);font-family:system-ui,sans-serif;overflow:hidden}
#hdr{display:flex;align-items:center;justify-content:space-between;padding:.75rem 1.25rem;background:#111827;border-bottom:2px solid var(--accent);gap:10px}
#hdr h1{font-size:1.15rem;font-weight:900;display:flex;align-items:center;flex-wrap:nowrap;white-space:nowrap}
#hdr .meta{font-size:.85rem;color:var(--muted);white-space:nowrap;display:flex;align-items:center;gap:6px}
#dept-badge{font-size:0.75rem;font-weight:800;background:var(--accent);color:#fff;padding:3px 10px;border-radius:6px;margin-left:8px;vertical-align:middle;cursor:pointer}
#cols{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.75rem;padding:.75rem;height:calc(100% - 56px)}
.col{display:flex;flex-direction:column;min-height:0}
.col-h{font-size:.85rem;font-weight:800;letter-spacing:.06em;padding:.4rem .6rem;border-radius:8px;margin-bottom:.5rem;text-align:center}
.col-h.pending{background:rgba(234,179,8,.2);color:#FDE047}
.col-h.prep{background:rgba(59,130,246,.2);color:#93C5FD}
.col-h.ready{background:rgba(34,197,94,.2);color:#86EFAC}
.col-body{flex:1;overflow:auto;display:flex;flex-direction:column;gap:.55rem}
.ticket{background:var(--card);border-radius:12px;padding:.75rem;border-left:4px solid #64748B;animation:in .35s ease}
.ticket.pending{border-left-color:var(--pending)}
.ticket.preparing{border-left-color:var(--prep)}
.ticket.ready{border-left-color:var(--ready)}
@keyframes in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.t-num{font-size:1.6rem;font-weight:900;font-variant-numeric:tabular-nums}
.t-meta{font-size:.7rem;color:var(--muted);margin:.15rem 0 .4rem}
.t-item{font-size:.85rem;font-weight:700;margin:.2rem 0}
.t-note{font-size:.75rem;color:#FDE68A}
.t-actions{display:flex;gap:.4rem;margin-top:.55rem}
.t-actions button{flex:1;border:0;border-radius:8px;padding:.45rem;font-weight:800;font-size:.75rem;cursor:pointer;color:#0F172A}
.btn-start{background:#93C5FD}.btn-ready{background:#86EFAC}.btn-done{background:#CBD5E1}
.empty{color:var(--muted);text-align:center;padding:2rem .5rem;font-size:.85rem}
#login{position:fixed;inset:0;background:rgba(0,0,0,.75);display:none;align-items:center;justify-content:center;z-index:20}
#login.show{display:flex}
#login .box{background:#1E293B;padding:1.5rem;border-radius:14px;width:min(320px,90vw)}
#login input{width:100%;padding:.6rem;border-radius:8px;border:1px solid #334155;background:#0F172A;color:#fff;margin:.5rem 0}
#login button{width:100%;padding:.65rem;border:0;border-radius:8px;background:var(--accent);color:#fff;font-weight:800;cursor:pointer}
</style>
</head>
<body>
<div id="hdr">
  <h1>🍳 KDS <span id="dept-badge">TUTTE LE COMANDE</span></h1>
  <div class="meta"><span id="rest">Totem</span> · <span id="clock">--:--</span> · <span id="count">0</span> <span data-i18n="active">attive</span></div>
</div>
<div id="cols">
  <div class="col"><div class="col-h pending" data-i18n="pending">DA PREPARARE</div><div class="col-body" id="c-pending"></div></div>
  <div class="col"><div class="col-h prep" data-i18n="prep">IN PREPARAZIONE</div><div class="col-body" id="c-prep"></div></div>
  <div class="col"><div class="col-h ready" data-i18n="ready">PRONTO</div><div class="col-body" id="c-ready"></div></div>
</div>
<div id="login"><div class="box"><h2 style="margin-bottom:.5rem" data-i18n="pin_title">PIN operatore</h2><p style="font-size:.8rem;color:#94A3B8" data-i18n="pin_hint">Necessario per cambiare stato comanda</p><input id="pin" type="password" inputmode="numeric" placeholder="PIN"/><button id="pin-ok" data-i18n="login">Accedi</button></div></div>
<script>
(function(){
  var I18N = {
    it: { pending:'DA PREPARARE', prep:'IN PREPARAZIONE', ready:'PRONTO', active:'attive', pin_title:'PIN operatore', pin_hint:'Necessario per cambiare stato comanda', login:'Accedi', empty:'Nessuna comanda', all:'TUTTE LE COMANDE' },
    en: { pending:'TO PREPARE', prep:'IN PROGRESS', ready:'READY', active:'active', pin_title:'Operator PIN', pin_hint:'Required to change order status', login:'Sign in', empty:'No orders', all:'ALL ORDERS' },
    es: { pending:'POR PREPARAR', prep:'EN PREPARACIÓN', ready:'LISTO', active:'activas', pin_title:'PIN operador', pin_hint:'Necesario para cambiar el estado', login:'Entrar', empty:'Sin comandas', all:'TODOS LOS PEDIDOS' },
    fr: { pending:'À PRÉPARER', prep:'EN PRÉPARATION', ready:'PRÊT', active:'actives', pin_title:'PIN opérateur', pin_hint:'Requis pour changer le statut', login:'Connexion', empty:'Aucune commande', all:'TOUTES LES COMMANDES' },
    de: { pending:'VORBEREITEN', prep:'IN ZUBEREITUNG', ready:'FERTIG', active:'aktiv', pin_title:'Operator-PIN', pin_hint:'Erforderlich zum Ändern des Status', login:'Anmelden', empty:'Keine Bestellungen', all:'ALLE BESTELLUNGEN' }
  };
  var lang = (new URLSearchParams(location.search).get('lang') || navigator.language || 'it').slice(0,2).toLowerCase();
  var dict = I18N[lang] || I18N.it;
  document.querySelectorAll('[data-i18n]').forEach(function(el){ var k=el.getAttribute('data-i18n'); if(dict[k]) el.textContent=dict[k]; });
  var token=localStorage.getItem('kds_token')||'';
  var orders=[];
  var prevPendingIds=new Set();
  var audioCtx=null;
  var params=new URLSearchParams(location.search);
  var filterCats=(params.get('categories')||params.get('category_ids')||'').split(',').map(function(s){return s.trim();}).filter(Boolean);
  var currentFilterCats=filterCats;
  var deptParam=(params.get('department')||params.get('reparto')||params.get('dept')||'').trim();
  var nameParam=(params.get('name')||params.get('station')||'').trim();

  var $=function(id){return document.getElementById(id);};

  function playChime(){
    try {
      if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
      if(audioCtx.state==='suspended') audioCtx.resume();
      var osc=audioCtx.createOscillator();
      var gain=audioCtx.createGain();
      osc.type='sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    }catch(e){}
  }

  function pad(n){return String(n).padStart(2,'0')}
  function age(iso){try{var s=Math.floor((Date.now()-new Date(iso).getTime())/1000);if(s<60)return s+'s';return Math.floor(s/60)+'m'}catch(e){return ''}}
  async function api(path,opts){
    var h={'Content-Type':'application/json'};
    if(token)h['Authorization']='Bearer '+token;
    var r=await fetch(path,Object.assign({},opts||{},{headers:Object.assign({},h,(opts&&opts.headers)||{}),cache:'no-store'}));
    if(r.status===401){token='';localStorage.removeItem('kds_token');throw new Error('auth')}
    if(!r.ok)throw new Error(await r.text());
    return r.json();
  }
  async function login(){
    var pin=$('pin').value.trim();
    var data=await fetch('/api/admin/pin-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:pin})}).then(function(r){return r.json();});
    if(data.access_token){token=data.access_token;localStorage.setItem('kds_token',token);$('login').classList.remove('show');load()}
  }
  $('pin-ok').onclick=function(){login().catch(function(){alert('PIN non valido');});};
  async function setStatus(id,status){
    try{
      await api('/api/orders/'+id+'/status',{method:'PUT',body:JSON.stringify({status:status})});
      await load();
    }catch(e){
      try{
        await api('/api/admin/orders/'+id+'/status',{method:'PUT',body:JSON.stringify({status:status})});
        await load();
      }catch(err){
        if(String(err.message)==='auth'||String(err.message).includes('401')){
          $('login').classList.add('show');
        } else {
          console.warn('Status update error:', err);
        }
      }
    }
  }
  function renderCol(el,list,status){
    if(!list.length){el.innerHTML='<div class="empty">'+dict.empty+'</div>';return}
    el.innerHTML=list.map(function(o){
      var itemsList=o.items||[];
      if(currentFilterCats && currentFilterCats.length > 0){
        itemsList=itemsList.filter(function(it){
          var cid = String(it.category_id||it.product_category_id||'').trim();
          if(!cid) return true;
          return currentFilterCats.indexOf(cid)>=0;
        });
      }
      var items=itemsList.map(function(it){
        return '<div class="t-item">'+(it.quantity||1)+'× '+(it.product_name||'')+(it.removed_ingredients&&it.removed_ingredients.length?' <span class="t-note">senza '+it.removed_ingredients.join(', ')+'</span>':'')+(it.notes?' <span class="t-note">'+it.notes+'</span>':'')+'</div>';
      }).join('');
      var actions='';
      if(status==='pending')actions='<button class="btn-start" data-id="'+o.id+'" data-s="preparing">Inizia</button>';
      else if(status==='preparing')actions='<button class="btn-ready" data-id="'+o.id+'" data-s="ready">Pronto</button>';
      else actions='<button class="btn-done" data-id="'+o.id+'" data-s="completed">Completa</button>';
      var prefix = o.order_prefix ? '<span style="color:#94A3B8;font-size:1.1rem;margin-right:2px">'+o.order_prefix+'</span>' : '';
      return '<div class="ticket '+status+'"><div class="t-num">'+prefix+'#'+pad(o.order_number||0)+'</div><div class="t-meta">'+(o.order_type||'')+' · '+age(o.created_at)+'</div>'+(items||'<div class="t-item" style="opacity:0.65">Nessun articolo per questo reparto</div>')+'<div class="t-actions">'+actions+'</div></div>';
    }).join('');
    el.querySelectorAll('button[data-id]').forEach(function(b){b.onclick=function(){setStatus(b.dataset.id,b.dataset.s);};});
  }
  async function load(){
    try{
      var arr=await Promise.all([
        fetch('/api/settings').then(function(r){return r.json();}).catch(function(){return {};}),
        fetch('/api/orders/current').then(function(r){return r.json();}).catch(function(){return [];}),
      ]);
      var settings=arr[0]||{};
      var cur=arr[1]||[];
      if(settings.restaurant_name)$('rest').textContent=settings.restaurant_name;

      var depts=settings.department_kds||[];
      var foundDept=depts.find(function(x){ return x.id===deptParam || x.name===deptParam || (nameParam && x.name.toLowerCase()===nameParam.toLowerCase()); });
      var titleDisplay = nameParam || (foundDept ? foundDept.name : '');
      if(!titleDisplay) {
        if(deptParam && !/^dept_[0-9a-zA-Z_]+$/.test(deptParam)) {
          titleDisplay = deptParam;
        } else {
          titleDisplay = localStorage.getItem('kds_station_name') || dict.all;
        }
      }
      
      var activeFilterCats = [];
      if(foundDept && Array.isArray(foundDept.assigned_category_ids) && foundDept.assigned_category_ids.length > 0){
        activeFilterCats = foundDept.assigned_category_ids.map(String);
      } else if (filterCats.length > 0) {
        activeFilterCats = filterCats;
      }
      currentFilterCats = activeFilterCats;

      $('dept-badge').textContent=titleDisplay.toUpperCase();
      $('dept-badge').style.display='inline-block';
      if(titleDisplay && titleDisplay !== dict.all) {
        localStorage.setItem('kds_station_name', titleDisplay);
      }

      var rawOrders=Array.isArray(cur)?cur:[];
      if(activeFilterCats.length > 0){
        rawOrders=rawOrders.filter(function(o){
          if(!o.items || !o.items.length) return true;
          return (o.items||[]).some(function(it){
            var cid = String(it.category_id||it.product_category_id||'').trim();
            if(!cid) return true;
            return activeFilterCats.indexOf(cid)>=0;
          });
        });
      }
      orders=rawOrders;

      function normStatus(st) {
        var s = String(st || 'pending').toLowerCase().trim();
        if (s === 'preparing' || s === 'in_preparazione' || s === 'prep') return 'preparing';
        if (s === 'ready' || s === 'pronto') return 'ready';
        if (s === 'completed' || s === 'completato' || s === 'cancelled' || s === 'annullato') return 'completed';
        return 'pending';
      }

      var p=orders.filter(function(o){return normStatus(o.status)==='pending';});
      var pr=orders.filter(function(o){return normStatus(o.status)==='preparing';});
      var rd=orders.filter(function(o){return normStatus(o.status)==='ready';});

      var curPendingIds=new Set(p.map(function(o){return o.id;}));
      var hasNew=false;
      curPendingIds.forEach(function(id){
        if(!prevPendingIds.has(id)) hasNew=true;
      });
      if(hasNew && prevPendingIds.size>0){
        playChime();
      }
      prevPendingIds=curPendingIds;

      renderCol($('c-pending'),p,'pending');
      renderCol($('c-prep'),pr,'preparing');
      renderCol($('c-ready'),rd,'ready');
      $('count').textContent=String(p.length+pr.length+rd.length);
    }catch(e){console.warn(e)}
  }
  setInterval(function(){$('clock').textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});},1000);
  setInterval(load,3500);
  load();
  document.addEventListener('click', function(){if(!audioCtx) playChime();}, {once:true});
  try{if(navigator.wakeLock)navigator.wakeLock.request('screen');}catch(_){}
})();
</script>
</body>
</html>
`;

export const QUEUE_HTML = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <meta name="theme-color" content="#090D16" />
  <title>Tabellone Chiamata Ordini & Coda — Totem</title>
  <style>
    :root {
      --bg: #090D16;
      --card-bg: #131B2E;
      --card-border: #1E293B;
      --cyan: #06B6D4;
      --cyan-glow: rgba(6, 182, 212, 0.35);
      --green: #10B981;
      --green-glow: rgba(16, 185, 129, 0.35);
      --amber: #F59E0B;
      --text: #F8FAFC;
      --text-muted: #94A3B8;
      --font-display: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      --hero-bg: radial-gradient(circle at 50% 30%, #16243E 0%, #0D1525 100%);
      --num-size: clamp(6.5rem, 18vw, 18rem);
    }

    /* THEMES */
    body.theme-midnight {
      --bg: #000000;
      --card-bg: #090D16;
      --card-border: #1E293B;
      --cyan: #38BDF8;
      --cyan-glow: rgba(56, 189, 248, 0.4);
      --hero-bg: radial-gradient(circle at 50% 30%, #0F172A 0%, #000000 100%);
    }
    body.theme-light {
      --bg: #F1F5F9;
      --card-bg: #FFFFFF;
      --card-border: #CBD5E1;
      --cyan: #0284C7;
      --cyan-glow: rgba(2, 132, 199, 0.25);
      --green: #059669;
      --amber: #D97706;
      --text: #0F172A;
      --text-muted: #64748B;
      --hero-bg: radial-gradient(circle at 50% 30%, #F8FAFC 0%, #E2E8F0 100%);
    }
    body.theme-contrast {
      --bg: #000000;
      --card-bg: #18181B;
      --card-border: #FACC15;
      --cyan: #FACC15;
      --cyan-glow: rgba(250, 204, 21, 0.45);
      --green: #4ADE80;
      --amber: #FACC15;
      --text: #FFFFFF;
      --text-muted: #D4D4D8;
      --hero-bg: #0A0A0A;
    }

    /* SIZE MODIFIERS */
    body.size-giant { --num-size: clamp(9.5rem, 26vw, 28rem); }
    body.size-large { --num-size: clamp(6.5rem, 18vw, 18rem); }
    body.size-normal { --num-size: clamp(4.5rem, 13vw, 12rem); }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%; height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-display);
      overflow: hidden;
      user-select: none;
      transition: background 0.3s ease, color 0.3s ease;
    }

    #app {
      width: 100%; height: 100%;
      display: flex; flex-direction: column;
      padding: clamp(12px, 1.8vw, 24px);
      gap: clamp(10px, 1.4vw, 18px);
    }

    /* Top Bar Header */
    header {
      display: flex; align-items: center; justify-content: space-between;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: clamp(10px, 1.2vw, 16px) clamp(16px, 2vw, 28px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
    }
    .brand-box { display: flex; align-items: center; gap: 14px; }
    .brand-icon {
      width: clamp(38px, 4vw, 50px);
      height: clamp(38px, 4vw, 50px);
      background: linear-gradient(135deg, #0F766E, var(--cyan));
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: clamp(20px, 2.2vw, 28px);
      color: #fff;
    }
    .brand-name {
      font-size: clamp(1.2rem, 2.2vw, 2rem);
      font-weight: 900;
      letter-spacing: -0.02em;
      color: var(--text);
      text-transform: uppercase;
    }
    .brand-subtitle {
      font-size: clamp(0.75rem, 1vw, 0.95rem);
      color: var(--cyan);
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .header-right { display: flex; align-items: center; gap: 16px; }
    .live-badge {
      display: flex; align-items: center; gap: 8px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 6px 14px;
      border-radius: 999px;
      font-size: clamp(0.75rem, 0.95vw, 0.9rem);
      font-weight: 800;
      color: var(--green);
      letter-spacing: 0.04em;
    }
    .live-dot {
      width: 9px; height: 9px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 10px var(--green);
      animation: pulseDot 1.8s infinite;
    }
    @keyframes pulseDot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    .clock-box {
      font-size: clamp(1.1rem, 1.8vw, 1.6rem);
      font-weight: 800;
      color: var(--text);
      font-variant-numeric: tabular-nums;
      background: rgba(0,0,0,0.15);
      padding: 6px 14px;
      border-radius: 10px;
      border: 1px solid var(--card-border);
    }

    /* Main Grid */
    main {
      flex: 1; min-height: 0;
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      gap: clamp(12px, 1.6vw, 20px);
      transition: all 0.3s ease;
    }

    /* ONLY NUMBER / FULL SCREEN HERO MODE */
    body.layout-only-number main,
    body.layout-hero-only main {
      grid-template-columns: 1fr;
    }
    body.layout-only-number .side-panels,
    body.layout-hero-only .side-panels {
      display: none !important;
    }
    body.layout-only-number .hero-panel,
    body.layout-hero-only .hero-panel {
      height: 100%;
      border-radius: 24px;
    }

    /* Hero Calling Column */
    .hero-panel {
      background: var(--hero-bg);
      border: 2px solid var(--card-border);
      border-radius: 20px;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: clamp(16px, 2.5vw, 32px);
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.35);
      position: relative;
      overflow: hidden;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .hero-panel.active-call {
      border-color: var(--cyan);
      box-shadow: 0 0 50px var(--cyan-glow);
    }

    .call-label {
      font-size: clamp(1.1rem, 1.8vw, 1.6rem);
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--cyan);
      margin-bottom: clamp(6px, 1vh, 12px);
    }

    .number-display {
      font-size: var(--num-size);
      font-weight: 900;
      line-height: 0.92;
      color: var(--text);
      text-shadow: 0 4px 30px var(--cyan-glow);
      letter-spacing: -0.03em;
      margin: clamp(4px, 1vh, 12px) 0;
      font-variant-numeric: tabular-nums;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), text-shadow 0.25s ease;
    }
    .number-display.flash {
      animation: callBounce 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes callBounce {
      0% { transform: scale(0.7); opacity: 0.2; }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }

    .call-instruction {
      font-size: clamp(1rem, 1.6vw, 1.45rem);
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.04em;
      margin-top: clamp(8px, 1.5vh, 16px);
      background: rgba(6, 182, 212, 0.1);
      border: 1px solid var(--card-border);
      padding: clamp(8px, 1.2vw, 12px) clamp(16px, 2vw, 28px);
      border-radius: 999px;
    }

    /* Right Column: Ready and In-Prep */
    .side-panels {
      display: flex; flex-direction: column;
      gap: clamp(12px, 1.6vw, 20px);
      min-height: 0;
    }

    .list-card {
      flex: 1; min-height: 0;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: clamp(12px, 1.6vw, 20px);
      display: flex; flex-direction: column;
      box-shadow: 0 8px 30px rgba(0,0,0,0.25);
    }
    .list-card-header {
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .list-card-title {
      font-size: clamp(0.95rem, 1.4vw, 1.25rem);
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      display: flex; align-items: center; gap: 8px;
    }
    .ready-title { color: var(--green); }
    .prep-title { color: var(--amber); }

    .card-count-badge {
      font-size: 0.8rem;
      font-weight: 800;
      padding: 3px 9px;
      border-radius: 999px;
      background: rgba(255,255,255,0.08);
      color: var(--text-muted);
    }

    .chips-grid {
      flex: 1; min-height: 0;
      overflow-y: auto;
      display: flex; flex-wrap: wrap;
      align-content: flex-start;
      gap: clamp(8px, 1.1vw, 14px);
    }
    .queue-chip {
      font-size: clamp(1.4rem, 2.8vw, 2.6rem);
      font-weight: 900;
      padding: clamp(6px, 1vw, 12px) clamp(14px, 1.8vw, 24px);
      border-radius: 12px;
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
      display: flex; align-items: center; justify-content: center;
      animation: chipIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes chipIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
    .chip-ready {
      background: rgba(16, 185, 129, 0.16);
      border: 2px solid var(--green);
      color: var(--green);
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
    }
    .chip-prep {
      background: rgba(245, 158, 11, 0.12);
      border: 2px solid var(--amber);
      color: var(--amber);
      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.15);
    }

    .empty-state {
      flex: 1;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-muted);
      font-size: clamp(0.9rem, 1.2vw, 1.1rem);
      font-weight: 600;
      font-style: italic;
    }

    /* Sound prompt banner if muted */
    #audio-banner {
      position: fixed; bottom: 12px; left: 50%; transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid var(--cyan);
      color: #E2E8F0;
      padding: 8px 18px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      z-index: 999;
      display: none;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6);
    }

    /* Vertical Orientation (9:16) */
    @media (orientation: portrait) {
      main {
        grid-template-columns: 1fr;
        grid-template-rows: 1.1fr 1fr;
      }
      .hero-panel { padding: 16px; }
      .side-panels { flex-direction: row; }
      body.layout-only-number main,
      body.layout-hero-only main {
        grid-template-rows: 1fr;
      }
    }
  </style>
</head>
<body>
  <div id="app">
    <header id="main-header">
      <div class="brand-box">
        <div class="brand-icon">🎫</div>
        <div>
          <div class="brand-name" id="restaurant-name">TOTEM QUICKBITE</div>
          <div class="brand-subtitle" id="board-subtitle">Tabellone Chiamata Ordini</div>
        </div>
      </div>
      <div class="header-right">
        <div class="live-badge" id="live-badge">
          <div class="live-dot"></div>
          <span id="live-text">IN DIRETTA</span>
        </div>
        <div class="clock-box" id="clock">--:--:--</div>
      </div>
    </header>

    <main id="main-grid">
      <!-- Hero: Current Calling Number -->
      <section class="hero-panel" id="hero-panel">
        <div class="call-label" id="call-label">ORA IN CHIAMATA</div>
        <div class="number-display" id="call-number">—</div>
        <div class="call-instruction" id="call-instruction">
          ⚡ Recarsi alla cassa o al banco di ritiro
        </div>
      </section>

      <!-- Side: Ready and In Preparation -->
      <div class="side-panels" id="side-panels">
        <!-- Ready Card -->
        <section class="list-card" id="ready-card">
          <div class="list-card-header">
            <div class="list-card-title ready-title">
              <span>✅</span> <span id="ready-title-text">PRONTI AL RITIRO</span>
            </div>
            <div class="card-count-badge" id="ready-count">0</div>
          </div>
          <div class="chips-grid" id="ready-chips">
            <div class="empty-state" id="ready-empty-text">In attesa di nuovi ordini pronti</div>
          </div>
        </section>

        <!-- Preparation Card -->
        <section class="list-card" id="prep-card">
          <div class="list-card-header">
            <div class="list-card-title prep-title">
              <span>⏳</span> <span id="prep-title-text">IN PREPARAZIONE</span>
            </div>
            <div class="card-count-badge" id="prep-count">0</div>
          </div>
          <div class="chips-grid" id="prep-chips">
            <div class="empty-state" id="prep-empty-text">Nessun ordine in cucina</div>
          </div>
        </section>
      </div>
    </main>
  </div>

  <div id="audio-banner" onclick="enableAudio()">
    🔔 Clicca o premi un tasto per attivare il suono di chiamata TV
  </div>

  <script>
  (function () {
    var lastCalling = null;
    var audioCtx = null;
    var audioUnlocked = false;
    var config = {
      show_prefix: false,
      show_only_number: false,
      show_header: true,
      show_clock: true,
      show_ready_list: true,
      show_prep_list: true,
      show_instruction: true,
      number_size: 'large',
      call_label: '',
      instruction_text: '',
      theme: 'dark',
      sound_enabled: true
    };
    var currentLang = 'it';

    // Parse URL search params for immediate overrides
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('only_number') === '1' || urlParams.get('only_number') === 'true') {
      config.show_only_number = true;
    }
    if (urlParams.get('size')) {
      config.number_size = urlParams.get('size');
    }
    if (urlParams.get('theme')) {
      config.theme = urlParams.get('theme');
    }
    if (urlParams.get('sound') === '0' || urlParams.get('sound') === 'false') {
      config.sound_enabled = false;
    }
    if (urlParams.get('lang')) {
      currentLang = urlParams.get('lang');
    }

    var I18N = {
      it: {
        calling: 'ORA IN CHIAMATA',
        waiting: 'IN ATTESA',
        ready: 'PRONTI AL RITIRO',
        prep: 'IN PREPARAZIONE',
        instruction: '⚡ Recarsi alla cassa o al banco di ritiro',
        waiting_instruction: 'Prego attendere la chiamata del vostro ordine',
        live: 'IN DIRETTA',
        subtitle: 'Tabellone Chiamata Ordini',
        empty_ready: 'In attesa di nuovi ordini pronti',
        empty_prep: 'Nessun ordine in cucina'
      },
      en: {
        calling: 'NOW CALLING',
        waiting: 'WAITING',
        ready: 'READY FOR PICKUP',
        prep: 'IN PREPARATION',
        instruction: '⚡ Please proceed to the counter or checkout',
        waiting_instruction: 'Please wait for your order to be called',
        live: 'LIVE',
        subtitle: 'Order Calling Display',
        empty_ready: 'Waiting for ready orders',
        empty_prep: 'No orders in preparation'
      },
      es: {
        calling: 'NÚMERO EN LLAMADA',
        waiting: 'EN ESPERA',
        ready: 'LISTOS PARA RECOGER',
        prep: 'EN PREPARACIÓN',
        instruction: '⚡ Pase a caja o al mostrador de entrega',
        waiting_instruction: 'Por favor espere la llamada de su turno',
        live: 'EN VIVO',
        subtitle: 'Pantalla de Turnos y Pedidos',
        empty_ready: 'A la espera de pedidos listos',
        empty_prep: 'Sin pedidos en cocina'
      },
      fr: {
        calling: 'NUMÉRO APPELÉ',
        waiting: 'EN ATTENTE',
        ready: 'PRÊTS AU COMPTOIR',
        prep: 'EN PRÉPARATION',
        instruction: '⚡ Veuillez vous présenter au comptoir de retrait',
        waiting_instruction: 'Veuillez patienter jusqu’à l’appel de votre numéro',
        live: 'EN DIRECT',
        subtitle: 'Affichage File d’Attente',
        empty_ready: 'En attente de commandes prêtes',
        empty_prep: 'Aucune commande en préparation'
      },
      de: {
        calling: 'AUFGERUFENE NUMMER',
        waiting: 'IN WARTESCHLANGE',
        ready: 'ABHOLBEREIT',
        prep: 'IN ZUBEREITUNG',
        instruction: '⚡ Bitte zur Theke oder Kasse kommen',
        waiting_instruction: 'Bitte warten Sie auf den Aufruf Ihrer Nummer',
        live: 'LIVE',
        subtitle: 'Bestell-Aufruf-Display',
        empty_ready: 'Warten auf fertige Bestellungen',
        empty_prep: 'Keine Bestellungen in Zubereitung'
      }
    };

    function i18nText(key) {
      var dict = I18N[currentLang] || I18N.it;
      return dict[key] || I18N.it[key] || '';
    }

    function applyConfigToDom() {
      // 1. Apply Theme
      document.body.className = '';
      if (config.theme && config.theme !== 'dark') {
        document.body.classList.add('theme-' + config.theme);
      }

      // 2. Apply Size
      var sz = config.number_size || 'large';
      document.body.classList.add('size-' + sz);

      // 3. Layout: show only number
      if (config.show_only_number) {
        document.body.classList.add('layout-only-number');
      } else {
        document.body.classList.remove('layout-only-number');
      }

      // 4. Header visibility
      var hdr = document.getElementById('main-header');
      if (hdr) hdr.style.display = (config.show_header === false) ? 'none' : 'flex';

      // 5. Clock visibility
      var clk = document.getElementById('clock');
      if (clk) clk.style.display = (config.show_clock === false) ? 'none' : 'block';

      // 6. Instruction visibility
      var instr = document.getElementById('call-instruction');
      if (instr) instr.style.display = (config.show_instruction === false) ? 'none' : 'block';

      // 7. Ready card visibility
      var readyCard = document.getElementById('ready-card');
      if (readyCard) readyCard.style.display = (config.show_ready_list === false) ? 'none' : 'flex';

      // 8. Prep card visibility
      var prepCard = document.getElementById('prep-card');
      if (prepCard) prepCard.style.display = (config.show_prep_list === false) ? 'none' : 'flex';

      // 9. If both cards hidden, hide side panels container
      var sidePanels = document.getElementById('side-panels');
      if (sidePanels) {
        if (config.show_ready_list === false && config.show_prep_list === false) {
          document.body.classList.add('layout-hero-only');
        } else if (!config.show_only_number) {
          document.body.classList.remove('layout-hero-only');
        }
      }

      // 10. Static Labels Localization
      var subEl = document.getElementById('board-subtitle');
      if (subEl) subEl.textContent = i18nText('subtitle');
      var liveEl = document.getElementById('live-text');
      if (liveEl) liveEl.textContent = i18nText('live');
      var readyTitleEl = document.getElementById('ready-title-text');
      if (readyTitleEl) readyTitleEl.textContent = i18nText('ready');
      var prepTitleEl = document.getElementById('prep-title-text');
      if (prepTitleEl) prepTitleEl.textContent = i18nText('prep');
    }

    function initAudio() {
      try {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext && !audioCtx) {
          audioCtx = new AudioContext();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        audioUnlocked = true;
        var b = document.getElementById('audio-banner');
        if (b) b.style.display = 'none';
      } catch (e) {
        console.warn('Audio init error:', e);
      }
    }
    window.enableAudio = initAudio;

    // Check audio policy
    setTimeout(function () {
      try {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          var testCtx = new AudioContext();
          if (testCtx.state === 'suspended') {
            var b = document.getElementById('audio-banner');
            if (b && config.sound_enabled !== false) b.style.display = 'block';
          } else {
            audioUnlocked = true;
          }
        }
      } catch (e) {}
    }, 1000);

    // Any key or click unlocks audio
    ['click', 'touchstart', 'keydown'].forEach(function (evt) {
      window.addEventListener(evt, function () {
        if (!audioUnlocked) initAudio();
      }, { once: true });
    });

    function playDingDong() {
      if (config.sound_enabled === false) return;
      if (!audioCtx) initAudio();
      if (!audioCtx) return;
      try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        var t0 = audioCtx.currentTime;

        // Note 1: 880Hz (A5)
        var osc1 = audioCtx.createOscillator();
        var g1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, t0);
        g1.gain.setValueAtTime(0, t0);
        g1.gain.linearRampToValueAtTime(0.7, t0 + 0.03);
        g1.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
        osc1.connect(g1);
        g1.connect(audioCtx.destination);
        osc1.start(t0);
        osc1.stop(t0 + 0.46);

        // Note 2: 1174.66Hz (D6)
        var osc2 = audioCtx.createOscillator();
        var g2 = audioCtx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1174.66, t0 + 0.22);
        g2.gain.setValueAtTime(0, t0 + 0.22);
        g2.gain.linearRampToValueAtTime(0.9, t0 + 0.25);
        g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.85);
        osc2.connect(g2);
        g2.connect(audioCtx.destination);
        osc2.start(t0 + 0.22);
        osc2.stop(t0 + 0.86);
      } catch (e) {
        console.warn('Sound error:', e);
      }
    }

    function padNumber(n) {
      var s = String(n || '');
      return s.length === 1 ? '0' + s : s;
    }

    function fetchJson(url) {
      return fetch(url, { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    }

    function updateCalling() {
      fetchJson('/api/display-queue/calling').then(function (data) {
        var num = (data && data.number != null && data.number > 0) ? Number(data.number) : null;
        var hero = document.getElementById('hero-panel');
        var callNumEl = document.getElementById('call-number');
        var labelEl = document.getElementById('call-label');
        var instrEl = document.getElementById('call-instruction');

        if (num !== null) {
          // NO '#' prefix! Format pure number (e.g. "01", "15", or "A-01")
          var formatted = padNumber(num);
          if (config.show_prefix) {
            formatted = '#' + formatted;
          }
          if (callNumEl.textContent !== formatted) {
            callNumEl.textContent = formatted;
            callNumEl.classList.remove('flash');
            void callNumEl.offsetWidth; // trigger reflow
            callNumEl.classList.add('flash');
            if (hero) hero.classList.add('active-call');
            if (lastCalling !== null && lastCalling !== num) {
              playDingDong();
            }
          }
          if (labelEl) labelEl.textContent = config.call_label || i18nText('calling');
          if (instrEl) instrEl.innerHTML = config.instruction_text || i18nText('instruction');
          lastCalling = num;
        } else {
          if (callNumEl.textContent !== '—') {
            callNumEl.textContent = '—';
            if (hero) hero.classList.remove('active-call');
          }
          if (labelEl) labelEl.textContent = i18nText('waiting');
          if (instrEl) instrEl.innerHTML = i18nText('waiting_instruction');
          lastCalling = null;
        }
      });
    }

    function updateOrders() {
      if (config.show_only_number) return;
      fetchJson('/api/orders/current').then(function (orders) {
        if (!Array.isArray(orders)) return;

        var readyOrders = [];
        var prepOrders = [];

        orders.forEach(function (o) {
          var num = o.order_number;
          if (num == null) return;
          // NO '#' prefix! If prefix exists e.g. "A" -> "A-01", otherwise "01"
          var label = (o.order_prefix ? (o.order_prefix + '-') : '') + padNumber(num);
          var st = String(o.status || '').toLowerCase();
          if (st === 'ready') {
            readyOrders.push(label);
          } else if (st === 'preparing' || st === 'pending' || st === 'in_preparation' || st === 'confirmed') {
            prepOrders.push(label);
          }
        });

        // Ready container
        var readyContainer = document.getElementById('ready-chips');
        var readyCount = document.getElementById('ready-count');
        if (readyCount) readyCount.textContent = String(readyOrders.length);
        if (readyContainer) {
          if (readyOrders.length === 0) {
            readyContainer.innerHTML = '<div class="empty-state">' + i18nText('empty_ready') + '</div>';
          } else {
            readyContainer.innerHTML = readyOrders.map(function (lbl) {
              return '<div class="queue-chip chip-ready">' + lbl + '</div>';
            }).join('');
          }
        }

        // Prep container
        var prepContainer = document.getElementById('prep-chips');
        var prepCount = document.getElementById('prep-count');
        if (prepCount) prepCount.textContent = String(prepOrders.length);
        if (prepContainer) {
          if (prepOrders.length === 0) {
            prepContainer.innerHTML = '<div class="empty-state">' + i18nText('empty_prep') + '</div>';
          } else {
            prepContainer.innerHTML = prepOrders.map(function (lbl) {
              return '<div class="queue-chip chip-prep">' + lbl + '</div>';
            }).join('');
          }
        }
      });
    }

    function updateClock() {
      var d = new Date();
      var hh = ('0' + d.getHours()).slice(-2);
      var mm = ('0' + d.getMinutes()).slice(-2);
      var ss = ('0' + d.getSeconds()).slice(-2);
      var el = document.getElementById('clock');
      if (el) el.textContent = hh + ':' + mm + ':' + ss;
    }

    function updateSettings() {
      fetchJson('/api/settings').then(function (settings) {
        if (!settings) return;

        if (settings.restaurant_name) {
          var el = document.getElementById('restaurant-name');
          if (el) el.textContent = settings.restaurant_name;
        }

        if (settings.language && !urlParams.get('lang')) {
          currentLang = settings.language;
        }

        if (settings.display_queue_config && typeof settings.display_queue_config === 'object') {
          var cfg = settings.display_queue_config;
          // Apply stored config, keeping query param overrides if present
          if (urlParams.get('only_number') === null && cfg.show_only_number !== undefined) {
            config.show_only_number = Boolean(cfg.show_only_number);
          }
          if (cfg.show_header !== undefined) config.show_header = Boolean(cfg.show_header);
          if (cfg.show_clock !== undefined) config.show_clock = Boolean(cfg.show_clock);
          if (cfg.show_ready_list !== undefined) config.show_ready_list = Boolean(cfg.show_ready_list);
          if (cfg.show_prep_list !== undefined) config.show_prep_list = Boolean(cfg.show_prep_list);
          if (cfg.show_instruction !== undefined) config.show_instruction = Boolean(cfg.show_instruction);
          if (urlParams.get('size') === null && cfg.number_size) config.number_size = cfg.number_size;
          if (urlParams.get('theme') === null && cfg.theme) config.theme = cfg.theme;
          if (urlParams.get('sound') === null && cfg.sound_enabled !== undefined) {
            config.sound_enabled = Boolean(cfg.sound_enabled);
          }
          if (cfg.call_label !== undefined) config.call_label = cfg.call_label;
          if (cfg.instruction_text !== undefined) config.instruction_text = cfg.instruction_text;
          if (cfg.show_prefix !== undefined) config.show_prefix = Boolean(cfg.show_prefix);
        }

        applyConfigToDom();
      });
    }

    // Initial run
    applyConfigToDom();
    updateClock();
    setInterval(updateClock, 1000);

    updateCalling();
    setInterval(updateCalling, 1200);

    updateOrders();
    setInterval(updateOrders, 2500);

    updateSettings();
    setInterval(updateSettings, 8000);
  })();
  </script>
</body>
</html>
`;

export const SIGNAGE_COMING_SOON_HTML = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <title>Digital Signage — Coming Soon</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0B1220;
      color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .card {
      max-width: 520px;
      width: 100%;
      background: #131B2E;
      border: 1px solid #1E293B;
      border-radius: 24px;
      padding: 40px 32px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }
    .icon {
      font-size: 54px;
      margin-bottom: 20px;
    }
    .badge {
      display: inline-block;
      background: rgba(124, 58, 237, 0.18);
      color: #A78BFA;
      border: 1px solid rgba(124, 58, 237, 0.4);
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 1.8rem;
      font-weight: 900;
      margin-bottom: 12px;
      color: #FFFFFF;
    }
    p {
      color: #94A3B8;
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #0F766E;
      color: #FFFFFF;
      text-decoration: none;
      font-weight: 800;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 0.95rem;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #115E59;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📺</div>
    <div class="badge">In Sviluppo · Coming Soon</div>
    <h1>Digital Signage (Vetrina TV)</h1>
    <p>
      Il modulo Digital Signage e la rotazione vetrina prodotti sono temporaneamente disattivati per consentire l'ottimizzazione e il refactoring del motore grafico.<br/><br/>
      Il contacoda in sala continua a funzionare regolarmente.
    </p>
    <a href="/queue/" class="btn">🎫 Apri Tabellone Contacoda</a>
  </div>
</body>
</html>
`;

export const DISPLAY_QUEUE_HTML = QUEUE_HTML;
