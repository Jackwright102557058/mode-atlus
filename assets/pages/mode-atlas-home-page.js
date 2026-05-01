const topProfileDot = document.getElementById('topProfileDot');
const identityAvatar = document.getElementById('identityAvatar');

function updateTopProfileDot() {
  const user = window.KanaCloudSync?.getUser?.();
  if (user?.photoURL) {
    topProfileDot.innerHTML = `<img src="${user.photoURL}" alt="" />`;
  } else {
    topProfileDot.textContent = user?.displayName?.trim()?.[0]?.toUpperCase() || 'M';
  }
}

try {
  if (window.KanaCloudSync) {
    window.KanaCloudSync.bindUi({
      signInBtn: document.getElementById('identitySignInBtn'),
      signOutBtn: document.getElementById('identitySignOutBtn'),
      statusEl: document.getElementById('identityStatus'),
      nameEl: document.getElementById('identityName'),
      emailEl: document.getElementById('identityEmail'),
      photoEl: identityAvatar
    });

    window.KanaCloudSync.ready.then(updateTopProfileDot);
    document.getElementById('identitySignInBtn')?.addEventListener('click', () => setTimeout(updateTopProfileDot, 900));
    document.getElementById('identitySignOutBtn')?.addEventListener('click', () => setTimeout(updateTopProfileDot, 300));
  }
} catch (error) {
  console.warn('Cloud profile controls could not load.', error);
  const status = document.getElementById('identityStatus');
  if (status) status.textContent = 'Profile is available, but cloud sign-in could not load on this page.';
}
