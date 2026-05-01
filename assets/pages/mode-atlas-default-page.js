const DEFAULT_SETTINGS = {
    focusWeak: false,
    dakuten: false,
    yoon: false,
    extendedKatakana: false,
    hint: false,
    srs: true,
    mobileMode: false,
    endless: false,
    timeTrial: false,
    dailyChallenge: false,
    testMode: false,
    comboKana: false,
    comboMode: "random",
    hiraganaRows: Object.keys(hiraganaRows),
    katakanaRows: [],
    statsVisible: true,
    scoresVisible: true,
    activeBottomTab: null
};

(function ModeAtlasBeginnerReadingPreset(){
try{
  const params = new URLSearchParams(location.search);
  const requested = params.get("starter") || window.ModeAtlasStorage.get("modeAtlasStartReadingPreset", "") || "";
  const preset = requested === "a-row" ? "starter" : requested;
  if (!preset) return;
  const allHiragana = Object.keys(hiraganaRows);
  const allKatakana = Object.keys(katakanaRows);
  const presetMap = {
    starter: { hint: true, dakuten: false, yoon: false, extendedKatakana: false, hiraganaRows: ["h_a"], katakanaRows: [] },
    intermediate: { hint: false, dakuten: false, yoon: false, extendedKatakana: false, hiraganaRows: allHiragana, katakanaRows: [] },
    advanced: { hint: false, dakuten: true, yoon: false, extendedKatakana: false, hiraganaRows: allHiragana, katakanaRows: allKatakana },
    pro: { hint: false, dakuten: true, yoon: true, extendedKatakana: true, hiraganaRows: allHiragana, katakanaRows: allKatakana }
  };
  if (!presetMap[preset]) return;
  const current = window.ModeAtlasStorage.json("settings", {}) || {};
  Object.assign(current, {
    focusWeak: false,
    srs: true,
    endless: false,
    timeTrial: false,
    dailyChallenge: false,
    testMode: false,
    comboKana: false,
    mobileMode: false,
    statsVisible: true,
    scoresVisible: true,
    activeBottomTab: "modifiers",
    optionsOpen: false
  }, presetMap[preset]);
  window.ModeAtlasStorage.setJSON("settings", current);
  window.ModeAtlasStorage.now("settingsUpdatedAt");
  window.ModeAtlasStorage.set("modeAtlasStarterSeen", "true");
  window.ModeAtlasStorage.set("modeAtlasActivePreset", preset);
  window.ModeAtlasStorage.remove("modeAtlasStartReadingPreset");
  if (window.KanaCloudSync?.markSectionUpdated) window.KanaCloudSync.markSectionUpdated("reading");
  if (history.replaceState && location.search) history.replaceState(null, "", location.pathname);
}catch(err){console.warn("Mode Atlas starter preset failed",err)}
})();
let settings = { ...DEFAULT_SETTINGS, ...loadJSON("settings", DEFAULT_SETTINGS) };

normalizeLegacyRowSelection();
settings.activeBottomTab = null;
let stats = loadJSON("charStats", {});
let times = loadJSON("charTimes", {});
let srs = loadJSON("charSrs", {});

let scoreHistory = normalizeScoreHistory(loadJSON("scoreHistory", createDefaultScoreHistory()));
let dailyChallengeHistory = loadJSON("dailyChallengeHistory", {});
let highScore = window.ModeAtlasStorage.number("highScore", 0);

let charMap = {};
let activeChars = [];
let currentChar = "";
let streak = 0;
let hintTimeout = null;
let charStartTime = 0;
let locked = false;
let sessionStarted = false;
let sessionStats = createEmptySessionStats();
let debugActiveChar = null;
let DEBUG_PANEL = null;

let endlessRunTotal = 0;
let endlessRunWrong = 0;

let trialTimerId = null;
let trialEndTime = null;
let trialTarget = 0;
let comboTierNoticeTimeout = null;
let lastComboLength = 2;
let dailySequence = [];
let dailyIndex = 0;
let dailyCorrect = 0;
let dailyWrong = 0;
let dailyStartTime = 0;
let testSequence = [];
let testIndex = 0;
let testCorrect = 0;
let testWrong = 0;
let testStartTime = 0;

const titleEl = document.querySelector("h1");
const sublineEl = document.querySelector(".subline");
const dailyBadgeEl = document.getElementById("dailyBadge");
const testBadgeEl = document.getElementById("testBadge");
const hiraganaEl = document.getElementById("hiragana");
const hintEl = document.getElementById("hint");
const comboTierNoticeEl = document.getElementById("comboTierNotice");
const inputEl = document.getElementById("input");
const trialConfigEl = document.getElementById("trialConfig");
const comboConfigEl = document.getElementById("comboConfig");
const comboSameRowBtn = document.getElementById("comboSameRowBtn");
const comboRandomBtn = document.getElementById("comboRandomBtn");
const trialTimeEl = document.getElementById("trialTime");
const trialTargetEl = document.getElementById("trialTarget");
const trialTimerPill = document.getElementById("trialTimerPill");
const trialTimerEl = document.getElementById("trialTimer");
const dailyProgressPill = document.getElementById("dailyProgressPill");
const dailyCorrectPill = document.getElementById("dailyCorrectPill");
const dailyWrongPill = document.getElementById("dailyWrongPill");
const dailyOfficialPill = document.getElementById("dailyOfficialPill");
const dailyProgressEl = document.getElementById("dailyProgress");
const dailyCorrectEl = document.getElementById("dailyCorrect");
const dailyWrongEl = document.getElementById("dailyWrong");
const dailyOfficialEl = document.getElementById("dailyOfficial");
const testQuestionPill = document.getElementById("testQuestionPill");
const testCorrectPill = document.getElementById("testCorrectPill");
const testWrongPill = document.getElementById("testWrongPill");
const testQuestionEl = document.getElementById("testQuestion");
const testTotalEl = document.getElementById("testTotal");
const testCorrectEl = document.getElementById("testCorrect");
const testWrongEl = document.getElementById("testWrong");
const gameOverEl = document.getElementById("gameOver");
const gameOverTitleEl = gameOverEl.querySelector(".game-over-title");
const gameOverAnswerEl = document.getElementById("gameOverAnswer");
const streakEl = document.getElementById("streak");
const highScoreEl = document.getElementById("highScore");
const endlessTotalEl = document.getElementById("endlessTotal");
const endlessWrongEl = document.getElementById("endlessWrong");
const endlessTotalPill = document.getElementById("endlessTotalPill");
const endlessWrongPill = document.getElementById("endlessWrongPill");
const heatmapEl = document.getElementById("heatmap");
const popupEl = document.getElementById("popup");
let popupLocked = false;
let hoveredCell = null;
const modifiersTabEl = document.getElementById("modifiersTab");
const optionsTabEl = document.getElementById("optionsTab");
const modifiersContentEl = document.getElementById("modifiersContent");
const optionsContentEl = document.getElementById("optionsContent");
const statsHeaderEl = document.getElementById("statsHeader");
const statsContentEl = document.getElementById("statsContent");
const statsChevronEl = document.getElementById("statsChevron");
const scoresHeaderEl = document.getElementById("scoresHeader");
const scoresContentEl = document.getElementById("scoresContent");
const scoresChevronEl = document.getElementById("scoresChevron");
const retryBtn = document.getElementById("retryBtn");
const resetBtn = document.getElementById("resetBtn");

const startBtn = document.getElementById("startBtn");
const startWrap = document.getElementById("startWrap");
const sessionActionsEl = document.getElementById("sessionActions");
const endSessionBtn = document.getElementById("endSessionBtn");
const exportBtn = document.getElementById("exportBtn");
const copySaveBtn = document.getElementById("copySaveBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const importModalBackdrop = document.getElementById("importModalBackdrop");
const importTextarea = document.getElementById("importTextarea");
const importFileBtn = document.getElementById("importFileBtn");
const confirmImportBtn = document.getElementById("confirmImportBtn");
const closeImportModalBtn = document.getElementById("closeImportModalBtn");
const sessionModalBackdrop = document.getElementById("sessionModalBackdrop");
const sessionStatsGrid = document.getElementById("sessionStatsGrid");
const sessionHardList = document.getElementById("sessionHardList");
const sessionEasyList = document.getElementById("sessionEasyList");
const closeSessionModalBtn = document.getElementById("closeSessionModalBtn");
const bestEndlessTotalEl = document.getElementById("bestEndlessTotal");
const bestEndlessCorrectEl = document.getElementById("bestEndlessCorrect");
const bestEndlessWrongEl = document.getElementById("bestEndlessWrong");
const comboSameRowBestEl = document.getElementById("comboSameRowBest");
const comboRandomBestEl = document.getElementById("comboRandomBest");
const dailyTodayScoreEl = document.getElementById("dailyTodayScore");
const dailyTodayAttemptsEl = document.getElementById("dailyTodayAttempts");
const dailyHistoryListEl = document.getElementById("dailyHistoryList");
const timeTrialTop3El = document.getElementById("timeTrialTop3");

function saveAll() {
    window.ModeAtlasTrainerCore.saveTrainerState({
        prefix: "",
        section: "reading",
        highScoreKey: "highScore",
        settings,
        stats,
        times,
        srs,
        scoreHistory,
        dailyChallengeHistory,
        highScore
    });
}


function getDailyChallengePoolMap() {
    return DAILY_CHALLENGE_CHAR_MAP;
}

function buildDailySequence(dateKey = getTodayKey()) {
    return window.ModeAtlasTrainerCore.buildDailySequence({
        poolMap: getDailyChallengePoolMap(),
        count: 20,
        seed: `daily:${dateKey}`,
        rngFactory: createSeededRng
    });
}



function applyDailyChallengeTheme() {
    const dailyActive = isDailyChallengeSession();
    const testActive = isTestModeSession();

    document.body.classList.toggle("daily-challenge-active", dailyActive);
    document.body.classList.toggle("test-mode-active", testActive);

    if (dailyBadgeEl) dailyBadgeEl.style.display = dailyActive ? "inline-block" : "none";
    if (testBadgeEl) testBadgeEl.style.display = testActive ? "inline-block" : "none";

    if (dailyActive) {
        titleEl.textContent = "Reading Daily Challenge";
        sublineEl.textContent = "20 questions · All hiragana, katakana, and dakuten";
    } else if (testActive) {
        titleEl.textContent = "Reading Test Mode";
        sublineEl.textContent = "One full shuffled pass through all enabled test kana";
    } else {
        titleEl.textContent = "Reading Practice";
        sublineEl.textContent = "Enter the matching romaji";
    }
}

function updateDailyChallengePills() {
    const dailyActive = isDailyChallengeSession() && sessionStarted;
    dailyProgressPill.style.display = dailyActive ? "inline-block" : "none";
    dailyCorrectPill.style.display = dailyActive ? "inline-block" : "none";
    dailyWrongPill.style.display = dailyActive ? "inline-block" : "none";

    if (dailyActive) {
        dailyProgressEl.textContent = Math.min(dailyIndex + 1, 20);
        dailyCorrectEl.textContent = dailyCorrect;
        dailyWrongEl.textContent = dailyWrong;
    }

    const todayRecord = getTodayDailyRecord();
    dailyOfficialPill.style.display = dailyActive ? "inline-block" : "none";
    dailyOfficialEl.textContent = todayRecord ? `${todayRecord.officialScore}/${todayRecord.total}` : "—";

    const testActive = isTestModeSession() && sessionStarted;
    testQuestionPill.style.display = testActive ? "inline-block" : "none";
    testCorrectPill.style.display = testActive ? "inline-block" : "none";
    testWrongPill.style.display = testActive ? "inline-block" : "none";

    if (testActive) {
        testQuestionEl.textContent = Math.min(testIndex + 1, testSequence.length || 0);
        testTotalEl.textContent = testSequence.length || 0;
        testCorrectEl.textContent = testCorrect;
        testWrongEl.textContent = testWrong;
    }
}

function updateComboKanaBestScore() {
    if (!settings.comboKana) return;
    scoreHistory = normalizeScoreHistory(scoreHistory);
    const comboKey = settings.comboMode === "same_row" ? "same_row" : "random";
    scoreHistory.comboKanaBest[comboKey] = Math.max(scoreHistory.comboKanaBest[comboKey] || 0, streak);
}

function endDailyChallenge() {
    window.KanaCloudSync?.setSessionCloudPause?.(false);
    window.KanaCloudSync?.flushDeferredSessionSync?.(650);
    const dateKey = getTodayKey();
    const total = dailySequence.length || 20;
    const timeMs = Math.max(0, Date.now() - dailyStartTime);
    const existing = dailyChallengeHistory[dateKey];

    sessionStarted = false;
    sessionStats.active = false;
    inputEl.disabled = true;
    sessionActionsEl.style.display = "none";
    startWrap.style.display = "flex";
    clearHint();
    hideComboTierNotice();
    currentChar = "";
    hiraganaEl.textContent = "—";

    if (!existing) {
        dailyChallengeHistory[dateKey] = {
            sequence: [...dailySequence],
            officialScore: dailyCorrect,
            total,
            timeMs,
            attempts: 1
        };
        gameOverTitleEl.textContent = "Reading Daily Challenge Complete";
        gameOverAnswerEl.textContent = `Official score recorded: ${dailyCorrect}/${total}`;
    } else {
        existing.attempts = (existing.attempts || 1) + 1;
        if (!existing.sequence) existing.sequence = [...dailySequence];
        gameOverTitleEl.textContent = "Practice Replay Complete";
        gameOverAnswerEl.textContent = `Practice replay complete. ${dailyCorrect}/${total} vs Official score ${existing.officialScore}/${existing.total}`;
    }

    gameOverEl.style.display = "block";
    buildModifierButtons();
    buildRows("rowOptions", hiraganaRows, "hiraganaRows", "h_");
    buildRows("katakanaRowOptions", katakanaRows, "katakanaRows", "k_");
    updateTrialConfigVisibility();
    updateTopStats();
    if (DEBUG_PANEL) renderDebugPanel();
    renderScoreHistory();
    applyDailyChallengeTheme();
    saveAll();
}

function validRomajiSet() {
    const sourceMap = getAnswerMapForCurrentMode();
    return new Set(Object.values(sourceMap));
}

function applyPanelStates() {
    if (settings.activeBottomTab === "options") settings.activeBottomTab = null;
    modifiersContentEl.classList.toggle("open", settings.activeBottomTab === "modifiers");
    if (optionsContentEl) optionsContentEl.classList.toggle("open", false);

    modifiersTabEl.classList.toggle("active", settings.activeBottomTab === "modifiers");
    if (optionsTabEl) optionsTabEl.classList.toggle("active", false);

    modifiersTabEl.textContent = settings.activeBottomTab === "modifiers" ? "Modifiers ▲" : "Modifiers ▼";
    if (optionsTabEl) optionsTabEl.textContent = "Options ▼";

    statsContentEl.classList.toggle("hidden", !settings.statsVisible);
    statsChevronEl.textContent = settings.statsVisible ? "▼" : "▲";

    scoresContentEl.classList.toggle("hidden", !settings.scoresVisible);
    scoresChevronEl.textContent = settings.scoresVisible ? "▼" : "▲";

    document.body.classList.toggle("mobile-mode", !!settings.mobileMode);
}


document.addEventListener("click", (e) => {
    if (e.target.closest(".cell")) return;
    popupLocked = false;
    hoveredCell = null;
    closePopup();
});

function onSettingsChanged() {

    rebuildCharMap();
    ensureDataObjects();
    buildModifierButtons();
    buildOptionButtons();
    buildRows("rowOptions", hiraganaRows, "hiraganaRows", "h_");
    buildRows("katakanaRowOptions", katakanaRows, "katakanaRows", "k_");
    applyPanelStates();
    updateTrialConfigVisibility();
    renderHeatmap();
    updateTopStats();
    if (DEBUG_PANEL) renderDebugPanel();
    renderScoreHistory();
    saveAll();

    if (sessionStarted && !locked) nextCharacter();
}

function getSrsWeightBreakdown(char) {
    const st = getStats(char);
    const sr = getSrs(char);
    const now = Date.now();
    const avgTime = getAverageTime(char);
    const unseenMs = sr.lastSeen ? Math.max(0, now - sr.lastSeen) : 60000;
    const slowMs = Math.max(0, avgTime - 1200);
    const parts = {
        base: 1,
        focusWeak: settings.focusWeak ? Math.max(0, st.wrong * 2 - st.correct) : 0,
        overdue: 0,
        lowLevel: 0,
        unseen: 0,
        firstSeenBonus: 0,
        recentWrong: 0,
        slow: 0
    };

    if (settings.srs) {
        const overdueMs = Math.max(0, now - sr.due);
        parts.overdue = Math.min(12, Math.floor(overdueMs / 5000));
        parts.lowLevel = Math.max(0, 4 - sr.level);
        parts.unseen = Math.min(6, Math.floor(unseenMs / 15000));
        parts.firstSeenBonus = sr.lastSeen ? 0 : 2;
        parts.recentWrong = (sr.lastWrong && now - sr.lastWrong < 30000) ? 5 : 0;
        parts.slow = Math.min(4, Math.floor(slowMs / 600));
    }

    const total = Math.max(1, Object.values(parts).reduce((sum, value) => sum + value, 0));
    return {
        char,
        romaji: charMap[char] || '—',
        stats: st,
        srs: sr,
        avgTime,
        parts,
        total,
        dueInMs: sr.due ? (sr.due - now) : 0,
        lastSeenAgoMs: sr.lastSeen ? (now - sr.lastSeen) : null,
        lastWrongAgoMs: sr.lastWrong ? (now - sr.lastWrong) : null
    };
}

function getDebugActiveChar() {
    return debugActiveChar || currentChar || activeChars[0] || null;
}

function renderDebugPanel() {
    const activeChar = getDebugActiveChar();
    if (!activeChar) return null;
    const info = getSrsWeightBreakdown(activeChar);

    if (!DEBUG_PANEL || !document.body.contains(DEBUG_PANEL)) {
        DEBUG_PANEL = document.createElement('div');
        DEBUG_PANEL.id = 'srsDebugPanel';
        Object.assign(DEBUG_PANEL.style, {
            position: 'fixed', right: '16px', bottom: '16px', zIndex: '9999',
            width: 'min(380px, calc(100vw - 32px))', maxHeight: '70vh', overflow: 'auto',
            padding: '14px', borderRadius: '16px', background: 'rgba(12,12,12,0.97)',
            border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
            fontFamily: 'Arial, sans-serif', fontSize: '12px', lineHeight: '1.45', color: '#f3f3f3'
        });
        document.body.appendChild(DEBUG_PANEL);
    }

    DEBUG_PANEL.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="font-size:13px;font-weight:800;letter-spacing:0.04em;">SRS Debug</div>
            <button type="button" id="closeSrsDebugBtn" style="border:1px solid rgba(255,255,255,0.14);background:#1f1f1f;color:#f3f3f3;border-radius:8px;padding:4px 9px;cursor:pointer;font-size:12px;">✕</button>
        </div>
        <div style="display:grid;gap:8px;">
            <div><strong>Active kana:</strong> ${info.char} <span style="color:#bfbfbf;">(${info.romaji})</span></div>
            <div><strong>Current shown:</strong> <span style="color:#bfbfbf;">${currentChar || '—'}</span></div>
            <div><strong>Session state:</strong> <span style="color:#bfbfbf;">started=${sessionStarted} · locked=${locked} · activeChars=${activeChars.length}</span></div>
            <div><strong>Settings:</strong> <span style="color:#bfbfbf;">focusWeak=${settings.focusWeak} · srs=${settings.srs} · dakuten=${settings.dakuten} · yoon=${settings.yoon} · extendedKatakana=${settings.extendedKatakana}</span></div>
            <div style="padding:10px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
                <div style="font-weight:800;margin-bottom:6px;">Weight breakdown</div>
                ${Object.entries(info.parts).map(([k,v]) => `<div style="display:flex;justify-content:space-between;gap:8px;"><span>${k}</span><strong>${v}</strong></div>`).join('')}
                <div style="display:flex;justify-content:space-between;gap:8px;margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.08);"><span>finalWeight</span><strong>${info.total}</strong></div>
            </div>
            <div style="padding:10px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
                <div style="font-weight:800;margin-bottom:6px;">Kana save data</div>
                <div>correct: <strong>${info.stats.correct}</strong></div>
                <div>wrong: <strong>${info.stats.wrong}</strong></div>
                <div>avgTime: <strong>${formatDuration(info.avgTime)}</strong></div>
                <div>srs.level: <strong>${info.srs.level}</strong></div>
                <div>due in: <strong>${info.dueInMs > 0 ? formatDuration(info.dueInMs) : 'due now'}</strong></div>
                <div>lastSeen ago: <strong>${info.lastSeenAgoMs === null ? 'never' : formatDuration(info.lastSeenAgoMs)}</strong></div>
                <div>lastWrong ago: <strong>${info.lastWrongAgoMs === null ? 'never' : formatDuration(info.lastWrongAgoMs)}</strong></div>
            </div>
            <div style="padding:10px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
                <div style="font-weight:800;margin-bottom:6px;">Save snapshot</div>
                <div>stats keys: <strong>${Object.keys(stats).length}</strong></div>
                <div>times keys: <strong>${Object.keys(times).length}</strong></div>
                <div>srs keys: <strong>${Object.keys(srs).length}</strong></div>
                <div>highScore: <strong>${highScore}</strong></div>
            </div>
        </div>
    `;
    const closeBtn = document.getElementById('closeSrsDebugBtn');
    if (closeBtn) closeBtn.onclick = closeDebugPanel;
    return DEBUG_PANEL;
}

window.renderDebugPanel = renderDebugPanel;
window.closeDebugPanel = closeDebugPanel;

function weightedPick(pool) {
    if (pool.length === 0) return null;
    if (pool.length === 1) return pool[0];

    const now = Date.now();
    const weighted = [];

    for (const ch of pool) {
        const st = getStats(ch);
        const sr = getSrs(ch);
        const avgTime = getAverageTime(ch);
        let weight = 1;

        if (settings.focusWeak) {
            weight += Math.max(0, st.wrong * 2 - st.correct);
        }

        if (settings.srs) {
            const overdueMs = Math.max(0, now - sr.due);
            const unseenMs = sr.lastSeen ? Math.max(0, now - sr.lastSeen) : 60000;
            const slowMs = Math.max(0, avgTime - 1200);

            weight += Math.min(12, Math.floor(overdueMs / 5000));
            weight += Math.max(0, 4 - sr.level);
            weight += Math.min(6, Math.floor(unseenMs / 15000));
            if (!sr.lastSeen) weight += 2;
            if (sr.lastWrong && now - sr.lastWrong < 30000) weight += 5;
            weight += Math.min(4, Math.floor(slowMs / 600));
        }

        weight = Math.max(1, weight);
        for (let i = 0; i < weight; i++) weighted.push(ch);
    }

    return weighted[Math.floor(Math.random() * weighted.length)];
}

function getRowKeyForChar(char) {
    for (const [rowKey, mapping] of Object.entries(hiraganaRows)) {
        if (char in mapping) return rowKey.replace(/^h_/, "");
    }
    for (const [rowKey, mapping] of Object.entries(katakanaRows)) {
        if (char in mapping) return rowKey.replace(/^k_/, "");
    }
    return null;
}

function buildComboCharacters(pool, firstPick) {
    const comboLength = getComboLength();
    const chars = [firstPick];

    if (settings.comboMode === "same_row") {
        const firstRow = getRowKeyForChar(firstPick);
        let sameRowPool = pool.filter(ch => getRowKeyForChar(ch) === firstRow);
        if (sameRowPool.length === 0) sameRowPool = [firstPick];

        while (chars.length < comboLength) {
            const nextPick = sameRowPool[Math.floor(Math.random() * sameRowPool.length)] || firstPick;
            chars.push(nextPick);
        }
        return chars;
    }

    while (chars.length < comboLength) {
        chars.push(weightedPick(pool) || firstPick);
    }

    return chars;
}

function scheduleHint() {
    clearHint();
    if (!settings.hint || !currentChar || !sessionStarted) return;

    const avg = currentChar.split("").reduce((sum, ch) => sum + getAverageTime(ch), 0) / Math.max(1, currentChar.length);
    const delay = Math.max(600, Math.round(avg * 1.2));

    hintTimeout = setTimeout(() => {
        const answer = getAnswerForCurrentChar();
        if (!answer || locked || !sessionStarted) return;
        hintEl.textContent = answer[0] + "_".repeat(Math.max(0, answer.length - 1));
    }, delay);
}

function showIdleState() {
    clearHint();
    hideComboTierNotice();
    stopTrialTimer();
    currentChar = "";
    hiraganaEl.textContent = "—";
    hiraganaEl.classList.remove("flash-correct", "flash-wrong");
    inputEl.value = "";
    inputEl.disabled = true;
    startWrap.style.display = "flex";
    sessionActionsEl.style.display = "none";
    gameOverEl.style.display = "none";
    gameOverTitleEl.textContent = "Wrong";
    gameOverAnswerEl.textContent = "";
    trialTimerPill.style.display = "none";
    updateDailyChallengePills();
    applyDailyChallengeTheme();
}

function nextCharacter() {
    if (!sessionStarted) return;

    clearHint();
    closePopup();
    inputEl.value = "";

    if (isDailyChallengeSession()) {
        if (dailyIndex >= dailySequence.length) {
            endDailyChallenge();
            return;
        }

        currentChar = dailySequence[dailyIndex] || "あ";
        hiraganaEl.textContent = currentChar;
        hiraganaEl.classList.remove("flash-correct", "flash-wrong");
        charStartTime = Date.now();
        gameOverTitleEl.textContent = "Wrong";
        gameOverAnswerEl.textContent = "";
        hideComboTierNotice();
        inputEl.disabled = false;
        inputEl.focus();
        updateTopStats();
    if (DEBUG_PANEL) renderDebugPanel();
        return;
    }

    if (isTestModeSession()) {
        if (testIndex >= testSequence.length) {
            endTestMode();
            return;
        }

        currentChar = testSequence[testIndex] || "あ";
        hiraganaEl.textContent = currentChar;
        hiraganaEl.classList.remove("flash-correct", "flash-wrong");
        charStartTime = Date.now();
        gameOverTitleEl.textContent = "Wrong";
        gameOverAnswerEl.textContent = "";
        hideComboTierNotice();
        inputEl.disabled = false;
        inputEl.focus();
        updateTopStats();
    if (DEBUG_PANEL) renderDebugPanel();
        return;
    }

    rebuildCharMap();
    ensureDataObjects();

    const pool = getEligiblePool();
    const firstPick = weightedPick(pool) || activeChars[0] || "あ";
    let displayValue = firstPick;

    if (settings.comboKana && activeChars.length > 0) {
        displayValue = buildComboCharacters(pool, firstPick).join("");
    }

    currentChar = displayValue;
    hiraganaEl.textContent = currentChar;
    hiraganaEl.classList.remove("flash-correct", "flash-wrong");
    charStartTime = Date.now();
    gameOverTitleEl.textContent = "Wrong";
    gameOverAnswerEl.textContent = "";

    scheduleHint();
    inputEl.disabled = false;
    inputEl.focus();
}

function startSession() {
    window.KanaCloudSync?.setSessionCloudPause?.(true);
    sessionStarted = true;
    sessionStats = createEmptySessionStats();
    sessionStats.active = true;
    sessionStats.startTime = Date.now();

    streak = 0;
    endlessRunTotal = 0;
    endlessRunWrong = 0;
    lastComboLength = getComboLength();
    hideComboTierNotice();

    if (isDailyChallengeSession()) {
        dailySequence = buildDailySequence();
        dailyIndex = 0;
        dailyCorrect = 0;
        dailyWrong = 0;
        dailyStartTime = Date.now();
    }

    if (isTestModeSession()) {
        testSequence = buildTestSequence();
        testIndex = 0;
        testCorrect = 0;
        testWrong = 0;
        testStartTime = Date.now();
    }

    updateTopStats();
    if (DEBUG_PANEL) renderDebugPanel();

    gameOverEl.style.display = "none";
    gameOverTitleEl.textContent = "Wrong";
    locked = false;
    setRetryButtonVisible(false);
    startWrap.style.display = "none";
    sessionActionsEl.style.display = "flex";
    inputEl.disabled = false;

    if (settings.timeTrial && !isDailyChallengeSession()) {
        const timeMinutes = Math.max(0.1, Number(trialTimeEl.value) || 0.5);
        trialTarget = Math.max(1, Number(trialTargetEl.value) || 20);
        startTrialTimer(timeMinutes);
    } else {
        trialTarget = 0;
        trialTimerPill.style.display = "none";
    }

    onSettingsChanged();
}

function updateSrsCorrect(char) {
    const entry = srs[char] || { level: 0, due: 0, lastSeen: 0, lastWrong: 0 };
    entry.level = Math.min(entry.level + 1, 8);
    const intervals = [3000, 8000, 15000, 30000, 60000, 120000, 300000, 600000, 1200000];
    const delay = intervals[entry.level] ?? 1200000;
    entry.due = Date.now() + delay;
    entry.lastSeen = Date.now();
    srs[char] = entry;
}

function flashResult(correct, onDone) {
    locked = true;
    hiraganaEl.classList.remove("flash-correct", "flash-wrong");
    hiraganaEl.classList.add(correct ? "flash-correct" : "flash-wrong");

    setTimeout(() => {
        hiraganaEl.classList.remove("flash-correct", "flash-wrong");
        locked = false;
        if (onDone) onDone();
    }, correct ? 260 : 420);
}

function getAnswerForCurrentChar() {
    const sourceMap = getAnswerMapForCurrentMode();
    return currentChar.split("").map(ch => sourceMap[ch] || "").join("");
}

function getDisplayAnswerForCurrentChar() {
    const sourceMap = getAnswerMapForCurrentMode();
    const parts = currentChar.split("").map(ch => sourceMap[ch] || "");
    return settings.comboKana ? parts.join(" + ") : parts.join("");
}

function handleCorrect() {
    const timeTaken = Date.now() - charStartTime;

    for (const ch of currentChar.split("")) {
        if (!stats[ch]) stats[ch] = { correct: 0, wrong: 0 };
        stats[ch].correct += 1;
        updateAverageTime(ch, timeTaken / Math.max(1, currentChar.length));
        updateSrsCorrect(ch);
    }

    streak += 1;
    highScore = Math.max(highScore, streak);
    updateComboKanaBestScore();

    const nextComboLength = getComboLength();
    if (settings.comboKana && nextComboLength > lastComboLength) showComboTierNotice(nextComboLength);
    lastComboLength = nextComboLength;

    sessionStats.answered += 1;
    sessionStats.correct += 1;
    sessionStats.timings.push(timeTaken);
    sessionStats.bestStreak = Math.max(sessionStats.bestStreak, streak);
    updateSessionChar(currentChar, true, timeTaken);

    if (isDailyChallengeSession()) {
        dailyCorrect += 1;
        dailyIndex += 1;
    } else if (isTestModeSession()) {
        testCorrect += 1;
        testIndex += 1;
    } else if (currentFlowModeIsContinuous()) endlessRunTotal += 1;

    updateTopStats();
    if (DEBUG_PANEL) renderDebugPanel();
    renderHeatmap();
    renderScoreHistory();
    saveAll();

    if (isTestModeSession()) {
        flashResult(true, () => advanceTestModeAfterAnswer());
        return;
    }

    flashResult(true, () => nextCharacter());
}

function handleWrong() {
    const timeTaken = Date.now() - charStartTime;
    const correctAnswer = getDisplayAnswerForCurrentChar();

    for (const ch of currentChar.split("")) {
        if (!stats[ch]) stats[ch] = { correct: 0, wrong: 0 };
        stats[ch].wrong += 1;
        updateAverageTime(ch, timeTaken / Math.max(1, currentChar.length));
        updateSrsWrong(ch);
    }

    sessionStats.answered += 1;
    sessionStats.wrong += 1;
    sessionStats.timings.push(timeTaken);
    sessionStats.bestStreak = Math.max(sessionStats.bestStreak, streak);
    updateSessionChar(currentChar, false, timeTaken);

    if (isDailyChallengeSession()) {
        dailyWrong += 1;
        dailyIndex += 1;
    } else if (isTestModeSession()) {
        testWrong += 1;
        testIndex += 1;
    } else if (currentFlowModeIsContinuous()) {
        endlessRunTotal += 1;
        endlessRunWrong += 1;
    }

    streak = 0;
    lastComboLength = getComboLength();
    hideComboTierNotice();
    updateTopStats();
    if (DEBUG_PANEL) renderDebugPanel();
    renderHeatmap();
    saveAll();

    if (isDailyChallengeSession()) {
        hintEl.textContent = `Answer: ${correctAnswer}`;
        flashResult(false, () => nextCharacter());
    } else if (isTestModeSession()) {
        hintEl.textContent = `Answer: ${correctAnswer}`;
        flashResult(false, () => advanceTestModeAfterAnswer());
    } else if (currentFlowModeIsContinuous()) {
        hintEl.textContent = `Answer: ${correctAnswer}`;
        flashResult(false, () => nextCharacter());
    } else {
        gameOverAnswerEl.textContent = `Correct answer: ${correctAnswer}`;
        flashResult(false, () => {
            gameOverEl.style.display = "block";
            inputEl.disabled = true;
        });
    }
}

inputEl.addEventListener("input", () => {
    if (!sessionStarted || locked || gameOverEl.style.display === "block") return;

    const value = inputEl.value.trim().toLowerCase();
    if (!value) return;

    const expected = getAnswerForCurrentChar();
    const compactValue = value.replace(/\s+/g, "");
    const valid = validRomajiSet();

    if (compactValue === expected) {
        handleCorrect();
        return;
    }

    if (expected.startsWith(compactValue) && compactValue.length < expected.length) return;

    if (settings.comboKana || isDailyChallengeSession() || valid.has(value) || compactValue.length >= expected.length) {
        handleWrong();
    }
});

retryBtn.addEventListener("click", () => {
    gameOverEl.style.display = "none";
    gameOverAnswerEl.textContent = "";
    startSession();
});

startBtn.addEventListener("click", startSession);

comboSameRowBtn.addEventListener("click", () => {
    if (sessionStarted) return;
    settings.comboMode = "same_row";
    comboSameRowBtn.classList.add("active");
    comboRandomBtn.classList.remove("active");
    updateTrialConfigVisibility();
    saveAll();
});

comboRandomBtn.addEventListener("click", () => {
    if (sessionStarted) return;
    settings.comboMode = "random";
    comboRandomBtn.classList.add("active");
    comboSameRowBtn.classList.remove("active");
    updateTrialConfigVisibility();
    saveAll();
});


const TEST_RESULTS_KEYS = window.ModeAtlasResultsStorage.keys("reading");
const TEST_RESULTS_STORAGE_KEY = TEST_RESULTS_KEYS.primary;
const TEST_RESULTS_STORAGE_BACKUP_KEY = TEST_RESULTS_KEYS.backup;
const TEST_RESULTS_UPDATED_AT_KEY = TEST_RESULTS_KEYS.updatedAt;

function normalizeStoredTestModeResults(list) {
    return window.ModeAtlasTrainerCore.normalizeTestResults("reading", list);
}


function persistStoredTestModeResults(list) {
    return window.ModeAtlasTrainerCore.persistTestResults("reading", list);
}


function saveTestModeResult() {
    window.ModeAtlasTrainerCore.saveTestModeResult({
        mode: "reading",
        testStartTime,
        correct: testCorrect,
        wrong: testWrong,
        sessionStats,
        testSequence,
        settings,
        notes: "Full shuffled reading test run.",
        buildBreakdown: buildTestModeBreakdown,
        buildKanaResults: buildTestModeKanaResults,
        loadResults: loadStoredTestModeResults,
        persistResults: persistStoredTestModeResults
    });
}


function endTestMode() {
    window.KanaCloudSync?.setSessionCloudPause?.(false);
    window.KanaCloudSync?.flushDeferredSessionSync?.(650);
    const durationMs = Math.max(0, Date.now() - testStartTime);
    const totalAnswered = testCorrect + testWrong;
    const scorePct = totalAnswered ? Math.round((testCorrect / totalAnswered) * 100) : 0;

    saveTestModeResult();

    sessionStarted = false;
    sessionStats.active = false;
    locked = false;
    stopTrialTimer();
    inputEl.disabled = true;
    gameOverEl.style.display = "none";
    setRetryButtonVisible(true);
    sessionActionsEl.style.display = "none";
    startWrap.style.display = "flex";
    clearHint();
    hiraganaEl.textContent = "—";
    currentChar = "";

    sessionStatsGrid.innerHTML = window.ModeAtlasTrainerCore.renderStatCards([
        ["Score", `${scorePct}%`],
        ["Correct", testCorrect],
        ["Wrong", testWrong],
        ["Questions", testSequence.length || totalAnswered || 0],
        ["Avg Time", formatDuration(sessionStats.timings.length ? average(sessionStats.timings) : 0)],
        ["Test Time", formatDuration(durationMs)]
    ]);

    sessionHardList.style.display = "none";
    sessionEasyList.style.display = "none";
    const modalTitle = sessionModalBackdrop.querySelector("h2");
    if (modalTitle) modalTitle.textContent = "Reading Test Complete";
    sessionModalBackdrop.classList.add("open");

    updateTopStats();
    if (DEBUG_PANEL) renderDebugPanel();
    renderScoreHistory();
    saveAll();
    onSettingsChanged();
}
function updateBestScores() {
    scoreHistory = normalizeScoreHistory(scoreHistory);

    if (settings.comboKana) {
        updateComboKanaBestScore();
    }

    if (settings.endless) {
        const correct = Math.max(0, endlessRunTotal - endlessRunWrong);
        if (correct > (scoreHistory.endlessBest.correct || 0)) {
            scoreHistory.endlessBest = {
                total: endlessRunTotal,
                correct,
                wrong: endlessRunWrong
            };
        }
    }

    if (settings.timeTrial) {
        const timeVal = Number(trialTimeEl.value) || 0.5;
        const entry = {
            time: timeVal,
            target: trialTarget || Math.max(1, Number(trialTargetEl.value) || 20),
            score: sessionStats.correct,
            ratio: sessionStats.correct / Math.max(0.1, timeVal),
            overTarget: sessionStats.correct - (trialTarget || Math.max(1, Number(trialTargetEl.value) || 20))
        };

        scoreHistory.timeTrialTop3.push(entry);
        scoreHistory.timeTrialTop3.sort((a, b) => {
            if (b.overTarget !== a.overTarget) return b.overTarget - a.overTarget;
            if (b.ratio !== a.ratio) return b.ratio - a.ratio;
            return b.score - a.score;
        });
        scoreHistory.timeTrialTop3 = scoreHistory.timeTrialTop3.slice(0, 3);
    }

    renderScoreHistory();
    saveAll();
}

function showSessionModal(autoEnded = false) {
    sessionStats.endTime = Date.now();

    const total = sessionStats.answered;
    const accuracy = total ? ((sessionStats.correct / total) * 100) : 0;
    const avgTime = sessionStats.timings.length ? average(sessionStats.timings) : 0;
    const fastest = sessionStats.timings.length ? Math.min(...sessionStats.timings) : 0;
    const slowest = sessionStats.timings.length ? Math.max(...sessionStats.timings) : 0;
    const durationMs = sessionStats.startTime ? (sessionStats.endTime - sessionStats.startTime) : 0;

    const cards = [
        ["Answered", total],
        ["Right", sessionStats.correct],
        ["Wrong", sessionStats.wrong],
        ["Accuracy", `${accuracy.toFixed(1)}%`],
        ["Best Streak", sessionStats.bestStreak],
        ["Avg Time", formatDuration(avgTime)],
        ["Fastest", formatDuration(fastest)],
        ["Slowest", formatDuration(slowest)],
        ["Session Time", formatDuration(durationMs)]
    ];

    if (settings.timeTrial) {
        cards.push(["Target", trialTarget]);
        cards.push(["Final Score", sessionStats.correct]);
    }

    sessionStatsGrid.innerHTML = cards.map(([label, value]) => `
        <div class="stat-card">
            <div class="label">${label}</div>
            <div class="value">${value}</div>
        </div>
    `).join("");

    const titleEl = sessionModalBackdrop.querySelector("h2");
    titleEl.textContent = autoEnded ? "Time Trial Complete" : "Session Stats";

    const { hardest, easiest } = getSessionDifficultyLists();
    renderSessionList(sessionHardList, "Hardest This Session", hardest);
    renderSessionList(sessionEasyList, "Strongest This Session", easiest);

    sessionModalBackdrop.classList.add("open");
}

function endSession(autoEnded = false) {
    hideComboTierNotice();
    if (!sessionStarted) return;
    window.KanaCloudSync?.setSessionCloudPause?.(false);
    window.KanaCloudSync?.flushDeferredSessionSync?.(650);

    if (isDailyChallengeSession()) {
        sessionStarted = false;
        sessionStats.active = false;
        stopTrialTimer();
        inputEl.disabled = true;
        gameOverEl.style.display = "none";
        sessionActionsEl.style.display = "none";
        startWrap.style.display = "flex";
        clearHint();
        hiraganaEl.textContent = "—";
        currentChar = "";
        updateTopStats();
    if (DEBUG_PANEL) renderDebugPanel();
        onSettingsChanged();
        return;
    }

    sessionStarted = false;
    sessionStats.active = false;
    stopTrialTimer();
    updateBestScores();

    inputEl.disabled = true;
    gameOverEl.style.display = "none";
    sessionActionsEl.style.display = "none";
    startWrap.style.display = "flex";
    clearHint();
    hiraganaEl.textContent = "—";
    currentChar = "";

    showSessionModal(autoEnded);
    updateTopStats();
    if (DEBUG_PANEL) renderDebugPanel();
    onSettingsChanged();
}

endSessionBtn.addEventListener("click", () => endSession(false));

closeSessionModalBtn.addEventListener("click", () => {
    sessionModalBackdrop.classList.remove("open");
});

sessionModalBackdrop.addEventListener("click", (e) => {
    if (e.target === sessionModalBackdrop) {
        sessionModalBackdrop.classList.remove("open");
    }
});

function makeExportPayload() {
    return window.ModeAtlasTrainerCore.buildExportPayload({
        version: "2.11.4",
        settings,
        stats,
        times,
        srs,
        scoreHistory,
        dailyChallengeHistory,
        highScore,
        loadResults: loadStoredTestModeResults,
        updatedAt: window.ModeAtlasStorage.get(TEST_RESULTS_UPDATED_AT_KEY, ""),
        includeReadingAliases: true
    });
}

function exportData() {
    window.ModeAtlasTrainerCore.downloadJson("kana-trainer-save.json", makeExportPayload());
}


async function copySaveData() {
    await window.ModeAtlasTrainerCore.copyJsonPayload(makeExportPayload(), {
        textarea: importTextarea,
        modal: importModalBackdrop,
        successMessage: "Save data copied to clipboard.",
        fallbackMessage: "Clipboard copy was not available. Your save data has been placed in the import box so you can copy it manually."
    });
}


if (exportBtn) exportBtn.addEventListener("click", exportData);
if (copySaveBtn) copySaveBtn.addEventListener("click", copySaveData);

if (importBtn) importBtn.addEventListener("click", openImportModal);
closeImportModalBtn.addEventListener("click", closeImportModal);

importModalBackdrop.addEventListener("click", (e) => {
    if (e.target === importModalBackdrop) closeImportModal();
});

if (importFileBtn && importFile) importFileBtn.addEventListener("click", () => {
    importFile.click();
});

if (importFile) importFile.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    importTextarea.value = text;
    importFile.value = "";
});

function applyImportedData(payload) {
    if (!payload || typeof payload !== "object") {
        throw new Error("Invalid save data.");
    }

    stats = payload.stats || {};
    times = payload.times || {};
    srs = payload.srs || {};
    scoreHistory = normalizeScoreHistory(payload.scoreHistory || createDefaultScoreHistory());
    dailyChallengeHistory = payload.dailyChallengeHistory || {};
    highScore = Number(payload.highScore || 0);
    settings = { ...DEFAULT_SETTINGS, ...(payload.settings || settings) };

    const importedTestModeResults = Array.isArray(payload.readingTestModeResults)
        ? payload.readingTestModeResults
        : (Array.isArray(payload.testModeResults)
            ? payload.testModeResults.filter(item => (item?.mode || "reading") === "reading")
            : []);
    window.ModeAtlasResultsStorage.persistImported("reading", importedTestModeResults);
    window.KanaCloudSync?.markSectionUpdated("readingTests");
    window.KanaCloudSync?.scheduleSync();

    streak = 0;
    sessionStarted = false;
    sessionStats = createEmptySessionStats();
    endlessRunTotal = 0;
    endlessRunWrong = 0;
    dailySequence = [];
    dailyIndex = 0;
    dailyCorrect = 0;
    dailyWrong = 0;
    dailyStartTime = 0;
    stopTrialTimer();

    rebuildCharMap();
    ensureDataObjects();
    buildModifierButtons();
    buildOptionButtons();
    buildRows("rowOptions", hiraganaRows, "hiraganaRows", "h_");
    buildRows("katakanaRowOptions", katakanaRows, "katakanaRows", "k_");
    applyPanelStates();
    updateTrialConfigVisibility();
    updateTopStats();
    if (DEBUG_PANEL) renderDebugPanel();
    renderHeatmap();
    renderScoreHistory();
    showIdleState();
    saveAll();
}

confirmImportBtn.addEventListener("click", () => {
    try {
        const raw = importTextarea.value.trim();
        if (!raw) {
            alert("Paste save data first, or choose a file.");
            return;
        }

        const payload = JSON.parse(raw);
        applyImportedData(payload);
        closeImportModal();
        alert("Save data imported.");
    } catch {
        alert("Import failed. Make sure the JSON is valid.");
    }
});

if (resetBtn) resetBtn.addEventListener("click", () => {
    const confirmed = confirm("Reset all stats, timing, SRS progress, session history, and high score tables?");
    if (!confirmed) return;

    stats = {};
    times = {};
    srs = {};
    scoreHistory = createDefaultScoreHistory();
    dailyChallengeHistory = {};
    highScore = 0;
    streak = 0;
    sessionStarted = false;
    sessionStats = createEmptySessionStats();
    endlessRunTotal = 0;
    endlessRunWrong = 0;
    dailySequence = [];
    dailyIndex = 0;
    dailyCorrect = 0;
    dailyWrong = 0;
    dailyStartTime = 0;
    stopTrialTimer();

    window.ModeAtlasStorage.removeMany([
        "charStats",
        "charTimes",
        "charSrs",
        "scoreHistory",
        "dailyChallengeHistory",
        "highScore",
        TEST_RESULTS_STORAGE_KEY,
        TEST_RESULTS_STORAGE_BACKUP_KEY,
        TEST_RESULTS_UPDATED_AT_KEY
    ]);

    rebuildCharMap();
    ensureDataObjects();
    updateTopStats();
    if (DEBUG_PANEL) renderDebugPanel();
    renderHeatmap();
    renderScoreHistory();
    saveAll();

    sessionModalBackdrop.classList.remove("open");
    importModalBackdrop.classList.remove("open");
    gameOverEl.style.display = "none";
    showIdleState();
    onSettingsChanged();
});

if (modifiersContentEl && !modifiersContentEl.dataset.maClickGuard) {
    modifiersContentEl.dataset.maClickGuard = "true";
    modifiersContentEl.addEventListener("click", (event) => event.stopPropagation());
}
modifiersTabEl.addEventListener("click", () => setBottomTab("modifiers"));
if (optionsTabEl) optionsTabEl.addEventListener("click", () => setBottomTab("options"));

statsHeaderEl.addEventListener("click", () => {
    settings.statsVisible = !settings.statsVisible;
    applyPanelStates();
    saveAll();
});

scoresHeaderEl.addEventListener("click", () => {
    settings.scoresVisible = !settings.scoresVisible;
    applyPanelStates();
    saveAll();
});

function refreshSaveBackedStateFromCloud() {
    const preservedBottomTab = (settings && settings.activeBottomTab === "modifiers") || document.getElementById("modifiersContent")?.classList.contains("open") ? "modifiers" : null;
    settings = { ...DEFAULT_SETTINGS, ...loadJSON("settings", DEFAULT_SETTINGS) };
    settings.activeBottomTab = preservedBottomTab;
    stats = loadJSON("charStats", {});
    times = loadJSON("charTimes", {});
    srs = loadJSON("charSrs", {});
    scoreHistory = normalizeScoreHistory(loadJSON("scoreHistory", createDefaultScoreHistory()));
    dailyChallengeHistory = loadJSON("dailyChallengeHistory", {});
    highScore = window.ModeAtlasStorage.number("highScore", 0);
    if (!Array.isArray(settings.hiraganaRows)) settings.hiraganaRows = Object.keys(hiraganaRows);
    if (!Array.isArray(settings.katakanaRows)) settings.katakanaRows = [];
    if (!["same_row", "random"].includes(settings.comboMode)) settings.comboMode = "random";
    rebuildCharMap();
    ensureDataObjects();
    buildModifierButtons();
    buildOptionButtons();
    buildRows("rowOptions", hiraganaRows, "hiraganaRows", "h_");
    buildRows("katakanaRowOptions", katakanaRows, "katakanaRows", "k_");
    applyPanelStates();
    updateTrialConfigVisibility();
    updateTopStats();
    renderHeatmap();
    renderScoreHistory();
    if (!sessionStarted) showIdleState();
    if (DEBUG_PANEL) renderDebugPanel();
}

window.refreshSaveBackedStateFromCloud = refreshSaveBackedStateFromCloud;

function init() {
    rebuildCharMap();

    if (!Array.isArray(settings.hiraganaRows)) settings.hiraganaRows = Object.keys(hiraganaRows);
    if (!Array.isArray(settings.katakanaRows)) settings.katakanaRows = [];
    if (!["same_row", "random"].includes(settings.comboMode)) settings.comboMode = "random";
    scoreHistory = normalizeScoreHistory(scoreHistory);

    ensureDataObjects();
    buildModifierButtons();
    buildOptionButtons();
    buildRows("rowOptions", hiraganaRows, "hiraganaRows", "h_");
    buildRows("katakanaRowOptions", katakanaRows, "katakanaRows", "k_");
    applyPanelStates();
    updateTrialConfigVisibility();
    updateTopStats();
    if (DEBUG_PANEL) renderDebugPanel();
    renderHeatmap();
    renderScoreHistory();
    showIdleState();
    // Do not save during initial boot; wait for actual user changes.
}

function hydrateAndRefreshTrainer() {
    const doRefresh = () => {
        try { refreshSaveBackedStateFromCloud(); }
        catch (err) { console.warn("Trainer refresh failed", err); }
    };
    if (window.KanaCloudSync?.hydrateFromCloud) {
        window.KanaCloudSync.hydrateFromCloud().then(doRefresh).catch(doRefresh);
    } else if (window.KanaCloudSync?.beforePageLoad) {
        window.KanaCloudSync.beforePageLoad().then(doRefresh).catch(doRefresh);
    } else {
        doRefresh();
    }
}
window.addEventListener("focus", hydrateAndRefreshTrainer);
window.addEventListener("pageshow", () => setTimeout(hydrateAndRefreshTrainer, 120));
setTimeout(hydrateAndRefreshTrainer, 700);
/* ModeAtlas trainer late cloud refresh repair */
setTimeout(hydrateAndRefreshTrainer, 1500);
setTimeout(hydrateAndRefreshTrainer, 3000);
setTimeout(hydrateAndRefreshTrainer, 6000);

init();
