
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js';

const CONFIG = window.KANA_FIREBASE_CONFIG || null;
const CONFIG_READY = !!(CONFIG && CONFIG.apiKey && CONFIG.apiKey !== 'REPLACE_ME' && CONFIG.projectId && CONFIG.projectId !== 'REPLACE_ME' && CONFIG.appId && CONFIG.appId !== 'REPLACE_ME');
const DOC_PATH = ['users', null, 'appData', 'kanaTrainer'];
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

const SECTION_DEFS = {
  reading: {
    updatedAtKey: 'cloudReadingUpdatedAt',
    scalar: { highScore: 'highScore' },
    json: {
      settings: 'settings',
      stats: 'charStats',
      times: 'charTimes',
      srs: 'charSrs',
      scoreHistory: 'scoreHistory',
      dailyChallengeHistory: 'dailyChallengeHistory'
    }
  },
  writing: {
    updatedAtKey: 'cloudWritingUpdatedAt',
    scalar: { highScore: 'reverseHighScore' },
    json: {
      settings: 'reverseSettings',
      stats: 'reverseCharStats',
      times: 'reverseCharTimes',
      srs: 'reverseCharSrs',
      scoreHistory: 'reverseScoreHistory',
      dailyChallengeHistory: 'reverseDailyChallengeHistory'
    }
  },
  readingTests: {
    updatedAtKey: 'testModeResultsUpdatedAt',
    scalar: {},
    json: {
      primary: 'testModeResults',
      backup: 'kanaTrainerTestModeResults',
      altPrimary: 'readingTestModeResults',
      altBackup: 'kanaTrainerReadingTestModeResults'
    }
  },
  writingTests: {
    updatedAtKey: 'writingTestModeResultsUpdatedAt',
    scalar: {},
    json: {
      primary: 'writingTestModeResults',
      backup: 'kanaTrainerWritingTestModeResults'
    }
  },
  wordBank: {
    updatedAtKey: 'kanaWordBankUpdatedAt',
    scalar: {},
    json: {
      items: 'kanaWordBank'
    }
  }
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readNumber(key) {
  const raw = localStorage.getItem(key);
  const num = Number(raw || 0);
  return Number.isFinite(num) ? num : 0;
}

function normalizeTimestamp(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function snapshotSection(sectionName) {
  const def = SECTION_DEFS[sectionName];
  const data = {};
  Object.entries(def.scalar).forEach(([field, key]) => {
    data[field] = localStorage.getItem(key) || '0';
  });
  Object.entries(def.json).forEach(([field, key]) => {
    data[field] = readJSON(key, field === 'items' ? [] : field.includes('History') || field === 'settings' || field === 'stats' || field === 'times' || field === 'srs' ? {} : []);
  });
  return {
    updatedAt: normalizeTimestamp(localStorage.getItem(def.updatedAtKey)),
    data
  };
}

function hasMeaningfulSectionData(sectionName, data) {
  if (!data || typeof data !== 'object') return false;
  const scalarValues = Object.values(data).filter((value) => typeof value === 'string' || typeof value === 'number');
  if (scalarValues.some((value) => Number(value || 0) > 0)) return true;

  const values = Object.values(data);
  return values.some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object') return Object.keys(value).length > 0;
    return false;
  });
}

function snapshotSectionFixed(sectionName) {
  const def = SECTION_DEFS[sectionName];
  const data = {};
  Object.entries(def.scalar).forEach(([field, key]) => {
    data[field] = localStorage.getItem(key) || '0';
  });
  Object.entries(def.json).forEach(([field, key]) => {
    let fallback = {};
    if (sectionName === 'readingTests' || sectionName === 'writingTests') fallback = [];
    if (sectionName === 'wordBank') fallback = [];
    data[field] = readJSON(key, fallback);
  });
  const storedUpdatedAt = normalizeTimestamp(localStorage.getItem(def.updatedAtKey));
  const inferredUpdatedAt = storedUpdatedAt || (hasMeaningfulSectionData(sectionName, data) ? Date.now() : 0);
  if (!storedUpdatedAt && inferredUpdatedAt) {
    localStorage.setItem(def.updatedAtKey, String(inferredUpdatedAt));
  }
  return {
    updatedAt: inferredUpdatedAt,
    data
  };
}

function buildLocalSnapshot() {
  const sections = {};
  Object.keys(SECTION_DEFS).forEach((name) => {
    sections[name] = snapshotSectionFixed(name);
  });
  return {
    version: 'cloud-v1',
    updatedAt: Date.now(),
    sections
  };
}

function writeSectionToLocal(sectionName, payload, updatedAt) {
  const def = SECTION_DEFS[sectionName];
  const data = payload || {};
  Object.entries(def.scalar).forEach(([field, key]) => {
    localStorage.setItem(key, String(data[field] ?? '0'));
  });
  Object.entries(def.json).forEach(([field, key]) => {
    const fallback = sectionName === 'wordBank' || sectionName === 'readingTests' || sectionName === 'writingTests' ? [] : {};
    writeJSON(key, data[field] ?? fallback);
  });
  localStorage.setItem(def.updatedAtKey, String(normalizeTimestamp(updatedAt)));
}

function mergeCloudIntoLocal(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.sections) return { localPreferred: false };
  let localPreferred = false;
  Object.keys(SECTION_DEFS).forEach((name) => {
    const remoteSection = snapshot.sections[name];
    if (!remoteSection) return;
    const localSection = snapshotSectionFixed(name);
    const localUpdatedAt = normalizeTimestamp(localSection.updatedAt);
    const remoteUpdatedAt = normalizeTimestamp(remoteSection.updatedAt);
    const localHasData = hasMeaningfulSectionData(name, localSection.data);
    const remoteHasData = hasMeaningfulSectionData(name, remoteSection.data);

    if (remoteUpdatedAt > localUpdatedAt || (remoteUpdatedAt === localUpdatedAt && remoteHasData && !localHasData)) {
      writeSectionToLocal(name, remoteSection.data, remoteUpdatedAt || Date.now());
    } else if (localUpdatedAt > remoteUpdatedAt || (localUpdatedAt === remoteUpdatedAt && localHasData && !remoteHasData)) {
      localPreferred = true;
    }
  });
  return { localPreferred };
}

let app = null;
let auth = null;
let db = null;
let currentUser = null;
let authResolved = false;
let resolveAuthReady;
const authReady = new Promise((resolve) => {
  resolveAuthReady = resolve;
});
let hydratedForUserId = null;
let syncTimeout = null;
let lastStatus = '';
const uiBindings = new Set();

function statusText() {
  if (!CONFIG_READY) return 'Cloud save is configured in code, but Firebase project details still need to be added.';
  if (currentUser) return 'Cloud save is active.';
  return 'Sign in with Google to sync your saves across devices.';
}

function emitStatus() {
  lastStatus = statusText();
  uiBindings.forEach(updateUiBinding);
}

function updateUiBinding(binding) {
  const user = currentUser;
  if (binding.statusEl) binding.statusEl.textContent = binding.customStatus || lastStatus;
  if (binding.nameEl) binding.nameEl.textContent = user?.displayName || user?.email || 'Guest';
  if (binding.emailEl) binding.emailEl.textContent = user?.email || (CONFIG_READY ? 'Not signed in' : 'Firebase config missing');
  if (binding.photoEl) {
    if (user?.photoURL) {
      binding.photoEl.src = user.photoURL;
      binding.photoEl.alt = user.displayName || 'Google profile';
      binding.photoEl.style.display = 'block';
    } else {
      binding.photoEl.removeAttribute('src');
      binding.photoEl.alt = '';
      binding.photoEl.style.display = binding.hidePhotoIfNoUser ? 'none' : 'block';
    }
  }
  if (binding.signInBtn) binding.signInBtn.style.display = user ? 'none' : 'inline-flex';
  if (binding.signOutBtn) binding.signOutBtn.style.display = user ? 'inline-flex' : 'none';
  if (binding.signedInEls) binding.signedInEls.forEach((el) => { el.style.display = user ? '' : 'none'; });
  if (binding.signedOutEls) binding.signedOutEls.forEach((el) => { el.style.display = user ? 'none' : ''; });
}

function bindUi(options = {}) {
  const binding = {
    signInBtn: options.signInBtn || null,
    signOutBtn: options.signOutBtn || null,
    statusEl: options.statusEl || null,
    nameEl: options.nameEl || null,
    emailEl: options.emailEl || null,
    photoEl: options.photoEl || null,
    signedInEls: options.signedInEls || null,
    signedOutEls: options.signedOutEls || null,
    hidePhotoIfNoUser: options.hidePhotoIfNoUser !== false,
    customStatus: options.customStatus || ''
  };
  if (binding.signInBtn) binding.signInBtn.addEventListener('click', signInWithGoogle);
  if (binding.signOutBtn) binding.signOutBtn.addEventListener('click', signOutUser);
  uiBindings.add(binding);
  updateUiBinding(binding);
  return binding;
}

async function setupFirebase() {
  if (!CONFIG_READY) {
    authResolved = true;
    resolveAuthReady?.();
    emitStatus();
    return false;
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(CONFIG);
    auth = getAuth(app);
    db = getFirestore(app);
    try { await getRedirectResult(auth); } catch (error) { console.warn('Redirect sign-in result was not available.', error); }
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      authResolved = true;
      resolveAuthReady?.();
      emitStatus();
    });
  }
  return true;
}

function getDocRef(uid) {
  return doc(db, 'users', uid, 'appData', 'kanaTrainer');
}

async function hydrateFromCloud(force = false) {
  await authReady;
  if (!CONFIG_READY || !currentUser || !db) return false;
  if (!force && hydratedForUserId === currentUser.uid) return true;
  const snap = await getDoc(getDocRef(currentUser.uid));
  if (snap.exists()) {
    const { localPreferred } = mergeCloudIntoLocal(snap.data());
    hydratedForUserId = currentUser.uid;
    if (localPreferred) scheduleSync(250);
  } else {
    hydratedForUserId = currentUser.uid;
    scheduleSync(250);
  }
  return true;
}

async function beforePageLoad() {
  await setupFirebase();
  await authReady;
  if (currentUser) {
    await hydrateFromCloud();
  }
}

async function signInWithGoogle() {
  await setupFirebase();
  if (!CONFIG_READY || !auth) {
    alert('Add your Firebase project details to firebase-config.js before using Google sign-in.');
    return;
  }
  try {
    await signInWithPopup(auth, provider);
    await hydrateFromCloud(true);
  } catch (error) {
    const code = String(error?.code || '');
    if (code.includes('popup') || code.includes('cancelled')) {
      await signInWithRedirect(auth, provider);
      return;
    }
    console.error('Google sign-in failed.', error);
    alert('Google sign-in failed. Check the console and your Firebase Auth setup.');
  }
}

async function signOutUser() {
  if (!auth) return;
  await signOut(auth);
  hydratedForUserId = null;
}

async function syncNow() {
  await authReady;
  if (!CONFIG_READY || !currentUser || !db) return false;
  const snapshot = buildLocalSnapshot();
  await setDoc(getDocRef(currentUser.uid), snapshot, { merge: true });
  return true;
}

function scheduleSync(delay = 800) {
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncNow().catch((error) => console.warn('Cloud save sync failed.', error));
  }, delay);
}

function markSectionUpdated(sectionName) {
  const def = SECTION_DEFS[sectionName];
  if (!def) return;
  localStorage.setItem(def.updatedAtKey, String(Date.now()));
}

function getUser() {
  return currentUser;
}

setupFirebase().catch((error) => {
  console.warn('Firebase setup failed.', error);
  authResolved = true;
  resolveAuthReady?.();
  emitStatus();
});

window.KanaCloudSync = {
  ready: authReady,
  beforePageLoad,
  hydrateFromCloud,
  bindUi,
  signInWithGoogle,
  signOut: signOutUser,
  scheduleSync,
  syncNow,
  markSectionUpdated,
  getUser,
  isConfigured: () => CONFIG_READY
};
