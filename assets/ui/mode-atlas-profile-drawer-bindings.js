(function ModeAtlasProfileDrawerBindings(){
  if (window.__modeAtlasProfileDrawerBindingsInstalled) return;
  window.__modeAtlasProfileDrawerBindingsInstalled = true;

  function getBackdrop(){
    return document.getElementById('profileBackdrop') || document.getElementById('drawerBackdrop');
  }

  function setOpen(isOpen){
    const drawer = document.getElementById('profileDrawer');
    const backdrop = getBackdrop();
    if (drawer) {
      drawer.classList.toggle('open', isOpen);
      drawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    }
    if (backdrop) backdrop.classList.toggle('open', isOpen);
    document.body.classList.toggle('profile-open', isOpen);
    if (isOpen) {
      try { document.getElementById('profileCloseBtn')?.focus(); } catch (e) {}
    }
  }

  function bind(){
    const openTargets = document.querySelectorAll('#profileOpenBtn,.profile-trigger,[data-profile-open],#studyProfileOpen');
    const closeBtn = document.getElementById('profileCloseBtn');
    const backdrop = getBackdrop();

    openTargets.forEach(openBtn => {
      if (openBtn.dataset.profileBound) return;
      openBtn.dataset.profileBound = 'true';
      openBtn.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        setOpen(true);
      });
    });

    if (closeBtn && !closeBtn.dataset.profileBound) {
      closeBtn.dataset.profileBound = 'true';
      closeBtn.addEventListener('click', event => {
        event.preventDefault();
        setOpen(false);
      });
    }

    if (backdrop && !backdrop.dataset.profileBound) {
      backdrop.dataset.profileBound = 'true';
      backdrop.addEventListener('click', () => setOpen(false));
    }
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setOpen(false);
  });

  const api = {
    open(){ bind(); setOpen(true); },
    close(){ setOpen(false); },
    bind
  };
  window.ModeAtlasProfile = window.ModeAtlasProfile || api;
  window.ModeAtlasKanaProfile = window.ModeAtlasKanaProfile || api;
  window.ModeAtlasTestProfile = window.ModeAtlasTestProfile || api;
  window.ModeAtlasWordProfile = window.ModeAtlasWordProfile || api;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
  setTimeout(bind, 500);
})();
