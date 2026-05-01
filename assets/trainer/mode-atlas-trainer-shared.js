/* Shared trainer helpers used by Reading and Writing practice. */

function createEmptySessionStats() {
    return {
        active: false,
        startTime: null,
        endTime: null,
        answered: 0,
        correct: 0,
        wrong: 0,
        bestStreak: 0,
        timings: [],
        perChar: {}
    };
}

function loadJSON(key, fallback) {
    try {
        return window.ModeAtlasStorage.json(key, fallback);
    } catch {
        return fallback;
    }
}

function formatDuration(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return "0 ms";
    if (ms < 1000) return `${Math.round(ms)} ms`;
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)} seconds`;
    const minutes = seconds / 60;
    if (minutes < 60) return `${minutes.toFixed(1)} minutes`;
    const hours = minutes / 60;
    return `${hours.toFixed(1)} hours`;
}

function formatCountdown(ms) {
    if (ms <= 0) return "0.0s";
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = seconds / 60;
    return `${minutes.toFixed(1)}m`;
}

function normalizeLegacyRowSelection() {
    // Older saves used settings.rows like ["a", "ka"]. Keep those saves readable without
    // forcing hidden rows into the heatmap. Only migrate when the newer row arrays are absent.
    const legacyRows = Array.isArray(settings.rows) ? settings.rows : [];
    if (!legacyRows.length) return;

    if ((!Array.isArray(settings.hiraganaRows) || settings.hiraganaRows.length === 0) &&
        (!Array.isArray(settings.katakanaRows) || settings.katakanaRows.length === 0)) {
        const hira = legacyRows.map(row => `h_${row}`).filter(row => hiraganaRows[row]);
        if (hira.length) settings.hiraganaRows = hira;
    }
}

function createDefaultScoreHistory() {
    return {
        endlessBest: { total: 0, correct: 0, wrong: 0 },
        comboKanaBest: { same_row: 0, random: 0 },
        timeTrialTop3: []
    };
}

function normalizeScoreHistory(data) {
    const defaults = createDefaultScoreHistory();
    return {
        ...defaults,
        ...(data || {}),
        endlessBest: { ...defaults.endlessBest, ...((data || {}).endlessBest || {}) },
        comboKanaBest: { ...defaults.comboKanaBest, ...((data || {}).comboKanaBest || {}) },
        timeTrialTop3: Array.isArray((data || {}).timeTrialTop3) ? data.timeTrialTop3 : []
    };
}

function setRetryButtonVisible(visible) {
    retryBtn.style.display = visible ? "inline-block" : "none";
}

function rebuildCharMap() {
    charMap = {};

    for (const row of settings.hiraganaRows.filter(r => hiraganaRows[r])) {
        Object.assign(charMap, hiraganaRows[row]);
        if (settings.dakuten && dakutenRows[row]) Object.assign(charMap, dakutenRows[row]);
        if (settings.yoon && yoonRows[row]) Object.assign(charMap, yoonRows[row]);
        if (settings.yoon && settings.dakuten && yoonRows[`${row}_dakuten`]) Object.assign(charMap, yoonRows[`${row}_dakuten`]);
        if (settings.extendedKatakana && extendedKatakanaRows[row]) Object.assign(charMap, extendedKatakanaRows[row]);
    }

    for (const row of settings.katakanaRows.filter(r => katakanaRows[r])) {
        Object.assign(charMap, katakanaRows[row]);
        if (settings.dakuten && dakutenRows[row]) Object.assign(charMap, dakutenRows[row]);
        if (settings.yoon && yoonRows[row]) Object.assign(charMap, yoonRows[row]);
        if (settings.yoon && settings.dakuten && yoonRows[`${row}_dakuten`]) Object.assign(charMap, yoonRows[`${row}_dakuten`]);
        if (settings.extendedKatakana && extendedKatakanaRows[row]) Object.assign(charMap, extendedKatakanaRows[row]);
    }

    activeChars = Object.keys(charMap);
}

function ensureDataObjects() {
    rebuildCharMap();

    for (const ch of activeChars) {
        if (!stats[ch]) stats[ch] = { correct: 0, wrong: 0 };
        if (!times[ch]) times[ch] = { avg: 1200, count: 0 };
        if (!srs[ch]) srs[ch] = { level: 0, due: 0, lastSeen: 0, lastWrong: 0 };
    }
}

function getAverageTime(char) { return times[char]?.avg ?? 1200; }

function getStats(char) { return stats[char] ?? { correct: 0, wrong: 0 }; }

function getSrs(char) { return srs[char] ?? { level: 0, due: 0, lastSeen: 0, lastWrong: 0 }; }

function getTodayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function hashStringSeed(input) {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function createSeededRng(seedString) {
    let seed = hashStringSeed(seedString) || 1;
    return () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
    };
}

function getTodayDailyRecord() {
    return dailyChallengeHistory[getTodayKey()] || null;
}

function isDailyChallengeSession() {
    return !!settings.dailyChallenge;
}

function isTestModeSession() {
    return !!settings.testMode;
}

function getTestModePoolMap() {
    const pool = { ...TEST_MODE_BASE_CHAR_MAP };

    if (settings.dakuten) {
        Object.assign(pool, ...Object.values(dakutenRows));
    }

    if (settings.yoon) {
        Object.entries(yoonRows).forEach(([key, value]) => {
            if (!key.endsWith("_dakuten")) Object.assign(pool, value);
        });
        if (settings.dakuten) {
            Object.entries(yoonRows).forEach(([key, value]) => {
                if (key.endsWith("_dakuten")) Object.assign(pool, value);
            });
        }
    }

    if (settings.extendedKatakana) {
        Object.assign(pool, ...Object.values(extendedKatakanaRows));
    }

    return pool;
}

function buildTestSequence() {
    const pool = Object.keys(getTestModePoolMap());
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
}

function getAnswerMapForCurrentMode() {
    if (isDailyChallengeSession()) return DAILY_CHALLENGE_CHAR_MAP;
    if (isTestModeSession()) return getTestModePoolMap();
    return charMap;
}

function formatDailyHistoryTime(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return "—";
    return `${(ms / 1000).toFixed(1)}s`;
}

function renderDailyChallengeHistory() {
    const entries = Object.entries(dailyChallengeHistory || {})
        .filter(([dateKey, record]) => dateKey !== getTodayKey() && record && Number.isFinite(record.officialScore))
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 7);

    if (!entries.length) {
        dailyHistoryListEl.innerHTML = `<div class="score-row"><span>No history yet</span><span>—</span></div>`;
        return;
    }

    dailyHistoryListEl.innerHTML = entries.map(([dateKey, record]) => `
        <div class="score-row">
            <span>${dateKey}</span>
            <span>${record.officialScore}/${record.total} · ${formatDailyHistoryTime(record.timeMs)}</span>
        </div>
    `).join("");
}

function renderDailyChallengeSummary() {
    const todayRecord = getTodayDailyRecord();
    dailyTodayScoreEl.textContent = todayRecord ? `${todayRecord.officialScore}/${todayRecord.total}` : "—";
    dailyTodayAttemptsEl.textContent = todayRecord ? (todayRecord.attempts || 1) : "0";
    renderDailyChallengeHistory();
}

function updateTopStats() {
    streakEl.textContent = streak;
    highScoreEl.textContent = highScore;
    endlessTotalEl.textContent = endlessRunTotal;
    endlessWrongEl.textContent = endlessRunWrong;

    const showContinuous = (settings.endless || settings.timeTrial) && sessionStarted && !isDailyChallengeSession();
    endlessTotalPill.style.display = showContinuous ? "inline-block" : "none";
    endlessWrongPill.style.display = showContinuous ? "inline-block" : "none";

    const showTrial = settings.timeTrial && sessionStarted && !isDailyChallengeSession();
    trialTimerPill.style.display = showTrial ? "inline-block" : "none";

    updateDailyChallengePills();
    applyDailyChallengeTheme();
}

function renderScoreHistory() {
    scoreHistory = normalizeScoreHistory(scoreHistory);
    bestEndlessTotalEl.textContent = scoreHistory.endlessBest.total || 0;
    bestEndlessCorrectEl.textContent = scoreHistory.endlessBest.correct || 0;
    bestEndlessWrongEl.textContent = scoreHistory.endlessBest.wrong || 0;
    comboSameRowBestEl.textContent = scoreHistory.comboKanaBest.same_row || 0;
    comboRandomBestEl.textContent = scoreHistory.comboKanaBest.random || 0;
    renderDailyChallengeSummary();

    const list = scoreHistory.timeTrialTop3 || [];
    if (!list.length) {
        timeTrialTop3El.innerHTML = `<div class="score-row"><span>No scores yet</span><span>—</span></div>`;
        return;
    }

    timeTrialTop3El.innerHTML = list.map((entry, index) => `
        <div class="score-row">
            <span>#${index + 1}</span>
            <span>${entry.time}m / T${entry.target} / S${entry.score}</span>
        </div>
    `).join("");
}

function updateTrialConfigVisibility() {
    trialConfigEl.style.display = settings.timeTrial && !settings.dailyChallenge && !settings.testMode ? "flex" : "none";
    comboConfigEl.style.display = settings.comboKana && !settings.dailyChallenge && !settings.testMode ? "flex" : "none";
    comboSameRowBtn.classList.toggle("active", settings.comboMode === "same_row");
    comboRandomBtn.classList.toggle("active", settings.comboMode === "random");
    comboSameRowBtn.classList.remove("btn-secondary");
    comboRandomBtn.classList.remove("btn-secondary");
    comboSameRowBtn.disabled = sessionStarted;
    comboRandomBtn.disabled = sessionStarted;
}

function setBottomTab(tabName) {
    settings.activeBottomTab = settings.activeBottomTab === tabName ? null : tabName;
    applyPanelStates();
    // Drawer open/close is UI-only; do not mark cloud data updated or save over hydrated stats.
    window.ModeAtlasStorage.setJSON("settings", settings);
}

function isModeLocked() { return sessionStarted; }

function makeToggleButton(label, active, onClick, disabled = false) {
    const div = document.createElement("div");
    div.className = "toggle-btn" + (active ? " active" : "") + (disabled ? " disabled" : "");
    div.textContent = label;
    div.setAttribute("role", "button");
    div.setAttribute("tabindex", disabled ? "-1" : "0");
    div.setAttribute("aria-pressed", active ? "true" : "false");
    div.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (disabled) return;
        onClick();
        requestAnimationFrame(() => {
          document.querySelectorAll(".bottom-shell.ma-modifiers-only .toggle-btn[aria-pressed=\"true\"], .bottom-shell.ma-modifiers-only .btn.active").forEach(el => el.classList.add("active"));
        });
    };
    div.onkeydown = (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        div.click();
    };
    return div;
}

function buildModifierButtons() {
    const modes = [
        ["hint", "Hint Mode"],
        ["srs", "SRS Mode"],
        ["endless", "Endless Mode"],
        ["timeTrial", "Time Trial Mode"],
        ["dailyChallenge", "Daily Challenge"],
        ["testMode", "Test Mode"],
        ["comboKana", "Combo Kana Mode"],
        ["focusWeak", "Focus Weak"],
        ["dakuten", "Dakuten"],
        ["yoon", "Yōon"],
        ["extendedKatakana", "Extended Katakana"],
        ["confusableKana", "Confusable Kana"]
    ];

    const container = document.getElementById("modifierOptions");
    container.innerHTML = "";
    const lockedModes = isModeLocked();

    for (const [key, label] of modes) {
        const btn = makeToggleButton(label, settings[key], () => {
            if (key === "timeTrial") {
                settings.timeTrial = !settings.timeTrial;
                if (settings.timeTrial) {
                    settings.endless = false;
                    settings.dailyChallenge = false;
                    settings.testMode = false;
                }
            } else if (key === "endless") {
                settings.endless = !settings.endless;
                if (settings.endless) {
                    settings.timeTrial = false;
                    settings.dailyChallenge = false;
                    settings.testMode = false;
                }
            } else if (key === "dailyChallenge") {
                settings.dailyChallenge = !settings.dailyChallenge;
                if (settings.dailyChallenge) {
                    settings.timeTrial = false;
                    settings.endless = false;
                    settings.testMode = false;
                    settings.comboKana = false;
                    settings.hint = false;
                }
            } else if (key === "testMode") {
                settings.testMode = !settings.testMode;
                if (settings.testMode) {
                    settings.timeTrial = false;
                    settings.endless = false;
                    settings.dailyChallenge = false;
                    settings.comboKana = false;
                    settings.hint = false;
                }
            } else if (key === "comboKana") {
                settings.comboKana = !settings.comboKana;
                if (settings.comboKana) {
                    settings.dailyChallenge = false;
                    settings.testMode = false;
                }
            } else {
                settings[key] = !settings[key];
            }
            updateTrialConfigVisibility();
            updateTopStats();
    if (DEBUG_PANEL) renderDebugPanel();
            onSettingsChanged();
        }, lockedModes);
        container.appendChild(btn);
    }
}

function buildOptionButtons() { /* Options menu removed; SRS now lives in Modifiers. */ }

function buildRows(containerId, sourceRows, selectedRowsKey, displayPrefix) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    const lockedModes = isModeLocked();

    for (const row of Object.keys(sourceRows)) {
        const label = row.replace(displayPrefix, "");
        const isSelected = Array.isArray(settings[selectedRowsKey]) && settings[selectedRowsKey].includes(row);
        const btn = makeToggleButton(label, isSelected, () => {
            const arr = Array.isArray(settings[selectedRowsKey]) ? settings[selectedRowsKey] : [];
            if (arr.includes(row)) {
                settings[selectedRowsKey] = arr.filter(r => r !== row);
            } else {
                settings[selectedRowsKey] = [...arr, row];
            }
            onSettingsChanged();
        }, lockedModes);
        btn.dataset.rowKey = row;
        btn.dataset.rowGroup = selectedRowsKey;
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        btn.classList.toggle('active', isSelected);
        container.appendChild(btn);
    }
}

function heatmapColor(char) {
    const { correct, wrong } = getStats(char);
    const total = correct + wrong;
    if (total === 0) return "var(--neutral)";
    if (wrong > correct) return "var(--red)";
    if (correct > wrong) return "var(--green)";
    return "var(--yellow)";
}

function showPopupForChar(ch, e) {
    debugActiveChar = ch;
    if (DEBUG_PANEL) renderDebugPanel();
    const st = getStats(ch);
    const tm = getAverageTime(ch);
    const sr = getSrs(ch);

    popupEl.innerHTML = `
        <div class="popup-title">${ch}</div>
        <div>Romaji: ${getAnswerMapForCurrentMode()[ch] || "—"}</div>
        <div>Right: ${st.correct}</div>
        <div>Wrong: ${st.wrong}</div>
        <div>Avg time: ${formatDuration(tm)}</div>
        <div>SRS level: ${sr.level}</div>
    `;

    popupEl.style.display = "block";

    if (settings.mobileMode) {
        popupEl.style.left = "50%";
        popupEl.style.top = "50%";
        popupEl.style.transform = "translate(-50%, -50%)";
    } else {
        popupEl.style.transform = "none";
        const x = Math.min(window.innerWidth - 180, e.clientX + 10);
        const y = Math.min(window.innerHeight - 120, e.clientY + 10);
        popupEl.style.left = x + "px";
        popupEl.style.top = y + "px";
    }
}

function getHeatmapCharsForDisplay() {
    // Old behaviour restored: the Stats heatmap only shows currently selected rows.
    // Saved stats/times are used for those visible kana, but they do not make hidden rows appear.
    const out = [];
    const addMap = (map) => {
        if (!map) return;
        for (const ch of Object.keys(map)) {
            if (!out.includes(ch)) out.push(ch);
        }
    };
    const selectedHira = Array.isArray(settings.hiraganaRows) ? settings.hiraganaRows.filter(r => hiraganaRows[r]) : [];
    const selectedKata = Array.isArray(settings.katakanaRows) ? settings.katakanaRows.filter(r => katakanaRows[r]) : [];

    for (const row of selectedHira) {
        addMap(hiraganaRows[row]);
        if (settings.dakuten) addMap(dakutenRows[row]);
        if (settings.yoon) addMap(yoonRows[row]);
        if (settings.yoon && settings.dakuten) addMap(yoonRows[`${row}_dakuten`]);
        if (settings.extendedKatakana) addMap(extendedKatakanaRows[row]);
    }

    for (const row of selectedKata) {
        addMap(katakanaRows[row]);
        if (settings.dakuten) addMap(dakutenRows[row]);
        if (settings.yoon) addMap(yoonRows[row]);
        if (settings.yoon && settings.dakuten) addMap(yoonRows[`${row}_dakuten`]);
        if (settings.extendedKatakana) addMap(extendedKatakanaRows[row]);
    }

    return out;
}

function renderHeatmap() {
    heatmapEl.innerHTML = "";

    const heatmapChars = typeof getHeatmapCharsForDisplay === "function"
        ? getHeatmapCharsForDisplay()
        : activeChars;

    for (const ch of heatmapChars) {
        const cell = document.createElement("div");
        cell.className = "cell";
        if (String(ch).length > 1) cell.classList.add("combo");
        cell.textContent = ch;
        cell.style.background = heatmapColor(ch);

        cell.addEventListener("mouseenter", (e) => {
            hoveredCell = cell;
            if (!popupLocked) showPopupForChar(ch, e);
        });

        cell.addEventListener("mousemove", (e) => {
            if (!popupLocked && hoveredCell === cell) showPopupForChar(ch, e);
        });

        cell.addEventListener("mouseleave", () => {
            if (hoveredCell === cell) hoveredCell = null;
            if (!popupLocked) closePopup();
        });

        cell.addEventListener("click", (e) => {
            e.stopPropagation();
            popupLocked = true;
            hoveredCell = cell;
            showPopupForChar(ch, e);
        });

        heatmapEl.appendChild(cell);
    }
}

function closePopup() {
    popupEl.style.display = "none";
}

function getEligiblePool() {
    let pool = [...activeChars];
    if (settings.confusableKana) {
        const confusableSet = new Set(["シ","ツ","ソ","ン","ぬ","め","れ","わ","ね","ク","ケ","タ","ナ","メ"]);
        const focused = pool.filter(ch => confusableSet.has(ch));
        if (focused.length > 0) pool = focused;
    }
    if (pool.length === 0) return [];

    if (settings.srs) {
        const now = Date.now();
        const duePool = pool.filter(ch => getSrs(ch).due <= now);
        if (duePool.length > 0) pool = duePool;
    }

    return pool;
}

function closeDebugPanel() {
    const panel = document.getElementById('srsDebugPanel');
    if (panel) panel.remove();
    DEBUG_PANEL = null;
}

function clearHint() {
    clearTimeout(hintTimeout);
    hintEl.textContent = "";
}

function getComboLength() {
    if (!settings.comboKana) return 1;
    if (streak >= 25) return 4;
    if (streak >= 10) return 3;
    return 2;
}

function getComboTierLabel(length) {
    return `${length} Kana Combo`;
}

function hideComboTierNotice() {
    clearTimeout(comboTierNoticeTimeout);
    comboTierNoticeEl.textContent = "";
    comboTierNoticeEl.classList.remove("show");
}

function showComboTierNotice(length) {
    if (!settings.comboKana || !sessionStarted || length <= 1) return;
    clearTimeout(comboTierNoticeTimeout);
    comboTierNoticeEl.textContent = `Tier up! ${getComboTierLabel(length)}`;
    comboTierNoticeEl.classList.add("show");
    comboTierNoticeTimeout = setTimeout(() => {
        comboTierNoticeEl.classList.remove("show");
    }, 1600);
}

function startTrialTimer(durationMinutes) {
    stopTrialTimer();
    trialEndTime = Date.now() + durationMinutes * 60 * 1000;
    trialTimerPill.style.display = "inline-block";

    const tick = () => {
        const remaining = Math.max(0, trialEndTime - Date.now());
        trialTimerEl.textContent = formatCountdown(remaining);
        if (remaining <= 0) {
            stopTrialTimer();
            endSession(true);
        }
    };

    tick();
    trialTimerId = setInterval(tick, 100);
}

function stopTrialTimer() {
    if (trialTimerId) {
        clearInterval(trialTimerId);
        trialTimerId = null;
    }
    trialTimerPill.style.display = "none";
}

function updateAverageTime(char, timeTaken) {
    const entry = times[char] || { avg: 1200, count: 0 };
    entry.avg = Math.round((entry.avg * entry.count + timeTaken) / (entry.count + 1));
    entry.count += 1;
    times[char] = entry;
}

function updateSrsWrong(char) {
    const entry = srs[char] || { level: 0, due: 0, lastSeen: 0, lastWrong: 0 };
    entry.level = 0;
    entry.due = Date.now() + 2000;
    entry.lastSeen = Date.now();
    entry.lastWrong = Date.now();
    srs[char] = entry;
}

function updateSessionChar(char, correct, timeTaken) {
    if (!sessionStats.perChar[char]) {
        sessionStats.perChar[char] = { correct: 0, wrong: 0, times: [] };
    }
    const entry = sessionStats.perChar[char];
    if (correct) entry.correct += 1;
    else entry.wrong += 1;
    entry.times.push(timeTaken);
}

function isFinalTestQuestionCompleted() {
    return isTestModeSession() && testIndex >= testSequence.length;
}

function advanceTestModeAfterAnswer() {
    if (testIndex >= testSequence.length) {
        endTestMode();
        return;
    }
    nextCharacter();
}

function currentFlowModeIsContinuous() {
    return settings.endless || settings.timeTrial || settings.testMode;
}

function average(arr) {
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function loadStoredTestModeResults() {
    const primary = loadJSON(TEST_RESULTS_STORAGE_KEY, null);
    const backup = loadJSON(TEST_RESULTS_STORAGE_BACKUP_KEY, null);
    if (Array.isArray(primary)) return normalizeStoredTestModeResults(primary);
    if (Array.isArray(backup)) return normalizeStoredTestModeResults(backup);
    return [];
}

function buildTestModeBreakdown() {
    const result = {
        hiragana: { correct: 0, wrong: 0 },
        katakana: { correct: 0, wrong: 0 }
    };

    Object.entries(sessionStats.perChar || {}).forEach(([char, data]) => {
        const isHiragana = /[ぁ-ゖゝゞ]/.test(char);
        const isKatakana = /[ァ-ヺヽヾ]/.test(char);
        if (isHiragana) {
            result.hiragana.correct += data.correct || 0;
            result.hiragana.wrong += data.wrong || 0;
        } else if (isKatakana) {
            result.katakana.correct += data.correct || 0;
            result.katakana.wrong += data.wrong || 0;
        }
    });

    return result;
}

function buildTestModeKanaResults() {
    const sourceMap = getTestModePoolMap();
    const out = {};
    Object.keys(sourceMap).forEach(char => {
        const data = sessionStats.perChar[char] || { correct: 0, wrong: 0, times: [] };
        out[char] = {
            romaji: sourceMap[char] || "",
            correct: Number(data.correct || 0),
            wrong: Number(data.wrong || 0),
            avgMs: data.times && data.times.length ? Math.round(average(data.times)) : 0
        };
    });
    return out;
}

function getSessionDifficultyLists() {
    const entries = Object.entries(sessionStats.perChar).map(([char, data]) => {
        const attempts = data.correct + data.wrong;
        const accuracy = attempts ? (data.correct / attempts) : 0;
        return {
            char,
            correct: data.correct,
            wrong: data.wrong,
            attempts,
            accuracy,
            avgTime: average(data.times)
        };
    });

    const hardest = [...entries]
        .sort((a, b) => {
            if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
            return b.wrong - a.wrong;
        })
        .slice(0, 5);

    const easiest = [...entries]
        .sort((a, b) => {
            if (a.accuracy !== b.accuracy) return b.accuracy - a.accuracy;
            return a.avgTime - b.avgTime;
        })
        .slice(0, 5);

    return { hardest, easiest };
}

function renderSessionList(container, title, items) {
    if (!items.length) {
        container.style.display = "none";
        container.innerHTML = "";
        return;
    }

    container.style.display = "block";
    container.innerHTML =
        `<h3>${title}</h3>` +
        items.map(item => `
            <div class="session-list-item">
                <span>${item.char}</span>
                <span>${item.correct}✓ / ${item.wrong}✗</span>
            </div>
        `).join("");
}

function openImportModal() {
    importTextarea.value = "";
    importModalBackdrop.classList.add("open");
}

function closeImportModal() {
    importModalBackdrop.classList.remove("open");
}
