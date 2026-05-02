/* Mode Atlas shared local storage helpers.
   Keeps the existing localStorage key names intact while giving modules one safe API. */
(function () {
  'use strict';

  const KEYS = Object.freeze({
    readingSettings: 'settings', writingSettings: 'reverseSettings',
    readingStats: 'stats', writingStats: 'reverseStats',
    readingCharStats: 'charStats', writingCharStats: 'reverseCharStats',
    readingCharTimes: 'charTimes', writingCharTimes: 'reverseCharTimes',
    readingSrs: 'charSrs', writingSrs: 'reverseCharSrs',
    readingScoreHistory: 'scoreHistory', writingScoreHistory: 'reverseScoreHistory',
    readingDailyHistory: 'dailyChallengeHistory', writingDailyHistory: 'reverseDailyChallengeHistory',
    readingHighScore: 'highScore', writingHighScore: 'reverseHighScore',
    readingTestResults: 'testModeResults', writingTestResults: 'writingTestModeResults',
    readingTestResultsBackup: 'readingTestModeResults', writingTestResultsBackup: 'reverseTestModeResults',
    testResultsUpdatedAt: 'testModeResultsUpdatedAt', writingTestResultsUpdatedAt: 'writingTestModeResultsUpdatedAt',
    displayMode: 'modeAtlasDisplayMode', soundMode: 'modeAtlasSoundMode',
    activePreset: 'modeAtlasActivePreset', startReadingPreset: 'modeAtlasStartReadingPreset',
    wordBank: 'kanaWordBank'
  });

  function safeParse(value, fallback) {
    if (value == null || value === '') return fallback;
    try { return JSON.parse(value); } catch { return fallback; }
  }
  function get(key, fallback = '') {
    try { const value = localStorage.getItem(key); return value == null ? fallback : value; } catch { return fallback; }
  }
  function set(key, value) { try { localStorage.setItem(key, String(value)); return true; } catch { return false; } }
  function remove(key) { try { localStorage.removeItem(key); return true; } catch { return false; } }
  function has(key) { try { return localStorage.getItem(key) !== null; } catch { return false; } }
  function json(key, fallback) { return safeParse(get(key, null), fallback); }
  function setJSON(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
  function number(key, fallback = 0) { const n = Number(get(key, '')); return Number.isFinite(n) ? n : fallback; }
  function now(key) { const ts = String(Date.now()); set(key, ts); return ts; }
  function removeMany(keys) { (keys || []).forEach(remove); }
  function collect(keys) { const out = {}; (keys || []).forEach(key => { out[key] = get(key, null); }); return out; }
  function apply(map) { Object.entries(map || {}).forEach(([key, value]) => { if (value !== undefined) set(key, typeof value === 'string' ? value : JSON.stringify(value)); }); }
  function snapshot(prefix) {
    const out = {};
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key || (prefix && !key.startsWith(prefix))) continue;
        out[key] = localStorage.getItem(key);
      }
    } catch {}
    return out;
  }

  window.ModeAtlasStorage = Object.freeze({ KEYS, safeParse, get, set, remove, has, json, setJSON, number, now, removeMany, collect, apply, snapshot });
})();
