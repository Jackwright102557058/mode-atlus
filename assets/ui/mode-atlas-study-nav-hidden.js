(function () {
    const storageKey = 'kanaTrainerNavHidden';
    const body = document.body;
    const profileBtn = document.getElementById('studyProfileBtn');
    const overlay = document.getElementById('studyProfileOverlay');
    const closeBtn = document.getElementById('studyProfileClose');
    const hideBtn = document.getElementById('studyNavHideBtn');
    const showBtn = document.getElementById('studyNavShowBtn');
    const store = window.ModeAtlasStorage;

    function setNavHidden(hidden) {
        body.classList.toggle('study-nav-hidden', hidden);
        store?.set(storageKey, hidden ? '1' : '0');
    }

    function openProfile() {
        if (!overlay) return;
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
    }

    function closeProfile() {
        if (!overlay) return;
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
    }

    if (store?.get(storageKey, '0') === '1') body.classList.add('study-nav-hidden');

    profileBtn?.addEventListener('click', openProfile);
    closeBtn?.addEventListener('click', closeProfile);
    overlay?.addEventListener('click', (event) => { if (event.target === overlay) closeProfile(); });
    hideBtn?.addEventListener('click', () => setNavHidden(true));
    showBtn?.addEventListener('click', () => setNavHidden(false));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeProfile(); });
})();
