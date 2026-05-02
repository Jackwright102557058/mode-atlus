/* Mode Atlas shared app runtime: display, profile/dev polish, sync polish, profile save clone, late bootstrap/features/auth. */

/* === mode-atlas-display.js === */
(function () {
  const STORAGE_KEY = 'modeAtlasDisplayMode';
  function getMode() { return window.ModeAtlasStorage?.get ? window.ModeAtlasStorage.get(STORAGE_KEY, 'auto') : (localStorage.getItem(STORAGE_KEY) || 'auto'); }
  function setMode(mode) {
    if (window.ModeAtlasStorage?.set) window.ModeAtlasStorage.set(STORAGE_KEY, mode);
    else localStorage.setItem(STORAGE_KEY, mode);
    applyMode();
    window.dispatchEvent(new CustomEvent('modeAtlasDisplayModeChanged', { detail: { mode } }));
  }
  function applyMode() {
    const mode = getMode();
    document.body.dataset.displayMode = mode;
    document.querySelectorAll('.ma-display-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.modeAtlasDisplay === mode);
    });
  }
  function findProfileContainer() {
    return document.querySelector('.profile-drawer .drawer-actions') ||
           document.querySelector('.drawer-actions') ||
           document.querySelector('.profile-panel .drawer-actions') ||
           document.querySelector('.profile-drawer') ||
           document.querySelector('.drawer-panel') ||
           document.querySelector('[id*="profileDrawer"]');
  }
  function injectDisplayControls() { applyMode(); }
  window.ModeAtlasDisplay = { getMode, setMode, applyMode, injectDisplayControls };
  applyMode();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectDisplayControls);
  else injectDisplayControls();
  setTimeout(injectDisplayControls, 300);
  setTimeout(injectDisplayControls, 1200);
})();

/* === mode-atlas-profile-dev.js === */
(function ModeAtlasProfileDev(){ if (window.__modeAtlasProfileDevInstalled) return; window.__modeAtlasProfileDevInstalled = true; function cleanDuplicateDisplay(){ document.querySelectorAll('.ma-display-controls').forEach(el => el.remove()); document.querySelectorAll('.ma-settings-panel').forEach(panel => { const rows = [...panel.querySelectorAll('.ma-settings-row')]; rows.filter(row => /Display/i.test(row.textContent || '')).slice(1).forEach(row => row.remove()); rows.filter(row => /Sound/i.test(row.textContent || '') && !row.hasAttribute('data-ma-sound-enhanced') && !row.hasAttribute('data-ma-sound-dev-tools')).forEach(row => row.remove()); }); } function normalizeProfileActions(){ document.querySelectorAll('.profile-drawer,#profileDrawer').forEach(drawer => { const actions = drawer.querySelector('.drawer-actions'); if (!actions) return; actions.classList.add('ma-profile-nav-cleaned'); [...actions.querySelectorAll('a')].forEach(link => { const href = (link.getAttribute('href') || '').toLowerCase(); const isAtlas = href === 'index.html' || href.endsWith('/index.html') || /mode-atlas\/?$/.test(href); const isKana = href === 'kana.html' || href.endsWith('/kana.html'); if (!isAtlas && !isKana) { link.remove(); return; } link.classList.add('drawer-action'); link.textContent = isAtlas ? 'Atlas' : 'Kana Trainer'; link.setAttribute('href', isAtlas ? 'index.html' : 'kana.html'); }); if (!actions.querySelector('a[href="/"]')) { const link = document.createElement('a'); link.className = 'drawer-action'; link.href = 'index.html'; link.textContent = 'Atlas'; actions.appendChild(link); } if (!actions.querySelector('a[href="/kana/"]')) { const link = document.createElement('a'); link.className = 'drawer-action'; link.href = 'kana.html'; link.textContent = 'Kana Trainer'; actions.appendChild(link); } }); } function isTestPage(){ return /test\.html(?:$|[?#])/i.test(location.pathname) || !!document.getElementById('testHeatmap'); } function ensureTestStorageDebugFallback(){ if (!isTestPage() || typeof window.renderDebugPanel === 'function') return; window.closeDebugPanel = function(){ const panel = document.getElementById('debugPanel'); if (panel) panel.remove(); }; window.renderDebugPanel = function(){ const keys = ['testModeResults','kanaTrainerTestModeResults','readingTestModeResults','kanaTrainerReadingTestModeResults','writingTestModeResults','kanaTrainerWritingTestModeResults']; let panel = document.getElementById('debugPanel'); if (!panel) { panel = document.createElement('div'); panel.id = 'debugPanel'; panel.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:10000;width:min(420px,calc(100vw - 32px));max-height:70vh;overflow:auto;padding:14px;border-radius:16px;background:rgba(12,12,12,.96);border:1px solid rgba(255,255,255,.12);box-shadow:0 16px 40px rgba(0,0,0,.45);font-family:Arial,sans-serif;font-size:12px;line-height:1.45;color:#f3f3f3'; document.body.appendChild(panel); } const rows = keys.map(key => { const raw = localStorage.getItem(key); let count = 0; let err = ''; if (raw) { try { const parsed = JSON.parse(raw); count = Array.isArray(parsed) ? parsed.length : 0; } catch (error) { err = error.message || 'Invalid JSON'; } } return { key, present: raw !== null, count, len: raw ? raw.length : 0, err }; }); panel.innerHTML = '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px;"><div style="font-size:13px;font-weight:800;letter-spacing:.04em;">Storage Debug</div><button type="button" data-debug-close style="border:1px solid rgba(255,255,255,.14);background:#1f1f1f;color:#f3f3f3;border-radius:8px;padding:4px 9px;cursor:pointer;font-size:12px;">×</button></div><div style="display:grid;gap:6px;">' + rows.map(item => '<div style="padding:8px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);"><div style="font-weight:700;word-break:break-all;">' + item.key + '</div><div style="color:#bfbfbf;">Present: ' + (item.present ? 'yes' : 'no') + ' · Items: ' + item.count + ' · Raw length: ' + item.len + '</div>' + (item.err ? '<div style="color:#ff9b9b;">Parse error: ' + item.err + '</div>' : '') + '</div>').join('') + '</div>'; panel.querySelector('[data-debug-close]').onclick = window.closeDebugPanel; }; } function getPageDebug(){ ensureTestStorageDebugFallback(); const render = window.renderDebugPanel; const close = window.closeDebugPanel; if (typeof render !== 'function') return null; return { label: isTestPage() ? 'Storage debug' : 'SRS debug', closeLabel: isTestPage() ? 'Close storage debug' : 'Close debug', render, close: typeof close === 'function' ? close : null }; } function ensureDevPanel(){ if (document.getElementById('maDevPanel')) return; const pageDebug = getPageDebug(); const panel = document.createElement('div'); panel.className = 'ma-dev-panel'; panel.id = 'maDevPanel'; panel.innerHTML = '<div class="ma-dev-card" role="dialog" aria-modal="false" aria-labelledby="maDevTitle"><div class="ma-dev-head"><div class="ma-dev-title" id="maDevTitle">Dev menu</div><button class="ma-dev-btn" type="button" data-ma-dev-close>Close</button></div>' + (pageDebug ? '<div class="ma-dev-row"><div class="ma-dev-label">Page tools</div><div class="ma-dev-actions"><button class="ma-dev-btn" type="button" data-ma-dev-page-debug>' + pageDebug.label + '</button>' + (pageDebug.close ? '<button class="ma-dev-btn" type="button" data-ma-dev-page-debug-close>' + pageDebug.closeLabel + '</button>' : '') + '</div></div>' : '') + '<div class="ma-dev-row"><div class="ma-dev-label">Console</div><div style="color:var(--muted,#9aa3b8);font-size:13px;line-height:1.5;">Open this panel with <strong>dev()</strong>. It stays in the bottom-right so the page remains usable.</div></div></div>'; document.body.appendChild(panel); panel.addEventListener('click', event => { if (event.target.closest('[data-ma-dev-close]')) closeDev(); if (event.target.closest('[data-ma-dev-page-debug]')) { try { getPageDebug()?.render(); } catch (error) { console.warn('Debug panel unavailable', error); } } if (event.target.closest('[data-ma-dev-page-debug-close]')) { try { getPageDebug()?.close?.(); } catch (error) { console.warn('Close debug unavailable', error); } } }); } function openDev(){ ensureDevPanel(); document.getElementById('maDevPanel')?.classList.add('open'); } function closeDev(){ document.getElementById('maDevPanel')?.classList.remove('open'); } function polish(){ cleanDuplicateDisplay(); normalizeProfileActions(); ensureDevPanel(); } window.dev = openDev; window.atlasDev = openDev; document.addEventListener('keydown', event => { if (event.key === 'Escape') closeDev(); }); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', polish); else polish(); setTimeout(polish, 300); setTimeout(polish, 1200); })();

/* === mode-atlas-sync-polish.js === */
(function(){function fmt(ts){const n=Number(ts||0);if(!n)return'Sync checked just now';const d=new Date(n);if(Number.isNaN(d.getTime()))return'Sync checked just now';const diff=Math.max(0,Date.now()-n);if(diff<60000)return'Sync checked just now';if(diff<3600000)return'Sync checked '+Math.round(diff/60000)+'m ago';if(diff<86400000)return'Sync checked '+Math.round(diff/3600000)+'h ago';return'Sync checked '+d.toLocaleDateString([],{month:'short',day:'numeric'})}function bestSyncTime(){const keys=['modeAtlasLastSyncCheck','kanaWordBankUpdatedAt','cloudReadingUpdatedAt','cloudWritingUpdatedAt','testModeResultsUpdatedAt','readingTestModeResultsUpdatedAt','writingTestModeResultsUpdatedAt'];return keys.map(k=>Number(localStorage.getItem(k)||0)).filter(Boolean).sort((a,b)=>b-a)[0]||Date.now()}function addSyncPill(){let target=document.getElementById('profileStatus')||document.getElementById('identityStatus')||document.getElementById('studyProfileStatus');if(!target||document.getElementById('maSyncPill')||document.querySelector('.ma-sync-pill'))return;const pill=document.createElement('div');pill.className='ma-sync-pill';pill.id='maSyncPill';pill.textContent=fmt(bestSyncTime());target.insertAdjacentElement('afterend',pill)}function hideLoader(){localStorage.setItem('modeAtlasLastSyncCheck',String(Date.now()));addSyncPill();const el=document.getElementById('maLoadingScreen');if(el){el.classList.add('done');setTimeout(()=>el.remove(),450)}}window.ModeAtlasSyncPolish={hideLoader,addSyncPill};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(hideLoader,120));else setTimeout(hideLoader,80);window.addEventListener('load',()=>setTimeout(hideLoader,80));setTimeout(hideLoader,900)})();

/* === mode-atlas-profile-clone.js === */
(function(){
  function collectSave(){
    var keys=['highScore','settings','charStats','charTimes','charSrs','scoreHistory','dailyChallengeHistory','reverseHighScore','reverseSettings','reverseCharStats','reverseCharTimes','reverseCharSrs','reverseScoreHistory','reverseDailyChallengeHistory','kanaWordBank','testModeResults','readingTestModeResults','writingTestModeResults','modeAtlasDisplayMode'];
    var out={version:'mode-atlas-unified-save-v1',exportedAt:new Date().toISOString(),localStorage:{}};
    keys.forEach(function(k){var v=localStorage.getItem(k); if(v!==null) out.localStorage[k]=v;});
    return out;
  }
  function getSaveMap(obj){
    if(!obj || typeof obj !== 'object') throw new Error('Invalid save file');
    // Current Mode Atlas exports use { app, version, exportedAt, data }.
    // Older quick exports used { localStorage }. Keep both supported.
    var map = obj.localStorage || obj.data || obj;
    if(!map || typeof map !== 'object' || Array.isArray(map)) throw new Error('Invalid save file');
    return map;
  }
  function importSaveObject(obj){
    var map=getSaveMap(obj);
    Object.keys(map).forEach(function(k){
      var v=map[k];
      if(v===undefined || v===null) return;
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    });
    localStorage.setItem('modeAtlasImportProtectUntil', String(Date.now()+15000));
    localStorage.setItem('modeAtlasLocalImportGuardUntil', String(Date.now()+120000));
    if(window.KanaCloudSync){
      try{['reading','writing','wordBank','readingTests','writingTests'].forEach(function(s){window.KanaCloudSync.markSectionUpdated&&window.KanaCloudSync.markSectionUpdated(s);}); window.KanaCloudSync.scheduleSync&&window.KanaCloudSync.scheduleSync();}catch(e){}
    }
  }
  function ensureDrawer(){
    document.querySelectorAll('.profile-drawer,#profileDrawer,.drawer-backdrop,#profileBackdrop').forEach(function(el){el.remove();});
    var backdrop=document.createElement('div');backdrop.className='drawer-backdrop';backdrop.id='profileBackdrop';
    var drawer=document.createElement('aside');drawer.className='profile-drawer';drawer.id='profileDrawer';drawer.setAttribute('aria-hidden','true');
    drawer.innerHTML='<div class="drawer-head"><div class="drawer-title">Profile</div><button class="drawer-close" id="profileCloseBtn" type="button">Close</button></div>'+
      '<div class="drawer-user"><img class="drawer-avatar" id="profileAvatar" alt=""/><div><div class="drawer-name" id="profileName">Guest</div><div class="drawer-email" id="profileEmail">Not signed in</div></div></div>'+
      '<div class="drawer-status" id="profileStatus">Sign in on Mode Atlas to sync your learning across devices.</div>'+
      '<div class="drawer-actions"><button class="drawer-action primary" id="profileSignInBtn" data-profile-sign-in type="button">Sign in</button><button class="drawer-action" id="profileSignOutBtn" data-profile-sign-out type="button" style="display:none;">Sign out</button><a class="drawer-action" href="/">Atlas</a><a class="drawer-action" href="/kana/">Kana Trainer</a></div>'+
      '<div class="ma-save-section"><div class="ma-save-title">Save / Load</div><div class="ma-save-grid"><button class="drawer-action primary" type="button" data-ma-save-export>Export save</button><button class="drawer-action" type="button" data-ma-save-copy>Copy save</button><button class="drawer-action" type="button" data-ma-save-import>Import save</button></div><input type="file" accept=".json,application/json" data-ma-save-file style="display:none"/><div class="ma-save-note">One backup for your Mode Atlas progress, preferences, and local data.</div></div>'+
      '<div class="ma-settings-panel"><div class="ma-settings-title">Preferences</div><div class="ma-settings-row"><div class="ma-settings-label">Display</div><div class="ma-display-options"><button class="ma-display-option" data-display="auto" type="button">Auto</button><button class="ma-display-option" data-display="compact" type="button">Compact</button><button class="ma-display-option" data-display="mobile" type="button">Mobile</button></div></div></div>';
    document.body.insertBefore(backdrop,document.body.firstChild); document.body.insertBefore(drawer,backdrop.nextSibling);
    bindDrawer(); bindSave(); bindPrefs(); bindCloud();
  }
  function setOpen(v){var d=document.getElementById('profileDrawer'),b=document.getElementById('profileBackdrop'); if(d){d.classList.toggle('open',v);d.setAttribute('aria-hidden',v?'false':'true')} if(b)b.classList.toggle('open',v)}
  function bindDrawer(){
    document.getElementById('profileCloseBtn')?.addEventListener('click',function(){setOpen(false)});
    document.getElementById('profileBackdrop')?.addEventListener('click',function(){setOpen(false)});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')setOpen(false)});
    document.querySelectorAll('#profileOpenBtn,.profile-trigger,[data-profile-open],#studyProfileOpen').forEach(function(btn){btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();setOpen(true)},true)});
    window.ModeAtlasKanaProfile={open:function(){setOpen(true)},close:function(){setOpen(false)}};
    window.ModeAtlasProfile=window.ModeAtlasKanaProfile;
  }
  function bindSave(){var d=document.getElementById('profileDrawer'); if(!d)return; var file=d.querySelector('[data-ma-save-file]'); d.querySelector('[data-ma-save-export]')?.addEventListener('click',function(){var blob=new Blob([JSON.stringify(collectSave(),null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mode-atlas-save.json';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},0)}); d.querySelector('[data-ma-save-copy]')?.addEventListener('click',function(){navigator.clipboard&&navigator.clipboard.writeText(JSON.stringify(collectSave(),null,2));}); d.querySelector('[data-ma-save-import]')?.addEventListener('click',function(){file&&file.click()}); file&&file.addEventListener('change',function(e){var f=e.target.files&&e.target.files[0]; if(!f)return; var r=new FileReader(); r.onload=function(){try{importSaveObject(JSON.parse(r.result)); location.reload();}catch(err){alert('Import failed. Please use a valid Mode Atlas save file.')}}; r.readAsText(f);});}
  function bindPrefs(){function mode(){return localStorage.getItem('modeAtlasDisplayMode')||'auto'} function apply(){document.body.dataset.displayMode=mode(); document.querySelectorAll('.ma-display-option').forEach(function(b){b.classList.toggle('active',b.dataset.display===mode())})} document.querySelectorAll('.ma-display-option').forEach(function(b){b.addEventListener('click',function(){localStorage.setItem('modeAtlasDisplayMode',b.dataset.display);apply();window.dispatchEvent(new CustomEvent('modeAtlasDisplayModeChanged',{detail:{mode:b.dataset.display}}));})}); apply();}
  function bindCloud(){if(window.KanaCloudSync&&window.KanaCloudSync.bindUi){try{window.KanaCloudSync.bindUi({signInBtn:document.getElementById('profileSignInBtn'),signOutBtn:document.getElementById('profileSignOutBtn'),statusEl:document.getElementById('profileStatus'),nameEl:document.getElementById('profileName'),emailEl:document.getElementById('profileEmail'),photoEl:document.getElementById('profileAvatar')});}catch(e){}}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureDrawer);else ensureDrawer();
  setTimeout(bindCloud,500); setTimeout(bindCloud,1500);
})();

/* === mode-atlas-late-bootstrap.js === */
/* Shared late bootstrap: visit flow, save/sync UI, loading failsafe. */
(function(){
  if(window.__modeAtlasVisitFlowsLoaded)return; window.__modeAtlasVisitFlowsLoaded=true;
  const K={first:'modeAtlasStarterSeen',return:'modeAtlasDailyReturnSeenDate',lastVisit:'modeAtlasLastVisitStudyDate',streak:'modeAtlasVisitStreak',lastStudied:'modeAtlasLastStudiedAt',lastMode:'modeAtlasLastMode',forceFirst:'modeAtlasForceFirstVisit',forceReturn:'modeAtlasForceDailyReturn'};
  const page=()=>((window.ModeAtlasPageName ? window.ModeAtlasPageName() : (location.pathname.split('/').pop() || 'index.html')).toLowerCase()||'index.html');
  const j=(k,f)=>{try{const r=localStorage.getItem(k);return r?JSON.parse(r):f}catch{return f}};
  const hasObj=k=>{const v=j(k,null);return v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length>0};
  const hasArr=k=>Array.isArray(j(k,null))&&j(k,[]).length>0;
  const studyDate=(d=new Date())=>{const x=new Date(d);if(x.getHours()<4)x.setDate(x.getDate()-1);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function hasData(){return hasObj('charStats')||hasObj('reverseCharStats')||hasObj('scoreHistory')||hasObj('reverseScoreHistory')||hasArr('kanaWordBank')||hasArr('testModeResults')||hasArr('writingTestModeResults')||Number(localStorage.getItem('highScore')||0)>0||Number(localStorage.getItem('reverseHighScore')||0)>0}
  function diff(a,b){return Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/86400000)}
  function streak(){const t=studyDate(),l=localStorage.getItem(K.lastVisit);let s=Number(localStorage.getItem(K.streak)||0);if(l!==t){s=(l&&diff(l,t)===1)?s+1:1;localStorage.setItem(K.lastVisit,t);localStorage.setItem(K.streak,String(s))}return s||1}
  function ago(ts){ts=Number(ts||0);if(!ts)return'No study recorded yet';const m=Math.floor(Math.max(0,Date.now()-ts)/60000);if(m<1)return'Just now';if(m<60)return`${m}m ago`;const h=Math.floor(m/60);if(h<24)return`${h}h ago`;return`${Math.floor(h/24)}d ago`}
  function mode(kind){const s=j(kind==='writing'?'reverseSettings':'settings',{});if(s.testMode)return'Test Mode';if(s.dailyChallenge)return'Daily Challenge';if(s.comboKana)return'Combo Kana Mode';if(s.timeTrial)return'Time Trial Mode';if(s.endless)return'Endless Mode';if(s.focusWeak)return'Focus Weak';return'Standard Mode'}
  function record(kind){const obj=kind==='writing'?{branch:'Kana Trainer',page:'Writing Practice',href:'reverse.html',mode:mode('writing')}:{branch:'Kana Trainer',page:'Reading Practice',href:'default.html',mode:mode('reading')};localStorage.setItem(K.lastStudied,String(Date.now()));localStorage.setItem(K.lastMode,JSON.stringify(obj))}
  function track(){const p=page();if(p==='default.html'||p==='reverse.html'){const kind=p==='reverse.html'?'writing':'reading';document.addEventListener('click',e=>{if(e.target.closest('#startBtn,#endSessionBtn,#retryBtn,.choice-btn,#choiceGrid,.btn'))record(kind)},{passive:true});document.addEventListener('keydown',e=>{if(e.key==='Enter')record(kind)},{passive:true})}else if(p==='wordbank.html'){document.addEventListener('click',e=>{if(e.target.closest('#addWordBtn,[data-action="save"],[data-action="favorite"]')){localStorage.setItem(K.lastStudied,String(Date.now()));localStorage.setItem(K.lastMode,JSON.stringify({branch:'Word Bank',page:'Word Bank',href:'wordbank.html',mode:'Vocabulary Review'}))}},{passive:true})}}
  const ROWS=[['あ row','あいうえお'],['か row','かきくけこ'],['さ row','さしすせそ'],['た row','たちつてと'],['な row','なにぬねの'],['は row','はひふへほ'],['ま row','まみむめも'],['や row','やゆよ'],['ら row','らりるれろ'],['わ row','わをん'],['ア row','アイウエオ'],['カ row','カキクケコ'],['サ row','サシスセソ'],['タ row','タチツテト'],['ナ row','ナニヌネノ']];
  function suggestions(){const st=j('charStats',{}),tm=j('charTimes',{});const a=ROWS.map(([name,chars])=>{let c=0,w=0,ms=0,n=0;[...chars].forEach(ch=>{c+=Number(st[ch]?.correct||0);w+=Number(st[ch]?.wrong||0);if(tm[ch]?.avg&&tm[ch]?.count){ms+=tm[ch].avg*tm[ch].count;n+=tm[ch].count}});const total=c+w,acc=total?c/total:1;return{name,total,score:w*4+(1-acc)*50+Math.min((n?ms/n:0)/500,12)+(total?0:-100)}}).filter(r=>r.total>0).sort((a,b)=>b.score-a.score).slice(0,3);return a.length?a:[{name:'あ row'},{name:'か row'},{name:'さ row'}]}
  function name(){const u=window.KanaCloudSync?.getUser?.();const n=(u?.displayName||u?.email||'').trim();if(n)return n.split(/\s+/)[0].split('@')[0];for(const id of ['profileName','drawerName','studyProfileName','identityName']){const e=document.getElementById(id),t=(e?.textContent||'').trim();if(t&&!/guest/i.test(t))return t.split(/\s+/)[0]}return'there'}
  function ensure(){if(document.getElementById('maVisitModal'))return;const css=document.createElement('style');css.textContent='.ma-visit-backdrop{position:fixed;inset:0;z-index:240;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.5);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}.ma-visit-backdrop.open{display:flex}.ma-visit-card{width:min(520px,100%);border-radius:28px;padding:22px;background:radial-gradient(circle at top right,rgba(125,181,255,.16),transparent 34%),linear-gradient(180deg,rgba(22,25,34,.98),rgba(8,10,16,.98));border:1px solid rgba(255,255,255,.12);box-shadow:0 30px 90px rgba(0,0,0,.55);color:var(--text,#f7f8ff)}.ma-visit-kicker{font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:var(--muted,#9aa3b8);margin-bottom:10px}.ma-visit-title{font-size:30px;line-height:1.04;font-weight:950;letter-spacing:-.04em;margin:0 0 10px}.ma-visit-copy{color:var(--soft,#cbd5e1);line-height:1.55;margin:0 0 18px;font-size:15px}.ma-visit-panel{border-radius:20px;padding:14px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);margin:12px 0}.ma-visit-label{font-size:12px;font-weight:900;letter-spacing:.11em;text-transform:uppercase;color:var(--muted,#9aa3b8);margin-bottom:8px}.ma-visit-list{display:flex;flex-wrap:wrap;gap:8px}.ma-visit-chip{padding:8px 10px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);font-size:13px;font-weight:800}.ma-visit-presets{display:grid;gap:10px}.ma-visit-preset{appearance:none;width:100%;text-align:left;border:1px solid rgba(255,255,255,.10);border-radius:16px;background:rgba(255,255,255,.055);color:inherit;padding:13px 14px;cursor:pointer;display:grid;gap:4px}.ma-visit-preset:hover,.ma-visit-preset:focus-visible{background:rgba(117,227,168,.12);border-color:rgba(117,227,168,.45);outline:none}.ma-visit-preset span{font-size:15px;font-weight:950}.ma-visit-preset small{font-size:12px;color:var(--soft,#cbd5e1);font-weight:750}.ma-visit-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.ma-visit-btn{appearance:none;border:1px solid rgba(255,255,255,.10);border-radius:15px;padding:12px 14px;background:rgba(255,255,255,.06);color:inherit;text-decoration:none;font-weight:900;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;min-height:44px}.ma-visit-btn.primary{background:linear-gradient(135deg,rgba(117,227,168,.92),rgba(125,181,255,.92));color:#061018;border-color:transparent}@media(max-width:640px){.ma-visit-card{padding:18px;border-radius:22px}.ma-visit-title{font-size:25px}.ma-visit-actions{display:grid}.ma-visit-btn{width:100%}}';document.head.appendChild(css);const m=document.createElement('div');m.id='maVisitModal';m.className='ma-visit-backdrop';m.innerHTML='<div class="ma-visit-card" role="dialog" aria-modal="true"><div id="maVisitContent"></div></div>';document.body.appendChild(m);m.addEventListener('click',e=>{if(e.target===m)closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()})}
  function closeModal(){document.getElementById('maVisitModal')?.classList.remove('open')}
  function first(){ensure();localStorage.setItem(K.first,'true');const c=document.getElementById('maVisitContent');const presets=[['starter','Starter','あ row + hint mode'],['intermediate','Intermediate','All hiragana rows'],['advanced','Advanced','Hiragana, katakana + dakuten'],['pro','Pro','Everything enabled']];c.innerHTML='<div class="ma-visit-kicker">Mode Atlas</div><h2 class="ma-visit-title">Welcome to Mode Atlas</h2><p class="ma-visit-copy">To help you get started, we recommend starting here:</p><div class="ma-visit-panel"><div class="ma-visit-label">Reading Mode presets</div><div class="ma-visit-presets">'+presets.map(p=>'<button class="ma-visit-preset" type="button" data-preset="'+esc(p[0])+'"><span>'+esc(p[1])+'</span><small>'+esc(p[2])+'</small></button>').join('')+'</div></div><div class="ma-visit-actions"><button class="ma-visit-btn" type="button" data-explore>Explore on my own</button></div>';c.querySelectorAll('[data-preset]').forEach(btn=>{btn.onclick=()=>{const preset=btn.getAttribute('data-preset')||'starter';localStorage.setItem('modeAtlasStartReadingPreset',preset);location.href='/reading/?starter='+encodeURIComponent(preset)}});c.querySelector('[data-explore]').onclick=()=>{closeModal()};document.getElementById('maVisitModal').classList.add('open')}
  function ret(){ensure();localStorage.setItem(K.return,studyDate());const lm=j(K.lastMode,{page:'Reading Practice',mode:'Endless Mode',href:'default.html'}),s=suggestions(),st=streak();const c=document.getElementById('maVisitContent');c.innerHTML=`<div class="ma-visit-kicker">Daily return</div><h2 class="ma-visit-title">Welcome back, ${esc(name())}</h2><p class="ma-visit-copy">Last studied: <strong>${esc(ago(localStorage.getItem(K.lastStudied)))}</strong><br>Current streak: <strong>${st} day${st===1?'':'s'}</strong></p><div class="ma-visit-panel"><div class="ma-visit-label">Suggested review</div><div class="ma-visit-list">${s.map(r=>`<span class="ma-visit-chip">${esc(r.name)}</span>`).join('')}</div></div><div class="ma-visit-panel"><div class="ma-visit-label">Resume</div><div class="ma-visit-list"><span class="ma-visit-chip">${esc(lm.page||'Reading Practice')} · ${esc(lm.mode||'Endless Mode')}</span></div></div><div class="ma-visit-actions"><a class="ma-visit-btn primary" href="${esc(lm.href||'default.html')}">Resume</a><button class="ma-visit-btn" type="button" data-close>Not now</button></div>`;c.querySelector('[data-close]').onclick=closeModal;document.getElementById('maVisitModal').classList.add('open')}
  function maybe(){if(page()!=='index.html')return;const q=new URLSearchParams(location.search),ff=sessionStorage.getItem(K.forceFirst)==='1'||q.has('devFirstVisit'),fr=sessionStorage.getItem(K.forceReturn)==='1'||q.has('devReturn');sessionStorage.removeItem(K.forceFirst);sessionStorage.removeItem(K.forceReturn);localStorage.removeItem(K.forceFirst);localStorage.removeItem(K.forceReturn);setTimeout(async()=>{try{if(window.KanaCloudSync?.ready)await Promise.race([window.KanaCloudSync.ready,new Promise(r=>setTimeout(r,900))])}catch{}if(ff)return first();if(fr)return ret();const nd=!hasData();if(nd&&localStorage.getItem(K.first)!=='true')return first();if(!nd){const t=studyDate();if(localStorage.getItem(K.return)!==t)return ret();streak()}},650)}
  function triggerFirst(){localStorage.removeItem(K.forceFirst);sessionStorage.removeItem(K.forceFirst);if(page()==='index.html')first();else{sessionStorage.setItem(K.forceFirst,'1');location.href='/?devFirstVisit=1'}}
  function triggerReturn(){localStorage.removeItem(K.forceReturn);sessionStorage.removeItem(K.forceReturn);if(page()==='index.html')ret();else{sessionStorage.setItem(K.forceReturn,'1');location.href='/?devReturn=1'}}
  function reset(){[K.first,K.return,K.forceFirst,K.forceReturn,K.lastVisit,K.streak].forEach(k=>localStorage.removeItem(k));console.info('Mode Atlas visit flags reset')}
  window.modeAtlasTriggerFirstVisit=triggerFirst;window.modeAtlasTriggerDailyReturn=triggerReturn;window.modeAtlasResetVisitFlags=reset;
  function addDev(){const p=document.getElementById('maDevPanel');if(!p||p.querySelector('[data-visit-tools]'))return;const card=p.querySelector('.ma-dev-card')||p,row=document.createElement('div');row.className='ma-dev-row';row.dataset.visitTools='true';row.innerHTML='<div class="ma-dev-label">Visit flows</div><div class="ma-dev-actions"><button class="ma-dev-btn" type="button" data-first>Trigger first visit</button><button class="ma-dev-btn" type="button" data-return>Trigger daily return</button><button class="ma-dev-btn" type="button" data-reset>Reset visit flags</button></div>';row.onclick=e=>{if(e.target.closest('[data-first]'))triggerFirst();if(e.target.closest('[data-return]'))triggerReturn();if(e.target.closest('[data-reset]'))reset()};card.appendChild(row)}
  function patchDev(){if(!window.ModeAtlasEnv?.allowDevTools)return;const o=window.dev;if(typeof o==='function'&&!o.__visitPatched){const p=function(){const r=o.apply(this,arguments);setTimeout(addDev,0);return r};p.__visitPatched=true;window.dev=p;window.atlasDev=p}new MutationObserver(addDev).observe(document.documentElement,{childList:true,subtree:true});setTimeout(addDev,500)}
  function init(){track();maybe();patchDev()} if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
(function ModeAtlasUnifiedSaveSyncUi(){
  if (window.__modeAtlasUnifiedSaveSyncUiLoaded) return;
  window.__modeAtlasUnifiedSaveSyncUiLoaded = true;

  const SECTION_HTML = '<div class="ma-save-title">Save / Load</div>' +
    '<div class="ma-save-grid">' +
      '<button class="drawer-action primary" type="button" data-ma-unified-export>Export save</button>' +
      '<button class="drawer-action" type="button" data-ma-unified-copy>Copy save</button>' +
      '<button class="drawer-action" type="button" data-ma-unified-import>Import save</button>' +
      '<button class="drawer-action danger" type="button" data-ma-unified-reset>Reset data</button>' +
    '</div>' +
    '<input type="file" accept=".json,application/json" data-ma-unified-file style="display:none" />' +
    '<div class="ma-save-note">Backups merge by newest section: newer backup data updates cloud/local data, but newer cloud data is kept.</div>';

  const RESET_WARNING = 'Reset all Mode Atlas data?\n\nThis clears local save data on this device. If you are signed in and cloud is available, it also clears the cloud save data for this account. This cannot be undone.';

  function fallbackBackup(){
    const data = {};
    const block = /^(firebase:|firestore|google|__|debug|devtools)/i;
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (!k || block.test(k)) continue;
      data[k] = localStorage.getItem(k);
    }
    return { app: 'Mode Atlas', version: 2, exportedAt: new Date().toISOString(), data };
  }

  function getBackup(){
    try { return window.KanaCloudSync?.createBackup?.() || fallbackBackup(); }
    catch { return fallbackBackup(); }
  }

  function setStatus(message){
    document.querySelectorAll('#profileStatus,#studyProfileStatus,#identityStatus,#wordBankCloudStatus').forEach((el) => {
      if (el) el.textContent = message;
    });
  }

  function downloadBackup(){
    const backup = getBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mode-atlas-save-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus('Save exported.');
    refreshSyncPills();
  }

  async function copyBackup(){
    const txt = JSON.stringify(getBackup(), null, 2);
    try {
      await navigator.clipboard.writeText(txt);
      setStatus('Save copied.');
    } catch {
      downloadBackup();
    }
    refreshSyncPills();
  }

  async function importBackupFile(file){
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text || '{}');
      setStatus('Checking backup against current save data...');
      let message = 'Save imported.';
      if (window.KanaCloudSync?.importLocalBackup) {
        const result = await window.KanaCloudSync.importLocalBackup(parsed);
        message = window.KanaCloudSync.describeImportResult?.(result) || message;
      } else {
        const data = parsed.data || parsed.localStorage || parsed;
        Object.entries(data || {}).forEach(([k,v]) => localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)));
        message = 'Save imported locally. Log in to cloud save after reload.';
      }
      alert(message);
      setStatus('Save imported. Reloading...');
      setTimeout(() => location.reload(), 500);
    } catch (error) {
      console.warn('Save import failed.', error);
      alert('Import failed. Please choose a valid Mode Atlas save file.');
      setStatus('Import failed.');
    }
  }

  async function resetData(){
    if (!confirm(RESET_WARNING)) return;
    try {
      setStatus('Resetting save data...');
      if (window.KanaCloudSync?.ready) await window.KanaCloudSync.ready;
      if (window.KanaCloudSync?.resetAllData) await window.KanaCloudSync.resetAllData();
      else { localStorage.clear(); sessionStorage.clear(); }
      location.href = 'index.html';
    } catch (error) {
      console.warn('Reset failed.', error);
      alert('Reset failed. Please check your connection and try again.');
      setStatus('Reset failed.');
    }
  }

  function statusFallback(){
    const user = window.KanaCloudSync?.getUser?.();
    const lastSync = Number(localStorage.getItem('modeAtlasLastCloudSyncAt') || 0);
    if (!user) return { tone: 'local', text: 'Local saving · log in for cloud save' };
    if (navigator.onLine === false) return { tone: 'warning', text: 'No cloud access · last sync ' + (lastSync ? new Date(lastSync).toLocaleString([], { hour:'numeric', minute:'2-digit', day:'numeric', month:'numeric', year:'2-digit' }) : 'never') };
    return { tone: 'ok', text: 'Cloud save synced' };
  }

  function getSyncStatus(){
    try { return window.KanaCloudSync?.getSyncStatus?.() || statusFallback(); }
    catch { return statusFallback(); }
  }

  function refreshSyncPills(){
    const st = getSyncStatus();
    const targets = document.querySelectorAll('#profileStatus,#studyProfileStatus,#identityStatus');
    targets.forEach((target) => {
      if (!target) return;
      const parent = target.parentElement || document;
      const pills = Array.from(parent.querySelectorAll(':scope > .ma-sync-pill, :scope > #maSyncPill'));
      let pill = pills[0] || document.getElementById('maSyncPill') || null;
      pills.slice(1).forEach((extra) => extra.remove());
      if (!pill || !parent.contains(pill)) {
        pill = document.createElement('div');
        pill.className = 'ma-sync-pill';
        target.insertAdjacentElement('afterend', pill);
      }
      pill.id = 'maSyncPill';
      pill.classList.add('ma-sync-pill');
      if (pill.textContent !== st.text) pill.textContent = st.text;
      const tone = st.tone || st.state || 'neutral';
      if (!pill.classList.contains(tone)) {
        pill.classList.remove('ok','warning','local','neutral','cloud','offline');
        pill.classList.add(tone);
      }
    });
    const canonical = document.getElementById('maSyncPill');
    document.querySelectorAll('.ma-sync-pill').forEach((pill) => {
      if (canonical && pill !== canonical && pill.parentElement?.querySelector('#profileStatus,#studyProfileStatus,#identityStatus')) {
        pill.remove();
        return;
      }
      if (pill.textContent !== st.text) pill.textContent = st.text;
      const tone = st.tone || st.state || 'neutral';
      if (!pill.classList.contains(tone)) {
        pill.classList.remove('ok','warning','local','neutral','cloud','offline');
        pill.classList.add(tone);
      }
    });
  }

  function ensureStyle(){
    if (document.getElementById('ma-unified-save-sync-style')) return;
    const style = document.createElement('style');
    style.id = 'ma-unified-save-sync-style';
    style.textContent = '.ma-save-section{display:block!important;margin-top:14px!important;padding:14px!important;border-radius:18px!important;background:rgba(255,255,255,.04)!important;border:1px solid rgba(255,255,255,.08)!important}.ma-save-title{font-weight:900;font-size:14px;margin-bottom:10px}.ma-save-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important}.ma-save-grid button{width:100%;min-height:42px}.ma-save-grid .danger{border-color:rgba(255,107,107,.38)!important;color:#ffd6d6!important;background:rgba(255,107,107,.08)!important}.ma-save-note{margin-top:10px;color:var(--muted,#9aa3b8);font-size:12px;line-height:1.45}.ma-sync-pill{display:inline-flex;align-items:center;justify-content:center;margin-top:10px;padding:7px 10px;border-radius:999px;font-size:12px;font-weight:900;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:var(--muted,#9aa3b8)}.ma-sync-pill.ok,.ma-sync-pill.cloud{border-color:rgba(89,210,120,.34);background:rgba(89,210,120,.12);color:#bcf7cb}.ma-sync-pill.warning,.ma-sync-pill.offline{border-color:rgba(255,176,64,.40);background:rgba(255,176,64,.12);color:#ffe0aa}.ma-sync-pill.local,.ma-sync-pill.neutral{border-color:rgba(102,168,255,.34);background:rgba(102,168,255,.11);color:#d7e8ff}@media(max-width:640px){.ma-save-grid{grid-template-columns:1fr!important}}';
    document.head.appendChild(style);
  }

  function rebuildSaveSections(){
    ensureStyle();
    const drawers = document.querySelectorAll('.profile-drawer,#profileDrawer,.profile-overlay aside');
    drawers.forEach((drawer) => {
      const existing = drawer.querySelector('.ma-save-section [data-ma-unified-export]')?.closest('.ma-save-section');
      if (existing) {
        drawer.querySelectorAll('.ma-save-section').forEach((old) => { if (old !== existing) old.remove(); });
        return;
      }
      drawer.querySelectorAll('.ma-save-section').forEach((old) => old.remove());
      const actions = drawer.querySelector('.profile-actions,.drawer-actions') || drawer;
      const section = document.createElement('div');
      section.className = 'ma-save-section';
      section.innerHTML = SECTION_HTML;
      const actionClass = actions.classList.contains('profile-actions') ? 'profile-action' : 'drawer-action';
      section.querySelectorAll('button').forEach((btn) => {
        btn.classList.remove('drawer-action','profile-action');
        btn.classList.add(actionClass);
        if (btn.hasAttribute('data-ma-unified-export')) btn.classList.add('primary');
        if (btn.hasAttribute('data-ma-unified-reset')) btn.classList.add('danger');
      });
      actions.insertAdjacentElement('afterend', section);
    });
    refreshSyncPills();
  }

  document.addEventListener('click', (event) => {
    const exportBtn = event.target.closest('[data-ma-unified-export]');
    const copyBtn = event.target.closest('[data-ma-unified-copy]');
    const importBtn = event.target.closest('[data-ma-unified-import]');
    const resetBtn = event.target.closest('[data-ma-unified-reset]');
    if (!exportBtn && !copyBtn && !importBtn && !resetBtn) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (exportBtn) downloadBackup();
    if (copyBtn) copyBackup();
    if (importBtn) importBtn.closest('.ma-save-section')?.querySelector('[data-ma-unified-file]')?.click();
    if (resetBtn) resetData();
  }, true);

  document.addEventListener('change', (event) => {
    const input = event.target.closest('[data-ma-unified-file]');
    if (!input) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    importBackupFile(input.files && input.files[0]);
    input.value = '';
  }, true);

  function boot(){
    rebuildSaveSections();
    setTimeout(rebuildSaveSections, 300);
    setTimeout(rebuildSaveSections, 1200);
    setTimeout(refreshSyncPills, 1800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('kanaCloudSyncStatusChanged', refreshSyncPills);
  window.addEventListener('online', refreshSyncPills);
  window.addEventListener('offline', refreshSyncPills);
  setInterval(refreshSyncPills, 30000);
  // Profile drawers are built during initial page load; avoid a document-wide observer here, because status text updates can retrigger it continuously.
})();
(function(){
  function done(){ var el=document.getElementById('maLoadingScreen'); if(el){ el.classList.add('done'); setTimeout(function(){ try{el.remove();}catch(e){} }, 450); } }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(done, 900); }); else setTimeout(done, 900);
  window.addEventListener('load', function(){ setTimeout(done, 400); });
  setTimeout(done, 2500);
})();

/* === mode-atlas-late-features.js === */
/* Shared late features: QoL batch, about panel, achievements. */

/* === Mode Atlas QOL batch: settings structure, achievements, mistake review, import preview, install prompt, changelog, speed run, empty states === */
(function ModeAtlasQolBatch(){
  if (window.__modeAtlasQolBatchLoaded) return;
  window.__modeAtlasQolBatchLoaded = true;

  const PAGE = (window.ModeAtlasPageName ? window.ModeAtlasPageName() : (location.pathname.split('/').pop() || 'index.html')).toLowerCase();
  const IS_TRAINER = PAGE === 'default.html' || PAGE === 'reverse.html';
  const IS_WRITING = PAGE === 'reverse.html';
  const SETTINGS_KEY = IS_WRITING ? 'reverseSettings' : 'settings';
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const readJSON = (k,f)=>{ try{ const raw=localStorage.getItem(k); return raw ? JSON.parse(raw) : f; } catch { return f; } };
  const writeJSON = (k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const now = ()=>Date.now();

  const HIRA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'.split('');
  const KATA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフホマミムメモヤユヨラリルレロワヲン'.split('');
  const CONFUSABLE = ['シ','ツ','ソ','ン','ぬ','め','れ','わ','ね','ク','ケ','タ','ナ','メ'];
  const CONF_HIRA_ROWS = ['h_na','h_ma','h_ra','h_wa'];
  const CONF_KATA_ROWS = ['k_sa','k_ta','k_ka','k_na','k_ma','k_wa'];
  const HIRA_ROWS = ['h_a','h_ka','h_sa','h_ta','h_na','h_ha','h_ma','h_ya','h_ra','h_wa'];
  const KATA_ROWS = ['k_a','k_ka','k_sa','k_ta','k_na','k_ha','k_ma','k_ya','k_ra','k_wa'];

  function toast(message, type='info'){
    try { if (window.ModeAtlas?.toast) return window.ModeAtlas.toast(message, type, 2800); } catch {}
    let wrap = $('.ma-toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className='ma-toast-wrap'; document.body.appendChild(wrap); }
    const node = document.createElement('div');
    node.className = 'ma-toast ' + type;
    node.textContent = message;
    wrap.appendChild(node);
    setTimeout(()=>{ node.style.opacity='0'; setTimeout(()=>node.remove(),260); }, 2800);
  }

  function sectionTS(key){ try{ localStorage.setItem(key, String(now())); }catch{} }
  function trainerSettings(){
    let s = readJSON(SETTINGS_KEY, {});
    try { if (typeof settings === 'object' && settings) s = Object.assign({}, s, settings); } catch {}
    return s || {};
  }
  function persistTrainerSettings(next){
    try { if (typeof settings === 'object' && settings) Object.assign(settings, next); } catch {}
    writeJSON(SETTINGS_KEY, next);
    sectionTS('settingsUpdatedAt');
    try { window.KanaCloudSync?.markSectionUpdated?.(IS_WRITING ? 'writing' : 'reading'); window.KanaCloudSync?.scheduleSync?.(); } catch {}
  }
  function refreshTrainer(){
    try{ if (typeof rebuildCharMap === 'function') rebuildCharMap(); }catch{}
    try{ if (typeof ensureDataObjects === 'function') ensureDataObjects(); }catch{}
    try{ if (typeof buildModifierButtons === 'function') buildModifierButtons(); }catch{}
    try{ if (typeof buildRows === 'function' && typeof hiraganaRows === 'object') { buildRows('rowOptions', hiraganaRows, 'hiraganaRows', 'h_'); buildRows('katakanaRowOptions', katakanaRows, 'katakanaRows', 'k_'); } }catch{}
    try{ if (typeof updateTrialConfigVisibility === 'function') updateTrialConfigVisibility(); }catch{}
    try{ if (typeof updateTopStats === 'function') updateTopStats(); }catch{}
    try{ if (typeof renderHeatmap === 'function') renderHeatmap(); }catch{}
    try{ if (typeof renderScoreHistory === 'function') renderScoreHistory(); }catch{}
    try{ if (typeof saveAll === 'function') saveAll(); }catch{}
    setTimeout(markPresetActive, 30);
  }

  function makeBtn(label, active, onClick, disabled=false){
    const b=document.createElement('button');
    b.type='button';
    b.className='toggle-btn ma-structured-toggle' + (active?' active':'') + (disabled?' disabled':'');
    b.textContent=label;
    b.setAttribute('aria-pressed', active?'true':'false');
    b.disabled=!!disabled;
    b.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); if(!disabled) onClick(); });
    return b;
  }

  function modeToggle(key){
    let s = trainerSettings();
    if(key === 'speedRun'){
      s.speedRun = !s.speedRun;
      if(s.speedRun){ s.endless=false; s.timeTrial=false; s.dailyChallenge=false; s.testMode=false; s.comboKana=false; }
    } else if (key === 'timeTrial') {
      s.timeTrial = !s.timeTrial;
      if(s.timeTrial){ s.endless=false; s.dailyChallenge=false; s.testMode=false; s.speedRun=false; }
    } else if (key === 'endless') {
      s.endless = !s.endless;
      if(s.endless){ s.timeTrial=false; s.dailyChallenge=false; s.testMode=false; s.speedRun=false; }
    } else if (key === 'dailyChallenge') {
      s.dailyChallenge = !s.dailyChallenge;
      if(s.dailyChallenge){ s.timeTrial=false; s.endless=false; s.testMode=false; s.comboKana=false; s.speedRun=false; s.hint=false; }
    } else if (key === 'testMode') {
      s.testMode = !s.testMode;
      if(s.testMode){ s.timeTrial=false; s.endless=false; s.dailyChallenge=false; s.comboKana=false; s.speedRun=false; s.hint=false; }
    } else if (key === 'comboKana') {
      s.comboKana = !s.comboKana;
      if(s.comboKana){ s.dailyChallenge=false; s.testMode=false; s.speedRun=false; }
    } else if (key === 'confusableKana') {
      s.confusableKana = !s.confusableKana;
      if(s.confusableKana){
        s.hiraganaRows = CONF_HIRA_ROWS.slice();
        s.katakanaRows = CONF_KATA_ROWS.slice();
        s.dakuten=false; s.yoon=false; s.extendedKatakana=false;
        s.dailyChallenge=false; s.testMode=false; s.comboKana=false;
      }
    } else {
      s[key] = !s[key];
    }
    localStorage.removeItem('modeAtlasActivePreset');
    persistTrainerSettings(s);
    refreshTrainer();
  }

  function applyPreset(id){
    const allHira = (typeof hiraganaRows === 'object' && hiraganaRows) ? Object.keys(hiraganaRows) : HIRA_ROWS;
    const allKata = (typeof katakanaRows === 'object' && katakanaRows) ? Object.keys(katakanaRows) : KATA_ROWS;
    const presets = {
      starter:{hint:true,dakuten:false,yoon:false,extendedKatakana:false,confusableKana:false,hiraganaRows:['h_a'],katakanaRows:[]},
      intermediate:{hint:false,dakuten:false,yoon:false,extendedKatakana:false,confusableKana:false,hiraganaRows:allHira,katakanaRows:[]},
      advanced:{hint:false,dakuten:true,yoon:false,extendedKatakana:false,confusableKana:false,hiraganaRows:allHira,katakanaRows:allKata},
      pro:{hint:false,dakuten:true,yoon:true,extendedKatakana:true,confusableKana:false,hiraganaRows:allHira,katakanaRows:allKata}
    };
    if(!presets[id]) return;
    const s = Object.assign({}, trainerSettings(), {
      srs:true, focusWeak:false, endless:false, timeTrial:false, dailyChallenge:false, testMode:false, comboKana:false, speedRun:false,
      statsVisible:true, scoresVisible:true, activeBottomTab:'modifiers', optionsOpen:false
    }, presets[id]);
    localStorage.setItem('modeAtlasActivePreset', id);
    localStorage.removeItem('modeAtlasConfusableMode');
    persistTrainerSettings(s);
    refreshTrainer();
    toast(`${presets[id].hint ? 'Starter' : id[0].toUpperCase()+id.slice(1)} preset applied.`, 'ok');
  }

  function matchesPreset(id){
    const s=trainerSettings();
    const allHira = (typeof hiraganaRows === 'object' && hiraganaRows) ? Object.keys(hiraganaRows) : HIRA_ROWS;
    const allKata = (typeof katakanaRows === 'object' && katakanaRows) ? Object.keys(katakanaRows) : KATA_ROWS;
    const presets = {
      starter:{hint:true,dakuten:false,yoon:false,extendedKatakana:false,confusableKana:false,hiraganaRows:['h_a'],katakanaRows:[]},
      intermediate:{hint:false,dakuten:false,yoon:false,extendedKatakana:false,confusableKana:false,hiraganaRows:allHira,katakanaRows:[]},
      advanced:{hint:false,dakuten:true,yoon:false,extendedKatakana:false,confusableKana:false,hiraganaRows:allHira,katakanaRows:allKata},
      pro:{hint:false,dakuten:true,yoon:true,extendedKatakana:true,confusableKana:false,hiraganaRows:allHira,katakanaRows:allKata}
    };
    const p=presets[id]; if(!p) return false;
    const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.slice().sort().join('|')===b.slice().sort().join('|');
    return ['hint','dakuten','yoon','extendedKatakana','confusableKana'].every(k=>!!s[k]===!!p[k]) && same(s.hiraganaRows,p.hiraganaRows) && same(s.katakanaRows,p.katakanaRows);
  }

  function markPresetActive(){
    if(!IS_TRAINER) return;
    const active=localStorage.getItem('modeAtlasActivePreset') || '';
    $$('[data-preset]').forEach(btn=>{
      const on = active && btn.dataset.preset===active && matchesPreset(active);
      btn.classList.toggle('active', !!on);
      btn.setAttribute('aria-pressed', on?'true':'false');
    });
  }

  function installStructuredModifierMenu(){
    if(!IS_TRAINER) return;
    const content=$('#modifiersContent'); const stack=$('.options-stack', content); const mod=$('#modifierOptions');
    if(!content || !stack || !mod) return;
    const old=window.buildModifierButtons || (typeof buildModifierButtons === 'function' ? buildModifierButtons : null);

    window.buildModifierButtons = buildModifierButtons = function(){
      const s=trainerSettings();
      let presetPanel=$('#maPresetMenu');
      if(!presetPanel){
        presetPanel=document.createElement('div');
        presetPanel.id='maPresetMenu';
        presetPanel.className='ma-settings-section ma-preset-menu';
        stack.insertBefore(presetPanel, stack.firstChild);
      }
      presetPanel.innerHTML = `
        <div class="section-title">Practice presets</div>
        <div class="ma-preset-grid">
          ${[
            ['starter','Starter','A-row with hints'],
            ['intermediate','Intermediate','All Hiragana, no hints'],
            ['advanced','Advanced','Hiragana + Katakana + Dakuten'],
            ['pro','Pro','Everything enabled']
          ].map(([id,title,desc])=>`<button type="button" class="ma-preset-btn" data-preset="${id}"><span>${title}</span><small>${desc}</small></button>`).join('')}
        </div>`;

      const groups=[
        ['Question flow', [
          ['srs','SRS'], ['endless','Endless'], ['timeTrial','Time Trial'], ['speedRun','Speed Run'], ['dailyChallenge','Daily Challenge'], ['testMode','Test Mode']
        ]],
        ['Practice focus', [
          ['hint','Hint Mode'], ['comboKana','Combo Kana'], ['focusWeak','Focus Weak'], ['confusableKana','Confusable Kana']
        ]],
        ['Content modifiers', [
          ['dakuten','Dakuten'], ['yoon','Yōon'], ['extendedKatakana','Extended Katakana']
        ]]
      ];
      mod.innerHTML='';
      mod.classList.add('ma-structured-modifiers');
      groups.forEach(([title,items])=>{
        const section=document.createElement('div');
        section.className='ma-modifier-group';
        const head=document.createElement('div');
        head.className='ma-modifier-group-title';
        head.textContent=title;
        const grid=document.createElement('div');
        grid.className='ma-modifier-group-grid';
        items.forEach(([key,label])=>grid.appendChild(makeBtn(label, !!s[key], ()=>modeToggle(key))));
        section.append(head,grid);
        mod.appendChild(section);
      });
      markPresetActive();
    };

    document.addEventListener('click', e=>{
      const preset=e.target.closest?.('[data-preset]');
      if(preset){ e.preventDefault(); e.stopPropagation(); applyPreset(preset.dataset.preset); }
    }, true);

    try{ buildModifierButtons(); }catch{ if(old) old(); }
  }

  function currentWrongList(){
    try{
      const per = sessionStats?.perChar || {};
      return Object.entries(per).filter(([_,d])=>Number(d.wrong||0)>0).map(([ch])=>ch);
    }catch{return [];}
  }

  function installSessionUpgrades(){
    if(!IS_TRAINER) return;
    try{
      if(window.__maSessionUpgradesDone) return;
      window.__maSessionUpgradesDone=true;

      const originalNext = nextCharacter;
      const originalStart = startSession;
      const originalShowModal = showSessionModal;

      window.__maMistakeReview = {active:false, list:[], index:0};
      window.__maSpeedRunTarget = 20;

      nextCharacter = function(){
        const review=window.__maMistakeReview;
        const s=trainerSettings();
        if(review?.active){
          if(!sessionStarted) return;
          if(review.index >= review.list.length){
            review.active=false;
            endSession(true);
            return;
          }
          clearHint?.();
          closePopup?.();
          inputEl.value='';
          currentChar=review.list[review.index++];
          hiraganaEl.textContent=currentChar;
          hiraganaEl.classList.remove('flash-correct','flash-wrong');
          charStartTime=Date.now();
          gameOverTitleEl.textContent='Wrong';
          gameOverAnswerEl.textContent='';
          inputEl.disabled=false;
          inputEl.focus();
          return;
        }
        if(s.speedRun && sessionStarted && sessionStats && sessionStats.answered >= window.__maSpeedRunTarget){
          endSession(true);
          return;
        }
        return originalNext.apply(this, arguments);
      };

      startSession = function(){
        const s=trainerSettings();
        if(s.speedRun){
          const next=Object.assign({}, s, {endless:true,timeTrial:false,dailyChallenge:false,testMode:false,comboKana:false});
          persistTrainerSettings(next);
        }
        return originalStart.apply(this, arguments);
      };
      if(startBtn){
        startBtn.replaceWith(startBtn.cloneNode(true));
        const newStart=$('#startBtn');
        if(newStart) newStart.addEventListener('click', startSession);
      }

      showSessionModal = function(autoEnded=false){
        originalShowModal.call(this, autoEnded);
        renderSessionActions(autoEnded);
      };

      function renderSessionActions(autoEnded){
        const actions = sessionModalBackdrop?.querySelector('.modal-actions');
        if(!actions) return;
        let enhanced = $('#maSessionActionPanel', actions);
        if(!enhanced){
          enhanced=document.createElement('div');
          enhanced.id='maSessionActionPanel';
          enhanced.className='ma-session-actions-pro';
          actions.insertBefore(enhanced, actions.firstChild);
        }
        const wrong=currentWrongList();
        const title = trainerSettings().speedRun ? 'Speed run complete' : (autoEnded ? 'Session complete' : 'Session ended');
        enhanced.innerHTML = `
          <div class="ma-session-summary">
            <strong>${title}</strong>
            <span>${wrong.length ? `${wrong.length} kana to review from this session.` : 'No mistakes to review from this session.'}</span>
          </div>
          <div class="ma-session-action-grid">
            <button type="button" data-ma-try-again>Try again</button>
            <button type="button" data-ma-review-mistakes ${wrong.length?'':'disabled'}>Review mistakes</button>
            <button type="button" data-ma-change-settings>Change settings</button>
            <button type="button" data-ma-view-results>View results</button>
          </div>`;
      }

      document.addEventListener('click', e=>{
        if(e.target.closest?.('[data-ma-try-again]')){
          e.preventDefault(); sessionModalBackdrop.classList.remove('open'); window.__maMistakeReview.active=false; startSession();
        }
        if(e.target.closest?.('[data-ma-review-mistakes]')){
          e.preventDefault();
          const wrong=currentWrongList();
          if(!wrong.length) return;
          sessionModalBackdrop.classList.remove('open');
          window.__maMistakeReview={active:true,list:wrong.slice(),index:0};
          const s=Object.assign({}, trainerSettings(), {endless:true,timeTrial:false,dailyChallenge:false,testMode:false,comboKana:false,speedRun:false});
          persistTrainerSettings(s);
          startSession();
          toast('Mistake review started.', 'ok');
        }
        if(e.target.closest?.('[data-ma-change-settings]')){
          e.preventDefault(); sessionModalBackdrop.classList.remove('open'); 
          const s=Object.assign({}, trainerSettings(), {activeBottomTab:'modifiers'});
          persistTrainerSettings(s); refreshTrainer();
        }
        if(e.target.closest?.('[data-ma-view-results]')){
          e.preventDefault(); location.href='/results/';
        }
      }, true);
    }catch(err){ console.warn('Session upgrade install failed', err); }
  }

  function saveKeyStatsForPreset(){
    // Track preset achievement from accumulated Reading + Writing character correctness.
    const readingStats = readJSON('charStats',{});
    const writingStats = readJSON('reverseCharStats',{});
    const correctForChar = ch => Number((readingStats[ch]||{}).correct || (readingStats[ch]||{}).right || 0) + Number((writingStats[ch]||{}).correct || (writingStats[ch]||{}).right || 0);
    const countFor = chars => chars.reduce((sum,ch)=>sum + correctForChar(ch), 0);
    return {
      starter: Math.min(100, countFor('あいうえお'.split(''))),
      intermediate: Math.min(100, countFor(HIRA)),
      advanced: Math.min(100, countFor([...HIRA,...KATA])),
      pro: Math.min(100, countFor([...HIRA,...KATA, ...CONFUSABLE]))
    };
  }

  function installPresetChecklist(){
    if(PAGE !== 'kana.html') return;
    const anchor = $('#maPresetChecklist') || $('.ma-kana-pro-card') || $('main') || document.body;
    let panel=$('#maPresetChecklist');
    if(!panel){
      panel=document.createElement('section');
      panel.id='maPresetChecklist';
      panel.className='ma-kana-pro-card ma-preset-checklist';
      anchor.parentNode.insertBefore(panel, anchor.nextSibling);
    }
    const progress=saveKeyStatsForPreset();
    const defs=[
      ['starter','Starter','A-row with hints'],
      ['intermediate','Intermediate','All Hiragana, no hints'],
      ['advanced','Advanced','Hiragana + Katakana + Dakuten'],
      ['pro','Pro','Everything enabled']
    ];
    panel.innerHTML=`
      <div class="ma-kana-pro-head">
        <div>
          <h2 class="ma-kana-pro-title">Preset achievements</h2>
          <div class="ma-kana-pro-sub">Get 100 correct answers over time in each preset. Nothing is locked — this is just a progress tracker.</div>
        </div>
      </div>
      <div class="ma-achievement-grid">
        ${defs.map(([id,title,desc])=>{
          const n=progress[id]||0; const done=n>=100;
          return `<article class="ma-achievement-card ${done?'done':''}">
            <div class="ma-achievement-top"><b>${title}</b><span>${n}/100</span></div>
            <small>${desc}</small>
            <div class="ma-progress-track"><span style="width:${Math.min(100,n)}%"></span></div>
            <em>${done?'Complete':'In progress'}</em>
          </article>`;
        }).join('')}
      </div>`;
  }

  function installNoDataStates(){
    if(PAGE === 'test.html'){
      const run=()=>{
        const possibleLists=['testModeResults','readingTestModeResults','writingTestModeResults','kanaTrainerReadingTestModeResults','kanaTrainerWritingTestModeResults'];
        const has=possibleLists.some(k=>Array.isArray(readJSON(k,null)) && readJSON(k,[]).length);
        if(has) return;
        if($('#maNoDataResults')) return;
        const target=$('.stored-tests, #storedTests, .results-list, main') || document.body;
        const box=document.createElement('section');
        box.id='maNoDataResults';
        box.className='ma-no-data-card';
        box.innerHTML='<h2>No formal test results yet</h2><p>Complete a Reading or Writing Test Mode run to unlock detailed score cards, speed trends, and weak-kana breakdowns.</p><div class="ma-no-data-actions"><a href="/reading/">Start Reading Test</a><a href="/writing/">Start Writing Test</a></div>';
        target.parentNode.insertBefore(box, target);
      };
      setTimeout(run,600); setTimeout(run,1800);
    }
    if(PAGE === 'kana.html'){
      const hasStats=Object.keys(readJSON('charStats',{})).length || Object.keys(readJSON('reverseCharStats',{})).length;
      if(!hasStats && !$('#maNoDataKana')){
        const main=$('main')||document.body;
        const box=document.createElement('section');
        box.id='maNoDataKana';
        box.className='ma-no-data-card ma-no-data-kana';
        box.innerHTML='<h2>Your Kana dashboard is ready</h2><p>Complete a few Reading or Writing sessions to fill this hub with streaks, mastery labels, speed goals, and review suggestions.</p>';
        main.appendChild(box);
      }
    }
  }

  function compareImportPayload(payload){
    const labels = [
      ['settings','Settings','settingsUpdatedAt'],
      ['stats','Reading stats','resultsUpdatedAt'],
      ['times','Speed data','resultsUpdatedAt'],
      ['srs','SRS progress','srsUpdatedAt'],
      ['dailyChallengeHistory','Daily challenge history','dailyUpdatedAt'],
      ['scoreHistory','Score history','resultsUpdatedAt'],
      ['readingTestModeResults','Reading test results','resultsUpdatedAt'],
      ['writingTestModeResults','Writing test results','resultsUpdatedAt']
    ];
    const importedAt = Date.parse(payload.exportedAt||payload.updatedAt||'') || Number(payload.exportedAt||0) || 0;
    return labels.filter(([key])=>payload[key] !== undefined || (key==='writingTestModeResults' && payload.testModeResults)).map(([key,label,ts])=>{
      const local=Number(localStorage.getItem(ts)||0);
      const incoming=Number(payload[ts]||payload.sectionTimestamps?.[ts]||importedAt||0);
      return {label, action: !local || incoming>=local ? 'Will update' : 'Local/cloud appears newer'};
    });
  }

  function showImportPreview(payload, onApply){
    let modal=$('#maImportPreview');
    if(!modal){
      modal=document.createElement('div');
      modal.id='maImportPreview';
      modal.className='ma-import-preview-backdrop';
      modal.innerHTML=`<div class="ma-import-preview-modal">
        <h2>Preview import</h2>
        <p>This checks the backup against your current local/cloud timestamps before applying it.</p>
        <div class="ma-import-preview-list"></div>
        <div class="ma-import-preview-actions">
          <button type="button" data-ma-import-cancel>Cancel</button>
          <button type="button" data-ma-import-apply>Import and merge</button>
        </div>
      </div>`;
      document.body.appendChild(modal);
    }
    const rows=compareImportPayload(payload);
    $('.ma-import-preview-list', modal).innerHTML = rows.length ? rows.map(r=>`<div><span>${r.label}</span><b>${r.action}</b></div>`).join('') : '<div><span>Backup data</span><b>Ready to import</b></div>';
    modal.classList.add('open');
    const close=()=>modal.classList.remove('open');
    $('[data-ma-import-cancel]', modal).onclick=close;
    $('[data-ma-import-apply]', modal).onclick=()=>{ close(); onApply(); toast('Backup imported and merged.', 'ok'); };
  }

  function installImportPreview(){
    // Native trainer import modal.
    document.addEventListener('click', e=>{
      const btn=e.target.closest?.('#confirmImportBtn');
      if(!btn) return;
      const txt=$('#importTextarea');
      if(!txt) return;
      const raw=txt.value.trim();
      if(!raw) return;
      e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
      try{
        const payload=JSON.parse(raw);
        showImportPreview(payload, ()=>{
          try{ if(typeof applyImportedData === 'function') applyImportedData(payload); else if(typeof importSaveObject === 'function') importSaveObject(payload); }catch(err){ alert('Import failed. Please use a valid Mode Atlas save file.'); return; }
          try{ $('#importModalBackdrop')?.classList.remove('open'); }catch{}
        });
      }catch{ alert('Import failed. Make sure the JSON is valid.'); }
    }, true);

    // Profile drawer import function hook, where available.
    setTimeout(()=>{
      try{
        if(typeof importSaveObject === 'function' && !window.__maImportHooked){
          const native=importSaveObject;
          window.__maImportHooked=true;
          importSaveObject=function(obj){
            showImportPreview(obj, ()=>{ native(obj); location.reload(); });
          };
        }
      }catch{}
    }, 1000);
  }

  function installWhatsNew(){
    const version=(window.ModeAtlasEnv && window.ModeAtlasEnv.appVersion) || '2.11.5';
    const changes=[
      'Cleaner install behaviour: the app now asks once and stays available from the profile menu.',
      'Improved save and sync readiness.',
      'More reliable app updates after a new release.',
      'Small profile and status wording polish.'
    ];
    const signature = version + '::' + changes.join('|');
    const seenVersionKey = 'maWhatsNewSeenVersion';
    const seenSignatureKey = 'maWhatsNewSeenSignature';
    function markSeen(){
      try {
        localStorage.setItem(seenVersionKey, version);
        localStorage.setItem(seenSignatureKey, signature);
        localStorage.setItem('maWhatsNewSeen', version);
      } catch {}
    }
    function shouldAutoShow(){
      try {
        return localStorage.getItem(seenVersionKey) !== version || localStorage.getItem(seenSignatureKey) !== signature;
      } catch { return true; }
    }
    function open(){
      let modal=$('#maWhatsNew');
      if(!modal){
        modal=document.createElement('div');
        modal.id='maWhatsNew';
        modal.className='ma-whats-new-backdrop';
        modal.innerHTML=`<div class="ma-whats-new-modal">
          <h2>What’s new</h2>
          <p>Mode Atlas has a new polish update focused on cleaner menus, safer save handling, and clearer account information.</p>
          <ul>${changes.map(c=>`<li>${c}</li>`).join('')}</ul>
          <button type="button" data-ma-whats-new-close>Done</button>
        </div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', e=>{ if(e.target===modal || e.target.closest('[data-ma-whats-new-close]')) { modal.classList.remove('open'); markSeen(); } });
      }
      modal.classList.add('open');
      markSeen();
    }
    window.ModeAtlas=window.ModeAtlas||{};
    window.ModeAtlas.showWhatsNew=open;
    setTimeout(()=>{
      const drawer=$('#profileDrawer');
      if(false && drawer && !$('#maWhatsNewProfileBtn')){
        const btn=document.createElement('button');
        btn.id='maWhatsNewProfileBtn';
        btn.type='button';
        btn.className='profile-action';
        btn.textContent='What’s new';
        btn.addEventListener('click', open);
        const actions=$('.profile-actions', drawer) || drawer;
        actions.appendChild(btn);
      }
      if(shouldAutoShow() && ['index.html','kana.html'].includes(PAGE)) open();
    }, 1200);
  }

  function installPwaPolish(){
    let deferredPrompt=null;
    const PROMPT_SEEN_KEY='modeAtlasInstallPromptSeen';
    const PROMPT_DISMISSED_AT_KEY='modeAtlasInstallPromptDismissedAt';
    function isStandalone(){
      try { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; } catch { return false; }
    }
    function hasSeenPrompt(){
      try { return localStorage.getItem(PROMPT_SEEN_KEY) === '1'; } catch { return true; }
    }
    function markPromptSeen(){
      try {
        localStorage.setItem(PROMPT_SEEN_KEY, '1');
        localStorage.setItem(PROMPT_DISMISSED_AT_KEY, String(Date.now()));
      } catch {}
    }
    window.ModeAtlasInstall = window.ModeAtlasInstall || {};
    window.ModeAtlasInstall.show = async function(){
      if(deferredPrompt){
        try { deferredPrompt.prompt(); await deferredPrompt.userChoice; } catch {}
        deferredPrompt=null;
        markPromptSeen();
        $('#maInstallPrompt')?.remove();
        return true;
      }
      const msg='To install Mode Atlas, use your browser menu or, on iPad, Share → Add to Home Screen.';
      if(window.ModeAtlasToast) window.ModeAtlasToast(msg);
      else alert(msg);
      return false;
    };
    window.addEventListener('beforeinstallprompt', e=>{
      e.preventDefault();
      deferredPrompt=e;
      window.ModeAtlasInstall.deferredPrompt=e;
      if(!hasSeenPrompt() && !isStandalone()) showInstall();
    });
    window.addEventListener('appinstalled', ()=>{ markPromptSeen(); deferredPrompt=null; $('#maInstallPrompt')?.remove(); });
    function showInstall(){
      if($('#maInstallPrompt') || !deferredPrompt || hasSeenPrompt() || isStandalone()) return;
      const prompt=document.createElement('div');
      prompt.id='maInstallPrompt';
      prompt.className='ma-install-prompt';
      prompt.innerHTML='<div><b>Install Mode Atlas</b><span>Add it to your device for faster access and a full-screen study experience. You can also install later from the profile menu.</span></div><button type="button" data-ma-install>Install</button><button type="button" data-ma-install-close>Not now</button>';
      document.body.appendChild(prompt);
      prompt.addEventListener('click', async e=>{
        if(e.target.closest('[data-ma-install-close]')){ markPromptSeen(); prompt.remove(); }
        if(e.target.closest('[data-ma-install]')){ await window.ModeAtlasInstall.show(); }
      });
    }

  }
  function boot(){
    installStructuredModifierMenu();
    installSessionUpgrades();
    installPresetChecklist();
    installNoDataStates();
    installImportPreview();
    installWhatsNew();
    installPwaPolish();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('pageshow', ()=>setTimeout(boot,100));
})();
(function ModeAtlasAbout(){
  if (window.__modeAtlasAboutLoaded) return;
  window.__modeAtlasAboutLoaded = true;

  const APP_VERSION = (window.ModeAtlasEnv && window.ModeAtlasEnv.appVersion) || '2.11.5';
  const SAVE_SCHEMA_VERSION = '3';
  const BUILD_LABEL = 'Professional Polish Update';
  const BUILD_DATE = '2026-05-01';
  const DEVELOPER = 'Jack Wright';
  const SUPPORT_EMAIL = 'support@mode-atlas.com';
  const OFFICIAL_SITE = 'mode-atlas.app';

  function $(sel, root=document){ return root.querySelector(sel); }
  function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
  function fmtDate(ts){
    const n = Number(ts || 0);
    if (!Number.isFinite(n) || !n) return 'Never';
    const d = new Date(n);
    if (Number.isNaN(d.getTime())) return 'Never';
    return d.toLocaleString([], { hour:'numeric', minute:'2-digit', day:'numeric', month:'short', year:'numeric' });
  }
  function safeJSON(key, fallback){ try{ const raw=localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }catch{ return fallback; } }
  function latestTimestamp(keys){
    let best = 0;
    keys.forEach(k=>{
      const n = Number(localStorage.getItem(k) || 0);
      if (Number.isFinite(n) && n > best) best = n;
    });
    return best;
  }
  function getCloudStatus(){
    const user = window.KanaCloudSync?.getUser?.() || window.currentUser || null;
    const signedIn = !!user;
    const online = navigator.onLine !== false;
    const lastSync = latestTimestamp([
      'modeAtlasLastCloudSyncAt','modeAtlasLastSyncCheck','cloudReadingUpdatedAt','cloudWritingUpdatedAt','testModeResultsUpdatedAt','readingTestModeResultsUpdatedAt','writingTestModeResultsUpdatedAt','kanaWordBankUpdatedAt'
    ]);
    let mode = 'Local only';
    let status = 'Local saving active';
    if (signedIn && online){ mode = 'Cloud + local'; status = 'Cloud available'; }
    else if (signedIn && !online){ mode = 'Cloud account offline'; status = 'No cloud access'; }
    return { signedIn, online, mode, status, lastSync };
  }
  function getAppInfo(){
    const cloud = getCloudStatus();
    return {
      version: APP_VERSION,
      saveSchema: SAVE_SCHEMA_VERSION,
      build: BUILD_LABEL,
      buildDate: BUILD_DATE,
      page: (location.pathname.split('/').pop() || 'index.html'),
      theme: localStorage.getItem('modeAtlasThemePreference') || 'dark',
      saveMode: cloud.mode,
      cloudStatus: cloud.status,
      signedIn: cloud.signedIn ? 'Yes' : 'No',
      online: cloud.online ? 'Yes' : 'No',
      lastCloudSync: fmtDate(cloud.lastSync),
      localSaveUpdated: fmtDate(latestTimestamp([
        'settingsUpdatedAt','resultsUpdatedAt','srsUpdatedAt','dailyUpdatedAt','profileUpdatedAt','modeAtlasLastSyncCheck','kanaWordBankUpdatedAt'
      ])),
      installSupport: window.ModeAtlasEnv?.canUsePwa ? 'Available' : 'Not available here',
      supportEmail: SUPPORT_EMAIL,
      storage: (()=>{ try{ localStorage.setItem('__ma_probe','1'); localStorage.removeItem('__ma_probe'); return 'Available'; }catch{return 'Blocked';} })()
    };
  }

  const whatsNewItems = [
    'Cleaner install behaviour: the app asks once, then stays available from the profile menu.',
    'Improved save and sync readiness.',
    'More reliable update handling after new releases.',
    'Small polish across profile, save, and status wording.'
  ];

  function ensureAboutModal(){
    let backdrop = $('#maAboutBackdrop');
    if (backdrop) return backdrop;
    backdrop = document.createElement('div');
    backdrop.id = 'maAboutBackdrop';
    backdrop.className = 'ma-about-backdrop';
    backdrop.innerHTML = `
      <section class="ma-about-modal" role="dialog" aria-modal="true" aria-labelledby="maAboutTitle">
        <div class="ma-about-hero">
          <div class="ma-about-mark">かな</div>
          <div>
            <div class="ma-about-kicker">Mode Atlas</div>
            <h2 id="maAboutTitle">About Mode Atlas</h2>
            <p>Japanese study tools for kana recognition, recall, review, and connected learning branches.</p>
          </div>
          <button type="button" class="ma-about-close" data-ma-about-close aria-label="Close About">Close</button>
        </div>

        <div class="ma-about-tabs" role="tablist" aria-label="About sections">
          <button type="button" class="active" data-ma-about-tab="overview">Overview</button>
          <button type="button" data-ma-about-tab="whatsnew">What’s new</button>
          <button type="button" data-ma-about-tab="legal">Legal</button>
        </div>

        <div class="ma-about-panel active" data-ma-about-panel="overview">
          <div class="ma-about-grid">
            <article class="ma-about-card"><span>App version</span><strong data-ma-info="version"></strong><small>Current app release installed in this build.</small></article>
            <article class="ma-about-card"><span>Save version</span><strong data-ma-info="saveSchema"></strong><small>Helps keep backups compatible across app updates.</small></article>
            <article class="ma-about-card"><span>Build</span><strong data-ma-info="build"></strong><small data-ma-info="buildDate"></small></article>
            <article class="ma-about-card"><span>Install support</span><strong data-ma-info="installSupport"></strong><small>Add Mode Atlas to your device for quicker access.</small></article>
            <article class="ma-about-card"><span>Support</span><strong data-ma-info="supportEmail"></strong><small>Use this for help, bug reports, or app questions.</small></article>
          </div>

          <div class="ma-about-section">
            <h3>Account & save status</h3>
            <div class="ma-about-table">
              <div><span>Save mode</span><strong data-ma-info="saveMode"></strong></div>
              <div><span>Sync status</span><strong data-ma-info="cloudStatus"></strong></div>
              <div><span>Signed in</span><strong data-ma-info="signedIn"></strong></div>
              <div><span>Connection</span><strong data-ma-info="online"></strong></div>
              <div><span>Last cloud sync</span><strong data-ma-info="lastCloudSync"></strong></div>
              <div><span>Local save updated</span><strong data-ma-info="localSaveUpdated"></strong></div>
              <div><span>Storage access</span><strong data-ma-info="storage"></strong></div>
              <div><span>Theme preference</span><strong data-ma-info="theme"></strong></div>
            </div>
          </div>

          <div class="ma-about-section ma-about-credit">
            <h3>Developer</h3>
            <p><strong>Created by ${DEVELOPER}</strong></p>
            <p>Designed and built as a focused Japanese study ecosystem.</p>
            <p>Support: <a href="mailto:support@mode-atlas.com">support@mode-atlas.com</a> · <a href="https://mode-atlas.app/" target="_blank" rel="noopener">mode-atlas.app</a></p>
            <p class="ma-about-muted">© 2026 ${DEVELOPER}. All rights reserved.</p>
          </div>
        </div>

        <div class="ma-about-panel" data-ma-about-panel="whatsnew">
          <div class="ma-about-section">
            <h3>What’s new in this build</h3>
            <p class="ma-about-muted">Recent improvements that affect everyday use.</p>
            <ul class="ma-about-list">${whatsNewItems.map(item=>`<li>${item}</li>`).join('')}</ul>
            <button type="button" class="ma-about-primary" data-ma-open-legacy-whats-new>Open full update notes</button>
          </div>
        </div>

        <div class="ma-about-panel" data-ma-about-panel="legal">
          <div class="ma-about-section">
            <h3>Privacy & data</h3>
            <p>Mode Atlas saves learning progress on this device. Signing in lets supported progress follow you across devices.</p>
            <p>Local backups are user-controlled exports. Importing a backup should merge with newer local/cloud sections rather than blindly replacing current progress.</p>
          </div>
          <div class="ma-about-section">
            <h3>Disclaimer</h3>
            <p>Mode Atlas is a study aid. It is not an official language certification tool and does not guarantee language proficiency outcomes.</p>
          </div>
          <div class="ma-about-section">
            <h3>Credits & ownership</h3>
            <p>Mode Atlas, its app structure, and learning interface are developed by ${DEVELOPER}. Japanese kana characters are part of the Japanese writing system and are not proprietary.</p>
          </div>
        </div>
      </section>`;
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', (e)=>{
      if (e.target === backdrop || e.target.closest('[data-ma-about-close]')) closeAbout();
      const tab = e.target.closest('[data-ma-about-tab]');
      if (tab) switchAboutTab(tab.dataset.maAboutTab);
      if (e.target.closest('[data-ma-open-legacy-whats-new]')) {
        e.preventDefault();
        if (window.ModeAtlas?.showWhatsNew) window.ModeAtlas.showWhatsNew();
      }
    });
    return backdrop;
  }
  function switchAboutTab(name){
    const b = ensureAboutModal();
    $all('[data-ma-about-tab]', b).forEach(btn=>btn.classList.toggle('active', btn.dataset.maAboutTab === name));
    $all('[data-ma-about-panel]', b).forEach(panel=>panel.classList.toggle('active', panel.dataset.maAboutPanel === name));
  }
  function renderAbout(){
    const b = ensureAboutModal();
    const info = getAppInfo();
    Object.entries(info).forEach(([key,val])=>{
      $all(`[data-ma-info="${key}"]`, b).forEach(node=>{ node.textContent = String(val); });
    });
  }
  function openAbout(tab='overview'){
    renderAbout();
    switchAboutTab(tab);
    ensureAboutModal().classList.add('open');
  }
  function closeAbout(){ const b=$('#maAboutBackdrop'); if(b) b.classList.remove('open'); }

  function installProfileButton(){
    const drawers = $all('.profile-drawer,#profileDrawer,.profile-overlay aside,.drawer-panel');
    drawers.forEach(drawer=>{
      // Remove direct What’s New buttons where possible; About now owns it.
      $all('[data-ma-whats-new],#maWhatsNewProfileBtn', drawer).forEach(btn=>btn.remove());

      // The QOL profile App panel owns the visible About button. Older builds
      // injected a second standalone button near the top of the drawer, so keep
      // only About buttons that live inside the App/tools panel.
      $all('[data-ma-about-open]', drawer).forEach(btn=>{
        if (!btn.closest('.ma-tools-panel')) btn.remove();
      });
    });
  }

  document.addEventListener('click', (e)=>{
    if (e.target.closest('[data-ma-about-open]')) { e.preventDefault(); openAbout(); }
  }, true);

  window.ModeAtlas = window.ModeAtlas || {};
  window.ModeAtlas.openAbout = openAbout;
  window.ModeAtlas.appInfo = getAppInfo;

  function boot(){ installProfileButton(); setTimeout(installProfileButton, 800); setTimeout(installProfileButton, 1800); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  new MutationObserver(()=>installProfileButton()).observe(document.documentElement,{childList:true,subtree:true});
})();
(function(){
  'use strict';
  const VERSION = (window.ModeAtlasEnv && window.ModeAtlasEnv.appVersion) || '2.11.5';
  const HIRA = ['あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','と','な','に','ぬ','ね','の','は','ひ','ふ','へ','ほ','ま','み','む','め','も','や','ゆ','よ','ら','り','る','れ','ろ','わ','を','ん'];
  const KATA = ['ア','イ','ウ','エ','オ','カ','キ','ク','ケ','コ','サ','シ','ス','セ','ソ','タ','チ','ツ','テ','ト','ナ','ニ','ヌ','ネ','ノ','ハ','ヒ','フ','ヘ','ホ','マ','ミ','ム','メ','モ','ヤ','ユ','ヨ','ラ','リ','ル','レ','ロ','ワ','ヲ','ン'];
  const DAK = ['が','ぎ','ぐ','げ','ご','ざ','じ','ず','ぜ','ぞ','だ','ぢ','づ','で','ど','ば','び','ぶ','べ','ぼ','ぱ','ぴ','ぷ','ぺ','ぽ','ガ','ギ','グ','ゲ','ゴ','ザ','ジ','ズ','ゼ','ゾ','ダ','ヂ','ヅ','デ','ド','バ','ビ','ブ','ベ','ボ','パ','ピ','プ','ペ','ポ'];
  const YOON = ['きゃ','きゅ','きょ','しゃ','しゅ','しょ','ちゃ','ちゅ','ちょ','にゃ','にゅ','にょ','ひゃ','ひゅ','ひょ','みゃ','みゅ','みょ','りゃ','りゅ','りょ','ぎゃ','ぎゅ','ぎょ','じゃ','じゅ','じょ','びゃ','びゅ','びょ','ぴゃ','ぴゅ','ぴょ','キャ','キュ','キョ','シャ','シュ','ショ','チャ','チュ','チョ','ニャ','ニュ','ニョ','ヒャ','ヒュ','ヒョ','ミャ','ミュ','ミョ','リャ','リュ','リョ'];
  const EXT = ['ファ','フィ','フェ','フォ','ヴァ','ヴィ','ヴ','ヴェ','ヴォ','ティ','ディ','チェ','ジェ','シェ','ウィ','ウェ','ウォ'];
  const ALL = [...new Set([...HIRA,...KATA,...DAK,...YOON,...EXT])];
  let ACH_INDEX = {};
  function readJSON(k, fallback){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):fallback; }catch(e){ return fallback; } }
  function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function clamp(n){return Math.round(Math.max(0, Math.min(100, Number(n)||0)));}
  function latestTimestamp(keys){ let best=0; keys.forEach(k=>{ const v=localStorage.getItem(k); const t=v?Date.parse(v):0; if(t>best) best=t; }); return best; }
  function countStats(){
    const r=readJSON('charStats',{}), w=readJSON('reverseCharStats',{}), times=readJSON('charTimes',{}), words=readJSON('kanaWordBank',[]), tests=readJSON('testModeResults',[]);
    let correct=0, wrong=0, mastered=0, reviewing=0, learning=0, seen=new Set(), under2=0, under1=0, perfect=0, avgSum=0, avgCount=0;
    [r,w].forEach(obj=>Object.keys(obj||{}).forEach(ch=>{ const s=obj[ch]||{}; const c=+s.correct||0, x=+s.wrong||0; if(c+x>0) seen.add(ch); correct+=c; wrong+=x; }));
    ALL.forEach(ch=>{
      const rs=(r&&r[ch])||{}, ws=(w&&w[ch])||{}; const c=(+rs.correct||0)+(+ws.correct||0), x=(+rs.wrong||0)+(+ws.wrong||0); const total=c+x;
      const raw=(times&&times[ch]&&times[ch].avg)||0; const avg=raw>30 ? raw/1000 : raw;
      if(total===0) return;
      if(avg){ avgSum+=avg; avgCount++; }
      if(c>=20 && c/Math.max(1,total)>=0.9 && (!avg || avg<=2)) mastered++;
      else if(total>=8 && c/Math.max(1,total)>=0.7) reviewing++;
      else learning++;
      if(avg && avg<=2) under2++;
      if(avg && avg<=1) under1++;
    });
    const wordCount = Array.isArray(words) ? words.length : (words&&typeof words==='object'?Object.keys(words).length:0);
    const resultCount = Array.isArray(tests) ? tests.length : 0;
    try { perfect = (Array.isArray(tests)?tests:[]).filter(t=>Number(t.accuracy||0)>=100 || (Number(t.wrong||t.incorrect||0)===0 && Number(t.correct||0)>0)).length; } catch {}
    const cloud = localStorage.getItem('modeAtlasLastCloudSyncAt') ? 1 : 0;
    const backup = localStorage.getItem('modeAtlasLastExportAt') || localStorage.getItem('modeAtlasLastBackupAt') ? 1 : 0;
    const recentSave = latestTimestamp(['settingsUpdatedAt','resultsUpdatedAt','srsUpdatedAt','dailyUpdatedAt','profileUpdatedAt','kanaWordBankUpdatedAt']);
    return {correct,wrong,total:correct+wrong,seen:seen.size,mastered,reviewing,learning,under2,under1,wordCount,resultCount,perfect,cloud,backup,recentSave,avg:avgCount?avgSum/avgCount:0};
  }
  const DEFINITIONS = {
    general: [
      {name:'First Steps', tier:'I', short:'25 answers', detail:'Answer 25 questions anywhere in Mode Atlas. Reading, Writing, Tests, and future branches all count.', target:25, key:'total'},
      {name:'Study Rhythm', tier:'I', short:'250 answers', detail:'Answer 250 total questions. This rewards steady practice across the app.', target:250, key:'total'},
      {name:'Study Rhythm', tier:'II', short:'1,000 answers', detail:'Answer 1,000 total questions across Mode Atlas.', target:1000, key:'total'},
      {name:'Study Rhythm', tier:'III', short:'2,500 answers', detail:'Answer 2,500 total questions across Mode Atlas.', target:2500, key:'total'},
      {name:'Study Rhythm', tier:'IV', short:'5,000 answers', detail:'Answer 5,000 total questions. This is for long-term consistency.', target:5000, key:'total'},
      {name:'Cloud Ready', tier:'Sync', short:'Cloud synced', detail:'Sign in and complete at least one successful cloud save so progress can follow you across devices.', target:1, key:'cloud'},
      {name:'Safety Net', tier:'Backup', short:'Export backup', detail:'Export or copy a save backup at least once. Backups help protect progress before big app updates.', target:1, key:'backup'}
    ],
    kana: [
      {name:'Kana Started', tier:'I', short:'25 kana seen', detail:'Practise at least 25 unique kana in Reading or Writing.', target:25, key:'seen'},
      {name:'Kana Collector', tier:'I', short:'75 kana seen', detail:'Practise at least 75 unique kana in the Kana Trainer.', target:75, key:'seen'},
      {name:'Kana Collector', tier:'II', short:'125 kana seen', detail:'Practise at least 125 unique kana across the trainer.', target:125, key:'seen'},
      {name:'Kana Collector', tier:'III', short:'175 kana seen', detail:'Practise 175 unique kana, covering most of the app’s kana set.', target:175, key:'seen'},
      {name:'Speed Goal', tier:'I', short:'25 under 2.0s', detail:'Build timing history until 25 kana average under 2.0 seconds.', target:25, key:'under2'},
      {name:'Speed Goal', tier:'II', short:'50 under 2.0s', detail:'Reach the 2.0 second recognition goal on 50 kana.', target:50, key:'under2'},
      {name:'Speed Goal', tier:'III', short:'100 under 2.0s', detail:'Reach the 2.0 second recognition goal on 100 kana.', target:100, key:'under2'},
      {name:'Fluent Target', tier:'I', short:'10 under 1.0s', detail:'Build timing history until 10 kana average under 1.0 second.', target:10, key:'under1'},
      {name:'Fluent Target', tier:'II', short:'25 under 1.0s', detail:'Reach fluent-speed timing on 25 kana. This is the second tier after the first fluent target.', target:25, key:'under1'},
      {name:'Fluent Target', tier:'III', short:'50 under 1.0s', detail:'Reach fluent-speed timing on 50 kana. This is a strong recognition milestone.', target:50, key:'under1'},
      {name:'Mastery Path', tier:'I', short:'20 mastered', detail:'Reach Mastered on 20 kana. Mastered combines attempts, accuracy, and speed.', target:20, key:'mastered'},
      {name:'Mastery Path', tier:'II', short:'50 mastered', detail:'Reach Mastered on 50 kana.', target:50, key:'mastered'},
      {name:'Mastery Path', tier:'III', short:'100 mastered', detail:'Reach Mastered on 100 kana.', target:100, key:'mastered'},
      {name:'Test Taker', tier:'I', short:'1 formal test', detail:'Complete your first formal Kana Trainer test.', target:1, key:'resultCount'},
      {name:'Test Taker', tier:'II', short:'10 formal tests', detail:'Complete 10 formal Kana Trainer tests.', target:10, key:'resultCount'},
      {name:'Perfect Form', tier:'I', short:'1 perfect test', detail:'Complete a formal test with no mistakes.', target:1, key:'perfect'},
      {name:'Perfect Form', tier:'II', short:'5 perfect tests', detail:'Complete five formal tests with no mistakes.', target:5, key:'perfect'}
    ],
    wordbank: [
      {name:'First Saved Word', tier:'I', short:'1 word', detail:'Save your first word in Word Bank.', target:1, key:'wordCount'},
      {name:'Word Stash', tier:'I', short:'25 words', detail:'Save 25 words in Word Bank.', target:25, key:'wordCount'},
      {name:'Word Stash', tier:'II', short:'100 words', detail:'Save 100 words in Word Bank.', target:100, key:'wordCount'},
      {name:'Word Archive', tier:'I', short:'250 words', detail:'Save 250 words in Word Bank.', target:250, key:'wordCount'},
      {name:'Word Archive', tier:'II', short:'500 words', detail:'Save 500 words in Word Bank.', target:500, key:'wordCount'}
    ]
  };
  function valueFor(s,key){ return Number(s[key]||0); }
  function achievementVisual(item,branch){
    const name=String(item&&item.name||'').toLowerCase();
    const out={
      branchLabel: branch==='kana' ? 'Kana Trainer' : branch==='wordbank' ? 'Word Bank' : 'General',
      accent: branch==='kana' ? '80,220,155' : branch==='wordbank' ? '96,165,250' : '245,195,93',
      icon: branch==='kana' ? 'あ' : branch==='wordbank' ? '語' : '✦'
    };
    if(branch==='general'){
      if(name.includes('rhythm')) out.icon='◎';
      else if(name.includes('cloud')) out.icon='☁';
      else if(name.includes('safety')) out.icon='⟲';
      else if(name.includes('first')) out.icon='✦';
    }
    if(branch==='kana'){
      if(name.includes('collector')) out.icon='カ';
      else if(name.includes('speed')) out.icon='速';
      else if(name.includes('fluent')) out.icon='流';
      else if(name.includes('mastery')) out.icon='達';
      else if(name.includes('test')) out.icon='試';
      else if(name.includes('perfect')) out.icon='✓';
    }
    if(branch==='wordbank'){
      if(name.includes('first')) out.icon='初';
      else if(name.includes('stash')) out.icon='帳';
      else if(name.includes('archive')) out.icon='保';
    }
    return out;
  }
  function achievement(item,s,branch,index){
    const value=valueFor(s,item.key), done=value>=item.target, pct=clamp(item.target ? value/item.target*100 : 0);
    const id=branch+'-'+index;
    const visual=achievementVisual(item,branch);
    ACH_INDEX[id]={...item, ...visual, value, pct, done, branch};
    return `<button type="button" class="ma-achievement-tile branch-${esc(branch)} ${done?'done':''}" style="--ma-ach-accent:${visual.accent};" data-ma-ach-id="${esc(id)}" aria-label="${esc(item.name+' '+item.tier)} achievement details">
      <div class="ma-ach-topline"><span class="ma-ach-status-text">${done?'Unlocked':pct+'%'}</span></div>
      <span class="ma-ach-graphic" aria-hidden="true">${esc(visual.icon)}</span>
      <strong>${esc(item.name)}</strong>
      <em>${esc(item.tier)}</em>
      <small>${esc(item.short)}</small>
      <div class="ma-ach-meter" aria-hidden="true"><span class="ma-ach-meter-fill" style="width:${pct}%"></span><span class="ma-ach-meter-label">${pct}%</span></div>
    </button>`;
  }
  function branchSection(title,key,s){
    const list=DEFINITIONS[key]||[];
    const unlocked=list.filter(item=>valueFor(s,item.key)>=item.target).length;
    return `<section class="ma-achievement-section"><div class="ma-ach-section-head"><h3>${esc(title)}</h3><span>${unlocked}/${list.length} unlocked</span></div><div class="ma-achievement-grid">${list.map((x,i)=>achievement(x,s,key,i)).join('')}</div></section>`;
  }
  function currentUnlockedAchievements(){
    const s=countStats();
    const out=[];
    Object.keys(DEFINITIONS).forEach(branch=>{
      (DEFINITIONS[branch]||[]).forEach((item,index)=>{
        if(valueFor(s,item.key)>=item.target){
          out.push({id:branch+'-'+index, branch, index, name:item.name, tier:item.tier});
        }
      });
    });
    return out;
  }
  function getSeenAchievementSet(){
    try { return new Set(JSON.parse(localStorage.getItem('modeAtlasSeenAchievementUnlocks')||'[]')); }
    catch(e){ return new Set(); }
  }
  function saveSeenAchievementSet(set){
    try { localStorage.setItem('modeAtlasSeenAchievementUnlocks', JSON.stringify([...set])); } catch(e){}
  }
  function achievementToast(message){
    try { if(window.ModeAtlas && typeof window.ModeAtlas.toast==='function') return window.ModeAtlas.toast(message,'ok',4200); } catch(e){}
    let wrap=document.querySelector('.ma-toast-wrap');
    if(!wrap){ wrap=document.createElement('div'); wrap.className='ma-toast-wrap'; document.body.appendChild(wrap); }
    const node=document.createElement('div'); node.className='ma-toast ok'; node.textContent=message; wrap.appendChild(node);
    setTimeout(()=>{ node.style.opacity='0'; node.style.transform='translateY(-6px)'; setTimeout(()=>node.remove(),350); },4200);
  }
  function checkAchievementUnlocks({silent=false}={}){
    const unlocked=currentUnlockedAchievements();
    let seen=getSeenAchievementSet();
    if(!localStorage.getItem('modeAtlasAchievementBaselineSet')){
      unlocked.forEach(a=>seen.add(a.id));
      saveSeenAchievementSet(seen);
      try { localStorage.setItem('modeAtlasAchievementBaselineSet','1'); } catch(e){}
      return [];
    }
    const fresh=unlocked.filter(a=>!seen.has(a.id));
    if(fresh.length){
      fresh.forEach(a=>seen.add(a.id));
      saveSeenAchievementSet(seen);
      if(!silent){
        const first=fresh[0];
        const suffix=fresh.length>1 ? ` +${fresh.length-1} more` : '';
        achievementToast(`Achievement unlocked: ${first.name} ${first.tier}${suffix}`);
      }
    }
    return fresh;
  }
  function startAchievementWatcher(){
    if(window.__maAchievementWatcherStarted) return;
    window.__maAchievementWatcherStarted=true;
    checkAchievementUnlocks({silent:true});
    setInterval(()=>checkAchievementUnlocks(),2500);
    window.addEventListener('storage',e=>{
      if(e && e.key && /charStats|reverseCharStats|charTimes|testModeResults|kanaWordBank|modeAtlasLastCloudSyncAt|modeAtlasLastExportAt|modeAtlasLastBackupAt/.test(e.key)) checkAchievementUnlocks();
    });
    document.addEventListener('ma:progress-updated',()=>checkAchievementUnlocks());
  }
  function renderAchievements(){
    const s=countStats(); ACH_INDEX={};
    const totalDefs=[...DEFINITIONS.general,...DEFINITIONS.kana,...DEFINITIONS.wordbank];
    const unlocked=totalDefs.filter(item=>valueFor(s,item.key)>=item.target).length;
    return `<div class="ma-modal-head"><div><h2>Achievements</h2><p>Milestones across Mode Atlas. Select a tile to see the full unlock requirement.</p></div><button type="button" data-ma-modal-close>Close</button></div>
    <div class="ma-ach-overview"><div><b>${unlocked}</b><span>Unlocked</span></div><div><b>${totalDefs.length}</b><span>Total</span></div><div><b>${clamp(unlocked/Math.max(1,totalDefs.length)*100)}%</b><span>Complete</span></div></div>
    <div class="ma-achievement-layout">${branchSection('General','general',s)}${branchSection('Kana Trainer','kana',s)}${branchSection('Word Bank','wordbank',s)}</div>`;
  }
  function openAchievementInfo(id){
    const item=ACH_INDEX[id]; if(!item) return;
    let pop=document.getElementById('maAchievementInfo');
    if(!pop){
      pop=document.createElement('div'); pop.id='maAchievementInfo'; pop.className='ma-ach-info';
      pop.innerHTML='<div class="ma-ach-info-backdrop" data-ma-ach-info-close></div><div class="ma-ach-info-panel" role="dialog" aria-modal="true"><button type="button" class="ma-ach-info-close" data-ma-ach-info-close>Close</button><div class="ma-ach-info-body"></div></div>';
      document.body.appendChild(pop);
      pop.addEventListener('click',e=>{ if(e.target.closest('[data-ma-ach-info-close]')) pop.classList.remove('open'); });
    }
    pop.querySelector('.ma-ach-info-body').innerHTML=`<div class="ma-ach-info-topbar"><div class="ma-ach-info-hero branch-${esc(item.branch)} ${item.done?'done':''}" style="--ma-ach-accent:${item.accent||'96,165,250'};"><span class="ma-ach-info-symbol" aria-hidden="true">${esc(item.icon||'✦')}</span><div><span class="ma-ach-info-kicker">${esc(item.branchLabel||item.branch.replace(/^./,c=>c.toUpperCase()))}</span><h3>${esc(item.name)} <em>${esc(item.tier)}</em></h3></div></div><button type="button" class="ma-ach-info-close-inline" data-ma-ach-info-close>Close</button></div><p class="ma-ach-info-copy">${esc(item.detail)}</p><div class="ma-ach-info-progress"><div class="ma-ach-info-progress-row"><strong>${item.done?'Unlocked':'In progress'}</strong><span>${Math.min(item.value,item.target)} / ${item.target}</span></div><i><b style="width:${item.pct}%"></b></i></div>`;
    pop.classList.add('open');
  }
  function masteryLabel(ch){
    const r=readJSON('charStats',{}), w=readJSON('reverseCharStats',{}), times=readJSON('charTimes',{});
    const rs=(r&&r[ch])||{}, ws=(w&&w[ch])||{}; const c=(+rs.correct||0)+(+ws.correct||0), x=(+rs.wrong||0)+(+ws.wrong||0); const total=c+x; const raw=(times&&times[ch]&&times[ch].avg)||0; const avg=raw>30?raw/1000:raw;
    if(total===0) return {label:'New', cls:'new', detail:'Not practised yet'};
    if(c>=20 && c/Math.max(1,total)>=0.9 && (!avg || avg<=2)) return {label:'Mastered', cls:'mastered', detail:`${c}/${total} correct${avg?' · '+avg.toFixed(1)+'s':''}`};
    if(total>=8 && c/Math.max(1,total)>=0.7) return {label:'Reviewing', cls:'reviewing', detail:`${c}/${total} correct${avg?' · '+avg.toFixed(1)+'s':''}`};
    return {label:'Learning', cls:'learning', detail:`${c}/${total} correct${avg?' · '+avg.toFixed(1)+'s':''}`};
  }
  function grid(title, chars){
    return `<section class="ma-mastery-group"><h3>${esc(title)}</h3><div class="ma-mastery-grid">${chars.map(ch=>{const m=masteryLabel(ch); return `<button type="button" class="ma-mastery-cell ${m.cls}" title="${esc(ch)} · ${esc(m.label)} · ${esc(m.detail)}"><strong>${esc(ch)}</strong><span>${esc(m.label)}</span></button>`;}).join('')}</div></section>`;
  }
  function renderMasteryMap(){
    const s=countStats();
    return `<div class="ma-modal-head"><div><h2>Mastery Map</h2><p>A full kana grid showing accuracy, repetition, and speed progress.</p></div><button type="button" data-ma-modal-close>Close</button></div>
    <div class="ma-mastery-legend">
      <div><b>New</b><span>You have not practised this kana yet.</span></div>
      <div><b>Learning</b><span>You have started it, but accuracy or attempts are still low.</span></div>
      <div><b>Reviewing</b><span>You are mostly correct, but it needs more reliable reps before mastery.</span></div>
      <div><b>Mastered</b><span>20+ correct, 90%+ accuracy, and around the 2.0s recognition goal.</span></div>
    </div>
    <div class="ma-mastery-summary"><span><b>${s.mastered}</b> mastered</span><span><b>${s.reviewing}</b> reviewing</span><span><b>${s.learning}</b> learning</span><span><b>${s.under2}</b> under 2.0s</span><span><b>${s.under1}</b> under 1.0s</span></div>
    ${grid('Hiragana',HIRA)}${grid('Katakana',KATA)}${grid('Dakuten',DAK)}${grid('Yōon',YOON)}${grid('Extended Katakana',EXT)}`;
  }
  function openModal(kind){
    let shell=document.getElementById('maFeatureModal');
    if(!shell){
      shell=document.createElement('div'); shell.id='maFeatureModal'; shell.className='ma-feature-modal';
      shell.innerHTML='<div class="ma-feature-backdrop" data-ma-modal-close></div><div class="ma-feature-panel" role="dialog" aria-modal="true"><div class="ma-feature-content"></div></div>';
      document.body.appendChild(shell);
      shell.addEventListener('click',e=>{
        if(e.target.closest('[data-ma-modal-close]')) closeModal();
        const ach=e.target.closest('[data-ma-ach-id]');
        if(ach){ e.preventDefault(); openAchievementInfo(ach.getAttribute('data-ma-ach-id')); }
      });
      document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ closeModal(); const p=document.getElementById('maAchievementInfo'); if(p) p.classList.remove('open'); }});
    }
    shell.querySelector('.ma-feature-content').innerHTML = kind==='mastery' ? renderMasteryMap() : renderAchievements();
    shell.classList.add('open');
  }
  function closeModal(){ const shell=document.getElementById('maFeatureModal'); if(shell) shell.classList.remove('open'); const p=document.getElementById('maAchievementInfo'); if(p) p.classList.remove('open'); }
  function cleanProfileButtons(){
    document.querySelectorAll('.profile-drawer,#profileDrawer').forEach(drawer=>{
      const buttons=[...drawer.querySelectorAll('[data-ma-achievements-open]')];
      if(!buttons.length) return;
      const appButtons=buttons.filter(btn=>btn.closest('.ma-tools-panel'));
      const keep=appButtons[0] || buttons[0];
      buttons.forEach(btn=>{ if(btn!==keep) btn.remove(); });
      if(keep && !keep.closest('.ma-tools-panel')){
        const appGrid=drawer.querySelector('.ma-tools-panel .ma-qol-grid');
        if(appGrid) appGrid.appendChild(keep);
      }
    });
  }
  function injectMasteryButton(){
    document.querySelectorAll('[data-ma-mastery-open]').forEach(btn=>{ if((window.ModeAtlasPageName ? window.ModeAtlasPageName() : (location.pathname.split('/').pop() || 'index.html')).toLowerCase()!=='kana.html') btn.remove(); });
    const page=(window.ModeAtlasPageName ? window.ModeAtlasPageName() : (location.pathname.split('/').pop() || 'index.html')).toLowerCase();
    if(page!=='kana.html') return;
    if(document.querySelector('[data-ma-mastery-open]')) return;
    const panel=document.getElementById('maSpeedMasteryPanel');
    if(!panel) return;
    const head=panel.querySelector('.ma-kana-pro-head') || panel;
    const btn=document.createElement('button'); btn.type='button'; btn.className='ma-mastery-open-btn'; btn.dataset.maMasteryOpen='1'; btn.textContent='Open Mastery Map'; btn.addEventListener('click',()=>openModal('mastery'));
    head.appendChild(btn);
  }
  function init(){ cleanProfileButtons(); injectMasteryButton(); startAchievementWatcher(); if(!window.__maFeatureClickBound){ window.__maFeatureClickBound=true; document.addEventListener('click',e=>{ if(e.target.closest('[data-ma-achievements-open]')) openModal('achievements'); if(e.target.closest('[data-ma-mastery-open]')) openModal('mastery'); }); } }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
  setTimeout(init,800); setTimeout(init,2000);
  window.ModeAtlasFeatures={openAchievements:()=>openModal('achievements'), openMasteryMap:()=>openModal('mastery'), checkAchievements:()=>checkAchievementUnlocks(), version:VERSION};
})();

/* === mode-atlas-late-auth.js === */
/* Shared late auth runtime. */
(function ModeAtlasAuthMobileFix(){
  // Deprecated: replaced by mode-atlas-auth-single-button.js.
  // Intentionally left as a no-op so old HTML script tags cannot create duplicate auth controls or mutation loops.
  window.__modeAtlasAuthMobileFixLoaded = true;
})();
(function ModeAtlasSingleAuthButton(){
  if (window.__modeAtlasSingleAuthButtonLoaded) return;
  window.__modeAtlasSingleAuthButtonLoaded = true;

  const SIGN_IN_SELECTORS = '#profileSignInBtn,#studyProfileSignIn,#identitySignInBtn,[data-profile-sign-in],[data-ma-sign-in]';
  const SIGN_OUT_SELECTORS = '#profileSignOutBtn,#studyProfileSignOut,#identitySignOutBtn,[data-profile-sign-out],[data-ma-sign-out]';
  const DRAWER_SELECTORS = '.profile-drawer,#profileDrawer,.profile-overlay,.drawer-panel,.profile-modal,.profile-menu,.ma-profile-drawer';

  function all(sel, root){ return Array.from((root || document).querySelectorAll(sel)); }
  function getUser(){ try { return window.KanaCloudSync && typeof window.KanaCloudSync.getUser === 'function' ? window.KanaCloudSync.getUser() : null; } catch { return null; } }
  function signedIn(){ return !!getUser(); }
  function text(el){ return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function isAuthText(el){ return /^(sign in(?: with google)?|log in|login|sign out|logout|log out)$/i.test(text(el)); }
  function findAuthButtons(root){
    const set = new Set();
    all(`${SIGN_IN_SELECTORS},${SIGN_OUT_SELECTORS},[data-ma-auth-main]`, root).forEach(el => set.add(el));
    all('button,a', root).filter(isAuthText).forEach(el => set.add(el));
    return Array.from(set);
  }
  function hide(el){
    if (!el) return;
    el.hidden = true;
    el.disabled = true;
    el.setAttribute('aria-hidden','true');
    el.setAttribute('tabindex','-1');
    el.style.setProperty('display','none','important');
    el.classList.add('ma-auth-removed');
    el.removeAttribute('data-ma-auth-main');
  }
  function showMain(btn){
    if (!btn) return;
    const isIn = signedIn();
    btn.hidden = false;
    btn.disabled = false;
    btn.removeAttribute('aria-hidden');
    btn.removeAttribute('tabindex');
    btn.style.setProperty('display','inline-flex','important');
    btn.classList.remove('ma-auth-removed');
    btn.setAttribute('data-ma-auth-main','');
    btn.removeAttribute('data-profile-sign-in');
    btn.removeAttribute('data-profile-sign-out');
    btn.removeAttribute('data-ma-sign-in');
    btn.removeAttribute('data-ma-sign-out');
    btn.textContent = isIn ? 'Sign out' : 'Sign in';
    btn.classList.toggle('primary', !isIn);
  }
  function chooseMain(root, buttons){
    const existing = buttons.find(el => el.hasAttribute('data-ma-auth-main') && !el.classList.contains('ma-auth-removed'));
    if (existing) return existing;
    const signIn = buttons.find(el => /^(sign in(?: with google)?|log in|login)$/i.test(text(el)) && !el.classList.contains('ma-auth-removed'));
    if (signIn) return signIn;
    return buttons.find(el => !el.classList.contains('ma-auth-removed')) || null;
  }
  function syncOne(root){
    const buttons = findAuthButtons(root);
    if (!buttons.length) return;
    const main = chooseMain(root, buttons);
    buttons.forEach(el => { if (el !== main) hide(el); });
    showMain(main);
  }
  function sync(){
    const roots = all(DRAWER_SELECTORS).filter(Boolean);
    if (roots.length) roots.forEach(root => syncOne(root)); else syncOne(document);
    try {
      const user = getUser();
      const display = user && (user.displayName || (user.email || '').split('@')[0]);
      if (display) all('#profileName,#drawerName,#studyProfileName,#identityName').forEach(el => { el.textContent = display; });
      if (user && user.email) all('#profileEmail,#drawerEmail,#studyProfileEmail,#identityEmail').forEach(el => { el.textContent = user.email; });
    } catch {}
  }
  async function runAuthAction(){
    const cloud = window.KanaCloudSync;
    if (!cloud) return;
    try {
      if (signedIn()) await cloud.signOut?.();
      else await cloud.signInWithGoogle?.();
    } finally {
      setTimeout(sync, 80);
      setTimeout(sync, 600);
    }
  }
  document.addEventListener('click', function(e){
    const btn = e.target && e.target.closest && e.target.closest('[data-ma-auth-main]');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation(); if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    runAuthAction();
  }, true);
  window.ModeAtlas = window.ModeAtlas || {};
  window.ModeAtlas.syncSingleAuthButton = sync;
  function boot(){
    sync();
    [100, 400, 1000, 2200].forEach(t => setTimeout(sync, t));
    setInterval(sync, 2500);
    window.addEventListener('kanaCloudSyncStatusChanged', sync);
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    try {
      const mo = new MutationObserver(function(){
        if (window.__maAuthSyncQueued) return;
        window.__maAuthSyncQueued = true;
        setTimeout(function(){ window.__maAuthSyncQueued = false; sync(); }, 120);
      });
      mo.observe(document.body || document.documentElement, { childList:true, subtree:true });
    } catch {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true }); else boot();
})();
