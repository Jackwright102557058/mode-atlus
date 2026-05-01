(function ModeAtlasKeepModifiersOpenRepair(){
  function install(){
    const drawer = document.getElementById('modifiersContent');
    const tab = document.getElementById('modifiersTab');
    if (!drawer || drawer.dataset.maKeepOpenRepair) return;
    drawer.dataset.maKeepOpenRepair = 'true';
    ['click','pointerdown','touchstart','mousedown'].forEach(type => {
      drawer.addEventListener(type, event => { event.stopPropagation(); }, true);
    });
    drawer.addEventListener('click', () => {
      const keep = () => {
        try { settings.activeBottomTab = 'modifiers'; } catch {}
        drawer.classList.add('open');
        if (tab) { tab.classList.add('active'); tab.textContent = 'Modifiers ▲'; }
      };
      setTimeout(keep, 0);
      setTimeout(keep, 80);
      setTimeout(keep, 180);
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
  setTimeout(install, 300);
})();
