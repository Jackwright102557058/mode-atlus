(function ModeAtlasModifierDirectClickRepair(){
  function install(){
    var drawer = document.getElementById('modifiersContent');
    if (!drawer || drawer.dataset.maDirectClickRepair) return;
    drawer.dataset.maDirectClickRepair = 'true';

    var modeLabels = {
      'Hint Mode':'hint',
      'SRS Mode':'srs',
      'Endless Mode':'endless',
      'Time Trial Mode':'timeTrial',
      'Daily Challenge':'dailyChallenge',
      'Test Mode':'testMode',
      'Combo Kana Mode':'comboKana',
      'Focus Weak':'focusWeak',
      'Dakuten':'dakuten',
      'Yōon':'yoon',
      'Yoon':'yoon',
      'Extended Katakana':'extendedKatakana'
    };

    function safeCall(name){
      try {
        if (typeof window[name] === 'function') window[name]();
        else if (typeof eval(name) === 'function') eval(name)();
      } catch (err) { console.warn('Mode Atlas modifier repair: failed ' + name, err); }
    }

    function rerender(){
      try { if (typeof onSettingsChanged === 'function') onSettingsChanged(); return; } catch (err) {}
      safeCall('onSettingsChanged');
    }

    function isLocked(){
      try { return !!sessionStarted; } catch (err) { return false; }
    }

    function toggleMode(key){
      if (!key || typeof settings !== 'object') return false;
      if (key === 'timeTrial') {
        settings.timeTrial = !settings.timeTrial;
        if (settings.timeTrial) { settings.endless = false; settings.dailyChallenge = false; settings.testMode = false; }
      } else if (key === 'endless') {
        settings.endless = !settings.endless;
        if (settings.endless) { settings.timeTrial = false; settings.dailyChallenge = false; settings.testMode = false; }
      } else if (key === 'dailyChallenge') {
        settings.dailyChallenge = !settings.dailyChallenge;
        if (settings.dailyChallenge) { settings.timeTrial = false; settings.endless = false; settings.testMode = false; settings.comboKana = false; settings.hint = false; }
      } else if (key === 'testMode') {
        settings.testMode = !settings.testMode;
        if (settings.testMode) { settings.timeTrial = false; settings.endless = false; settings.dailyChallenge = false; settings.comboKana = false; settings.hint = false; }
      } else if (key === 'comboKana') {
        settings.comboKana = !settings.comboKana;
        if (settings.comboKana) { settings.dailyChallenge = false; settings.testMode = false; }
      } else {
        settings[key] = !settings[key];
      }
      return true;
    }

    function toggleRow(container, label){
      if (typeof settings !== 'object') return false;
      var key = '';
      var arrName = '';
      if (container && container.id === 'rowOptions') { key = 'h_' + label; arrName = 'hiraganaRows'; }
      else if (container && container.id === 'katakanaRowOptions') { key = 'k_' + label; arrName = 'katakanaRows'; }
      else return false;
      if (!Array.isArray(settings[arrName])) settings[arrName] = [];
      if (settings[arrName].includes(key)) settings[arrName] = settings[arrName].filter(function(x){ return x !== key; });
      else settings[arrName] = settings[arrName].concat(key);
      return true;
    }

    function handleInputButton(btn){
      if (typeof settings !== 'object') return false;
      if (isLocked()) return true;
      if (btn.id === 'buttonsModeBtn') { settings.keyboardMode = false; return true; }
      if (btn.id === 'keyboardModeBtn') { settings.keyboardMode = true; if (!['romaji','kana'].includes(settings.keyboardInputType)) settings.keyboardInputType = 'kana'; return true; }
      if (btn.id === 'choice4Btn') { if (settings.keyboardMode) settings.keyboardInputType = 'romaji'; else settings.choiceCount = 4; return true; }
      if (btn.id === 'choice6Btn') { if (settings.keyboardMode) settings.keyboardInputType = 'kana'; else settings.choiceCount = 6; return true; }
      if (btn.id === 'choice8Btn') { if (!settings.keyboardMode) settings.choiceCount = 8; return true; }
      return false;
    }

    drawer.addEventListener('click', function(event){
      var target = event.target;
      var btn = target && target.closest ? target.closest('.toggle-btn, .btn') : null;
      if (!btn || !drawer.contains(btn)) return;
      if (btn.classList.contains('disabled') || btn.disabled) {
        event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
        return;
      }

      var handled = false;
      var text = (btn.textContent || '').trim();
      var container = btn.parentElement;
      while (container && container !== drawer && !['modifierOptions','rowOptions','katakanaRowOptions'].includes(container.id)) container = container.parentElement;

      if (btn.classList.contains('toggle-btn')) {
        if (container && container.id === 'modifierOptions') handled = toggleMode(modeLabels[text]);
        else handled = toggleRow(container, text);
      } else if (btn.classList.contains('btn')) {
        handled = handleInputButton(btn);
      }

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        try { settings.activeBottomTab = 'modifiers'; } catch (err) {}
        rerender();
      }
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
  setTimeout(install, 250);
  setTimeout(install, 1000);
})();
