(function(){
  if(window.__modeAtlasVerifiedPresetConfusableFix) return;
  window.__modeAtlasVerifiedPresetConfusableFix=true;
  var page=(window.ModeAtlasPageName ? window.ModeAtlasPageName() : (location.pathname.split('/').pop() || 'index.html')).toLowerCase();
  var isTrainer=page==='default.html'||page==='reverse.html';
  var settingsKey=page==='reverse.html'?'reverseSettings':'settings';
  var confKey='modeAtlasConfusableMode';
  var presetKey='modeAtlasActivePreset';
  var hiraRows=['h_a','h_ka','h_sa','h_ta','h_na','h_ha','h_ma','h_ya','h_ra','h_wa'];
  var kataRows=['k_a','k_ka','k_sa','k_ta','k_na','k_ha','k_ma','k_ya','k_ra','k_wa'];
  var PRESETS={
    starter:{label:'Starter',desc:'A-row with hints',hint:true,dakuten:false,yoon:false,extendedKatakana:false,hiraganaRows:['h_a'],katakanaRows:[]},
    intermediate:{label:'Intermediate',desc:'All Hiragana, no hints',hint:false,dakuten:false,yoon:false,extendedKatakana:false,hiraganaRows:hiraRows.slice(),katakanaRows:[]},
    advanced:{label:'Advanced',desc:'Hiragana + Katakana + Dakuten',hint:false,dakuten:true,yoon:false,extendedKatakana:false,hiraganaRows:hiraRows.slice(),katakanaRows:kataRows.slice()},
    pro:{label:'Pro',desc:'Everything enabled',hint:false,dakuten:true,yoon:true,extendedKatakana:true,hiraganaRows:hiraRows.slice(),katakanaRows:kataRows.slice()}
  };
  function $(s,r){return (r||document).querySelector(s)}
  function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function read(key, fallback){return window.ModeAtlasStorage.json(key, fallback)}
  function save(obj){window.ModeAtlasStorage.setJSON(settingsKey,obj);window.ModeAtlasStorage.now('settingsUpdatedAt')}
  function toast(msg){try{ if(window.ModeAtlas&&window.ModeAtlas.toast){window.ModeAtlas.toast(msg);return;} }catch(e){} }
  function getCurrent(){var obj=read(settingsKey,{}); try{ if(typeof window.settings==='object'&&window.settings) obj=Object.assign({},obj,window.settings); }catch(e){} return obj||{};}
  function hardRefreshUi(){
    try{ if(typeof window.rebuildCharMap==='function') window.rebuildCharMap(); }catch(e){}
    try{ if(typeof window.buildRows==='function' && window.hiraganaRows && window.katakanaRows){ window.buildRows('rowOptions',window.hiraganaRows,'hiraganaRows','h_'); window.buildRows('katakanaRowOptions',window.katakanaRows,'katakanaRows','k_'); } }catch(e){}
    try{ if(typeof window.renderHeatmap==='function') window.renderHeatmap(); }catch(e){}
    try{ if(typeof window.updateTopStats==='function') window.updateTopStats(); }catch(e){}
    try{ if(typeof window.updateTrialConfigVisibility==='function') window.updateTrialConfigVisibility(); }catch(e){}
    try{ if(typeof window.saveAll==='function') window.saveAll(); }catch(e){}
    markActive();
  }
  function applyPreset(id){
    id=String(id||'').toLowerCase(); var p=PRESETS[id]; if(!p) return false;
    var next=Object.assign({},getCurrent(),{
      focusWeak:false,srs:true,endless:false,timeTrial:false,dailyChallenge:false,testMode:false,comboKana:false,confusableKana:false,
      mobileMode:false,statsVisible:true,scoresVisible:true,activeBottomTab:'modifiers',optionsOpen:false
    },p);
    try{ if(typeof window.settings==='object'&&window.settings) Object.assign(window.settings,next); }catch(e){}
    save(next);
    window.ModeAtlasStorage.set(presetKey,id);window.ModeAtlasStorage.remove(confKey)
    try{ if(window.KanaCloudSync&&window.KanaCloudSync.markSectionUpdated) window.KanaCloudSync.markSectionUpdated(page==='reverse.html'?'writing':'reading'); }catch(e){}
    removeNotice(); hardRefreshUi(); setTimeout(install,20); setTimeout(markActive,80);
    toast(p.label+' preset applied'); return true;
  }
  function setConfusable(force){
    var now=window.ModeAtlasStorage.get(confKey, '')==='1'; var on=(typeof force==='boolean')?force:!now;
    var next=Object.assign({},getCurrent(),{
      hint:false,focusWeak:false,srs:true,endless:false,timeTrial:false,dailyChallenge:false,testMode:false,comboKana:false,confusableKana:on,
      dakuten:false,yoon:false,extendedKatakana:false,hiraganaRows:hiraRows.slice(),katakanaRows:kataRows.slice(),activeBottomTab:'modifiers',optionsOpen:false
    });
    try{ if(typeof window.settings==='object'&&window.settings) Object.assign(window.settings,next); }catch(e){}
    save(next);
    if(on){window.ModeAtlasStorage.set(confKey,'1');window.ModeAtlasStorage.remove(presetKey);} else {window.ModeAtlasStorage.remove(confKey);removeNotice();}
    hardRefreshUi(); if(on) addNotice(); setTimeout(install,20); setTimeout(markActive,80);
    toast(on?'Confusable Kana drill turned on':'Confusable Kana drill turned off'); return true;
  }
  window.ModeAtlas=window.ModeAtlas||{};
  window.ModeAtlas.applyPracticePreset=applyPreset;
  window.ModeAtlas.enableConfusableKana=setConfusable;
  function removeNotice(){ $$('#maConfusableNotice').forEach(function(n){n.remove()}); }
  function addNotice(){
    if(!isTrainer || $('#maConfusableNotice') || window.ModeAtlasStorage.get(confKey, '')!=='1') return;
    var n=document.createElement('div'); n.id='maConfusableNotice'; n.className='ma-confusable-notice';
    n.innerHTML='<b>Confusable Kana drill</b><span>シ/ツ · ソ/ン · ぬ/め · れ/わ/ね · ク/ケ/タ · ナ/メ</span><button type="button" data-confusable-off-final>Clear</button>';
    var target=$('.bottom-shell.ma-modifiers-only')||$('#modifiersContent')||document.body;
    target.parentNode.insertBefore(n,target);
  }
  function installPresetPanel(){
    var content=$('#modifiersContent'); if(!content) return;
    $$('#maPresetMenu').forEach(function(x){x.remove()});
    var panel=$('#maPresetMenuFinal');
    if(!panel){
      panel=document.createElement('div'); panel.id='maPresetMenuFinal'; panel.className='ma-preset-menu final-control';
      panel.innerHTML='<div class="section-title">Practice presets</div><div class="ma-preset-grid">'+Object.keys(PRESETS).map(function(id){var p=PRESETS[id];return '<button type="button" class="ma-preset-btn" data-ma-final-preset="'+id+'"><span>'+p.label+'</span><small>'+p.desc+'</small></button>';}).join('')+'</div>';
      var stack=$('.options-stack',content)||content; stack.insertBefore(panel,stack.firstChild);
    }
  }
  function installConfusableButton(){
    var container=$('#modifierOptions'); if(!container) return;
    $$('.ma-confusable-toggle,[data-confusable-start]',container).forEach(function(x){x.remove()});
    var btn=$('[data-ma-confusable-final]',container);
    if(!btn){
      btn=document.createElement('div'); btn.className='toggle-btn ma-confusable-final'; btn.setAttribute('role','button'); btn.setAttribute('tabindex','0'); btn.setAttribute('data-ma-confusable-final','1'); btn.textContent='Confusable Kana';
      container.appendChild(btn);
    }
  }
  function markActive(){
    var active=window.ModeAtlasStorage.get(presetKey, '')||''; var conf=window.ModeAtlasStorage.get(confKey, '')==='1';
    $$('[data-ma-final-preset]').forEach(function(btn){var on=!conf && btn.getAttribute('data-ma-final-preset')===active; btn.classList.toggle('active',on); btn.setAttribute('aria-pressed',on?'true':'false');});
    $$('[data-ma-confusable-final]').forEach(function(btn){btn.classList.toggle('active',conf);btn.setAttribute('aria-pressed',conf?'true':'false');});
  }
  function install(){ if(!isTrainer) return; installPresetPanel(); installConfusableButton(); if(new URLSearchParams(location.search).get('confusable')==='1') window.ModeAtlasStorage.set(confKey,'1'); if(window.ModeAtlasStorage.get(confKey, '')==='1') addNotice(); markActive(); }
  document.addEventListener('click',function(e){
    var p=e.target.closest&&e.target.closest('[data-ma-final-preset]'); if(p){e.preventDefault();e.stopPropagation();applyPreset(p.getAttribute('data-ma-final-preset'));return;}
    var c=e.target.closest&&e.target.closest('[data-ma-confusable-final]'); if(c){e.preventDefault();e.stopPropagation();setConfusable();return;}
    if(e.target.closest&&e.target.closest('[data-confusable-off-final]')){e.preventDefault();window.ModeAtlasStorage.remove(confKey);var next=getCurrent();next.confusableKana=false;try{if(typeof window.settings==='object'&&window.settings)window.settings.confusableKana=false}catch(x){}save(next);removeNotice();hardRefreshUi();setTimeout(install,20);}
  },true);
  document.addEventListener('keydown',function(e){var c=e.target.closest&&e.target.closest('[data-ma-confusable-final]'); if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();setConfusable();}},true);
  if(isTrainer){
    var old=window.buildModifierButtons;
    if(typeof old==='function' && !old.__maFinalWrapped){
      var wrapped=function(){var r=old.apply(this,arguments); setTimeout(install,0); return r;}; wrapped.__maFinalWrapped=true; window.buildModifierButtons=wrapped;
    }
  }
  if(page==='kana.html'){
    $$('a[href*="confusable=1"],[data-ma-confusable-link]').forEach(function(a){a.setAttribute('href','/reading/?confusable=1');a.addEventListener('click',function(){window.ModeAtlasStorage.set(confKey,'1');window.ModeAtlasStorage.remove(presetKey)},true)});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
  window.addEventListener('pageshow',function(){setTimeout(install,50)});
  setTimeout(install,250); setTimeout(install,900); setTimeout(install,1800); setInterval(function(){ if(isTrainer) { installConfusableButton(); markActive(); } },1500);
})();
