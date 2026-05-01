function updateStudyTopProfileDot() {
    const dot = document.getElementById('studyTopProfileDot');
    if (!dot || !window.KanaCloudSync) return;
    const user = window.KanaCloudSync.getUser?.();
    if (user?.photoURL) {
        dot.innerHTML = `<img src="${user.photoURL}" alt="" />`;
        return;
    }
    const label = (user?.displayName || user?.email || 'M').trim();
    dot.textContent = (label[0] || 'M').toUpperCase();
}

(window.KanaCloudSync?.beforePageLoad?.() || Promise.resolve()).then(() => {
    if (!window.KanaCloudSync?.bindUi) return;
    window.KanaCloudSync.bindUi({
        signInBtn: document.getElementById('studyProfileSignIn'),
        signOutBtn: document.getElementById('studyProfileSignOut'),
        statusEl: document.getElementById('studyProfileStatus'),
        nameEl: document.getElementById('studyProfileName'),
        emailEl: document.getElementById('studyProfileEmail'),
        photoEl: document.getElementById('studyProfileAvatar')
    });
    updateStudyTopProfileDot();
    setTimeout(updateStudyTopProfileDot, 300);
    setTimeout(updateStudyTopProfileDot, 1200);
    try { if (typeof window.refreshSaveBackedStateFromCloud === "function") window.refreshSaveBackedStateFromCloud(); }
    catch (err) { console.warn("Trainer refresh after cloud bind failed", err); }
}).catch((error) => {
    console.warn('Cloud profile controls could not load.', error);
    const status = document.getElementById('studyProfileStatus');
    if (status) status.textContent = 'Profile is available, but cloud sign-in could not load on this page.';
});

document.getElementById('studyProfileSignIn')?.addEventListener('click', () => setTimeout(updateStudyTopProfileDot, 1200));
document.getElementById('studyProfileSignOut')?.addEventListener('click', () => setTimeout(updateStudyTopProfileDot, 300));
