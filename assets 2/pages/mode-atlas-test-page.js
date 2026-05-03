(function ModeAtlasTestPage(){
  async function start(){
    try {
      if (window.KanaCloudSync && typeof window.KanaCloudSync.beforePageLoad === 'function') {
        await window.KanaCloudSync.beforePageLoad();
      }
    } catch (err) {
      console.warn('KanaCloudSync beforePageLoad failed', err);
    }
    init();
  }

  function init(){
window.KanaCloudSync?.bindUi?.({
    signInBtn: document.getElementById('profileSignInBtn'),
    signOutBtn: document.getElementById('profileSignOutBtn'),
    statusEl: document.getElementById('profileStatus'),
    nameEl: document.getElementById('profileName'),
    emailEl: document.getElementById('profileEmail'),
    photoEl: document.getElementById('profileAvatar')
});
const profileDot = document.getElementById('profileDot');
window.KanaCloudSync?.ready?.then(() => {
    const user = window.KanaCloudSync?.getUser?.();
    if (user?.photoURL && profileDot) profileDot.innerHTML = `<img src="${user.photoURL}" alt="" />`;
});

const ResultsUI = window.ModeAtlasResultsUI || {};
const REGULAR_ROW_GROUPS = ResultsUI.REGULAR_ROW_GROUPS || [];
const SPECIAL_ROW_GROUPS = ResultsUI.SPECIAL_ROW_GROUPS || [];
const ROW_GROUPS = ResultsUI.ROW_GROUPS || REGULAR_ROW_GROUPS;
const SPECIAL_CHAR_SET = ResultsUI.SPECIAL_CHAR_SET || new Set();
const computeRowPerformance = ResultsUI.computeRowPerformance || (() => ({ rows: [], hiragana: [], katakana: [] }));
const getRowCellExtremes = ResultsUI.getRowCellExtremes || (() => new Map());
const rowNeedsErrorStyling = ResultsUI.rowNeedsErrorStyling || ((row) => !!row && Number(row.wrong || 0) > 0);
const renderRowPerformance = ResultsUI.renderRowPerformance || (() => "");
const formatDuration = ResultsUI.formatDuration || (() => "—");
const normalizeTestResult = ResultsUI.normalizeTestResult || (() => null);
const buildAverageResult = ResultsUI.buildAverageResult || (() => null);

const READING_TEST_KEYS = window.ModeAtlasResultsStorage.keys("reading");
const WRITING_TEST_KEYS = window.ModeAtlasResultsStorage.keys("writing");
const READING_TEST_RESULTS_STORAGE_KEY = READING_TEST_KEYS.primary;
const READING_TEST_RESULTS_STORAGE_BACKUP_KEY = READING_TEST_KEYS.backup;
const READING_TEST_RESULTS_UPDATED_AT_KEY = READING_TEST_KEYS.updatedAt;
const READING_TEST_RESULTS_ALT_STORAGE_KEY = READING_TEST_KEYS.altPrimary;
const READING_TEST_RESULTS_ALT_STORAGE_BACKUP_KEY = READING_TEST_KEYS.altBackup;
const READING_TEST_RESULTS_ALT_UPDATED_AT_KEY = READING_TEST_KEYS.altUpdatedAt;
const WRITING_TEST_RESULTS_STORAGE_KEY = WRITING_TEST_KEYS.primary;
const WRITING_TEST_RESULTS_STORAGE_BACKUP_KEY = WRITING_TEST_KEYS.backup;
const WRITING_TEST_RESULTS_UPDATED_AT_KEY = WRITING_TEST_KEYS.updatedAt;

function loadModeResultsFromKeys(keys, expectedMode) {
    if (window.ModeAtlasResultsEngine?.loadModeResultsFromKeys) {
        return window.ModeAtlasResultsEngine.loadModeResultsFromKeys(keys, expectedMode, normalizeTestResult);
    }
    return [];
}

function parseStoredResultTimestamp(result) {
    return window.ModeAtlasResultsEngine?.parseStoredResultTimestamp?.(result) || 0;
}

function loadStoredResults() {
    if (window.ModeAtlasResultsEngine?.loadStoredResults) {
        return window.ModeAtlasResultsEngine.loadStoredResults({
            readingKeys: [
                READING_TEST_RESULTS_STORAGE_KEY,
                READING_TEST_RESULTS_STORAGE_BACKUP_KEY,
                READING_TEST_RESULTS_ALT_STORAGE_KEY,
                READING_TEST_RESULTS_ALT_STORAGE_BACKUP_KEY
            ],
            writingKeys: [
                WRITING_TEST_RESULTS_STORAGE_KEY,
                WRITING_TEST_RESULTS_STORAGE_BACKUP_KEY,
                READING_TEST_RESULTS_STORAGE_KEY,
                READING_TEST_RESULTS_STORAGE_BACKUP_KEY,
                READING_TEST_RESULTS_ALT_STORAGE_KEY,
                READING_TEST_RESULTS_ALT_STORAGE_BACKUP_KEY
            ],
            normalizeTestResult,
            buildAverageResult
        });
    }
    return [];
}

let STORED_RESULTS = loadStoredResults();

let selectedResultId = STORED_RESULTS[0]?.id || null;
let selectedKana = null;
let hideUnusedKana = false;
let activeRowGraphView = "regular";

const HERO_STORED_TESTS = document.getElementById("heroStoredTests");
const HERO_BEST_SCORE = document.getElementById("heroBestScore");
const TESTS_GRID = document.getElementById("testsGrid");
const OVERALL_SCORE_CARD = document.getElementById("overallScoreCard");
const OVERALL_KICKER = document.getElementById("overallKicker");
const OVERALL_SELECTED_NAME = document.getElementById("overallSelectedName");
const OVERALL_SCORE = document.getElementById("overallScore");
const OVERALL_SUB = document.getElementById("overallSub");
const OVERALL_MODE = document.getElementById("overallMode");
const OVERALL_CORRECT = document.getElementById("overallCorrect");
const OVERALL_WRONG = document.getElementById("overallWrong");
const OVERALL_TIME = document.getElementById("overallTime");
const SNAPSHOT_BREAKDOWN = document.getElementById("snapshotBreakdown");
const ROW_PERFORMANCE_MOUNT = document.getElementById("rowPerformanceMount");
const DETAIL_TITLE = document.getElementById("detailTitle");
const DETAIL_SUB = document.getElementById("detailSub");
const DETAIL_METRICS = document.getElementById("detailMetrics");
const TEST_HEATMAP = document.getElementById("testHeatmap");
const KANA_MODAL_BACKDROP = document.getElementById("kanaModalBackdrop");
const KANA_MODAL_CLOSE = document.getElementById("kanaModalClose");
const KANA_MODAL_TITLE = document.getElementById("kanaModalTitle");
const KANA_MODAL_SUB = document.getElementById("kanaModalSub");
const KANA_MODAL_CHAR = document.getElementById("kanaModalChar");
const KANA_MODAL_ROMAJI = document.getElementById("kanaModalRomaji");
const KANA_MODAL_STATS = document.getElementById("kanaModalStats");


let DEBUG_PANEL = null;

function closeDebugPanel() {
    if (DEBUG_PANEL && DEBUG_PANEL.parentNode) {
        DEBUG_PANEL.parentNode.removeChild(DEBUG_PANEL);
    }
    DEBUG_PANEL = null;
}

function getDebugStorageKeysForMode(mode) {
    if (mode === "writing") {
        return [WRITING_TEST_RESULTS_STORAGE_KEY, WRITING_TEST_RESULTS_STORAGE_BACKUP_KEY];
    }
    return [
        READING_TEST_RESULTS_STORAGE_KEY,
        READING_TEST_RESULTS_STORAGE_BACKUP_KEY,
        READING_TEST_RESULTS_ALT_STORAGE_KEY,
        READING_TEST_RESULTS_ALT_STORAGE_BACKUP_KEY
    ];
}

function deleteStoredTest(testId, mode) {
    if (!testId) return;

    const storageKeys = [...new Set(getDebugStorageKeysForMode(mode))];
    storageKeys.forEach(key => {
        const current = loadJSON(key, []);
        if (!Array.isArray(current)) return;
        const filtered = current.filter(item => String(item?.id || "") !== String(testId));
        window.ModeAtlasStorage.setJSON(key, filtered);
    });

    STORED_RESULTS = loadStoredResults();

    if (!STORED_RESULTS.find(item => item.id === selectedResultId)) {
        selectedResultId = STORED_RESULTS[0]?.id || null;
        selectedKana = null;
    }

    renderAll();
    renderDebugPanel();
}

function getStorageKeyDebugInfo() {
    const keys = [
        READING_TEST_RESULTS_STORAGE_KEY,
        READING_TEST_RESULTS_STORAGE_BACKUP_KEY,
        READING_TEST_RESULTS_ALT_STORAGE_KEY,
        READING_TEST_RESULTS_ALT_STORAGE_BACKUP_KEY,
        WRITING_TEST_RESULTS_STORAGE_KEY,
        WRITING_TEST_RESULTS_STORAGE_BACKUP_KEY
    ];

    return [...new Set(keys)].map(key => {
        const raw = window.ModeAtlasStorage.get(key, null);
        let count = 0;
        let parseError = "";
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                count = Array.isArray(parsed) ? parsed.length : 0;
            } catch (err) {
                parseError = err && err.message ? err.message : "Invalid JSON";
            }
        }
        return {
            key,
            present: raw !== null,
            count,
            rawLength: raw ? raw.length : 0,
            parseError
        };
    });
}

function renderDebugPanel() {
    if (!DEBUG_PANEL) {
        DEBUG_PANEL = document.createElement("div");
        DEBUG_PANEL.id = "debugPanel";
        DEBUG_PANEL.style.position = "fixed";
        DEBUG_PANEL.style.right = "16px";
        DEBUG_PANEL.style.bottom = "16px";
        DEBUG_PANEL.style.zIndex = "9999";
        DEBUG_PANEL.style.width = "min(380px, calc(100vw - 32px))";
        DEBUG_PANEL.style.maxHeight = "70vh";
        DEBUG_PANEL.style.overflow = "auto";
        DEBUG_PANEL.style.padding = "14px";
        DEBUG_PANEL.style.borderRadius = "16px";
        DEBUG_PANEL.style.background = "rgba(12,12,12,0.96)";
        DEBUG_PANEL.style.border = "1px solid rgba(255,255,255,0.12)";
        DEBUG_PANEL.style.boxShadow = "0 16px 40px rgba(0,0,0,0.45)";
        DEBUG_PANEL.style.fontFamily = "Arial, sans-serif";
        DEBUG_PANEL.style.fontSize = "12px";
        DEBUG_PANEL.style.lineHeight = "1.45";
        DEBUG_PANEL.style.color = "#f3f3f3";
        document.body.appendChild(DEBUG_PANEL);
    }

    const readingResults = loadModeResultsFromKeys([
        READING_TEST_RESULTS_STORAGE_KEY,
        READING_TEST_RESULTS_STORAGE_BACKUP_KEY,
        READING_TEST_RESULTS_ALT_STORAGE_KEY,
        READING_TEST_RESULTS_ALT_STORAGE_BACKUP_KEY
    ], "reading");

    const writingResults = loadModeResultsFromKeys([
        WRITING_TEST_RESULTS_STORAGE_KEY,
        WRITING_TEST_RESULTS_STORAGE_BACKUP_KEY,
        READING_TEST_RESULTS_STORAGE_KEY,
        READING_TEST_RESULTS_STORAGE_BACKUP_KEY,
        READING_TEST_RESULTS_ALT_STORAGE_KEY,
        READING_TEST_RESULTS_ALT_STORAGE_BACKUP_KEY
    ], "writing");

    const testsOnly = STORED_RESULTS.filter(item => item.type !== "average");
    const keyInfo = getStorageKeyDebugInfo();

    DEBUG_PANEL.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px;">
            <div style="font-size:13px;font-weight:800;letter-spacing:0.04em;">Storage Debug</div>
            <button type="button" id="debugCloseBtn" style="border:1px solid rgba(255,255,255,0.14);background:#1f1f1f;color:#f3f3f3;border-radius:8px;padding:4px 9px;cursor:pointer;font-size:12px;">×</button>
        </div>

        <div style="display:grid;gap:8px;margin-bottom:12px;">
            <div><strong>Reading results:</strong> ${readingResults.length}</div>
            <div><strong>Writing results:</strong> ${writingResults.length}</div>
            <div><strong>Visible tests:</strong> ${testsOnly.length}</div>
            <div><strong>Selected:</strong> ${selectedResultId || "—"}</div>
        </div>

        <div style="margin-bottom:12px;">
            <div style="font-weight:800;margin-bottom:6px;">Storage keys</div>
            <div style="display:grid;gap:6px;">
                ${keyInfo.map(item => `
                    <div style="padding:8px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
                        <div style="font-weight:700;">${item.key}</div>
                        <div style="color:#bfbfbf;">Present: ${item.present ? "yes" : "no"} · Items: ${item.count} · Raw length: ${item.rawLength}</div>
                        ${item.parseError ? `<div style="color:#ff9b9b;">Parse error: ${item.parseError}</div>` : ""}
                    </div>
                `).join("")}
            </div>
        </div>

        <div>
            <div style="font-weight:800;margin-bottom:6px;">Delete saved tests</div>
            <div style="color:#bfbfbf;margin-bottom:8px;">Only individual saved tests can be deleted here. Overall averages stay protected.</div>
            <div style="display:grid;gap:8px;">
                ${testsOnly.length ? testsOnly.map(item => `
                    <div style="padding:8px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
                        <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">
                            <div style="min-width:0;">
                                <div style="font-weight:700;">${item.title}</div>
                                <div style="color:#bfbfbf;font-size:11px;">${item.mode === "reading" ? "Reading" : "Writing"} · ${item.date} · ${item.startedAt}</div>
                                <div style="color:#8f8f8f;font-size:10px;word-break:break-all;margin-top:3px;">${item.id}</div>
                            </div>
                            <button
                                type="button"
                                class="debug-delete-btn"
                                data-test-id="${item.id}"
                                data-test-mode="${item.mode}"
                                style="border:1px solid rgba(255,123,123,0.34);background:rgba(120,26,26,0.35);color:#ffd1d1;border-radius:8px;padding:6px 9px;cursor:pointer;font-size:11px;white-space:nowrap;"
                            >Delete</button>
                        </div>
                    </div>
                `).join("") : `<div style="padding:8px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#bfbfbf;">No individual tests to delete.</div>`}
            </div>
        </div>
    `;

    DEBUG_PANEL.querySelector("#debugCloseBtn")?.addEventListener("click", closeDebugPanel);
    DEBUG_PANEL.querySelectorAll(".debug-delete-btn").forEach(button => {
        button.addEventListener("click", () => {
            const testId = button.dataset.testId;
            const mode = button.dataset.testMode;
            deleteStoredTest(testId, mode);
        });
    });
}

window.renderDebugPanel = renderDebugPanel;
window.closeDebugPanel = closeDebugPanel;
window.deleteStoredTest = deleteStoredTest;



function summaryRow(label, value, extra = "") {
    return `
        <div class="summary-row">
            <div class="summary-main">
                <div class="summary-label">${label}</div>
                ${extra ? `<div class="summary-extra">${extra}</div>` : ""}
            </div>
            <div class="summary-value">${value}</div>
        </div>
    `;
}

function detailMetric(label, value) {
    return `
        <div class="metric">
            <div class="label">${label}</div>
            <div class="value">${value}</div>
        </div>
    `;
}

function toTitleCase(value) {
    return String(value || "")
        .replace(/[_-]+/g, " ")
        .replace(/\w/g, char => char.toUpperCase());
}

function getResultTypeLabel(result) {
    if (!result) return "—";
    if (result.type === "average") {
        return result.mode === "reading" ? "Read Avg" : "Write Avg";
    }

    if (result.inputMode === "buttons") {
        const layout = result.buttonLayout ?? result.inputVariant;
        return layout ? `Buttons - ${layout}` : "Buttons";
    }

    if (result.inputMode === "keyboard") {
        const layout = result.keyboardLayout || result.inputVariant;
        return layout ? `Keyboard - ${toTitleCase(layout)}` : "Keyboard";
    }

    return result.mode === "reading" ? "Read" : "Write";
}

function getSelectedResult() {
    return STORED_RESULTS.find(item => item.id === selectedResultId) || null;
}

function getHeatColor(result, record) {
    if (!record) return "rgba(255,255,255,0.05)";

    if (result?.type === "average") {
        const correct = Number(record.correct || 0);
        const wrong = Number(record.wrong || 0);
        const attempts = correct + wrong;
        const ratio = attempts ? (correct / attempts) : 0;

        if (ratio >= 0.75) return "rgba(103,215,139,0.32)";
        if (ratio >= 0.50) return "rgba(255,210,102,0.30)";
        return "rgba(255,123,123,0.28)";
    }

    return (record.wrong || 0) > 0 ? "rgba(255,123,123,0.28)" : "rgba(103,215,139,0.32)";
}

function renderHero() {
    const testsOnly = STORED_RESULTS.filter(item => item.type !== "average");
    const best = testsOnly.length ? testsOnly.reduce((max, item) => Math.max(max, Number(item.overallScore || 0)), 0) : 0;

    if (HERO_STORED_TESTS) HERO_STORED_TESTS.textContent = String(testsOnly.length);
    if (HERO_BEST_SCORE) HERO_BEST_SCORE.textContent = testsOnly.length ? `${best}%` : "—";
}

function getModifierTags(result) {
    return [
        result.dakuten ? "Dakuten on" : "Dakuten off",
        result.yoon ? "Yōon on" : "Yōon off",
        result.extendedKatakana ? "Extended Katakana on" : "Extended Katakana off"
    ];
}

function getModifierStateLabel(result) {
    if (result.type === "average") {
        const states = [];
        if (result.dakuten) states.push("Dakuten mixed");
        if (result.yoon) states.push("Yōon mixed");
        if (result.extendedKatakana) states.push("Extended Katakana mixed");
        return states.length ? states.join(" · ") : "Base kana only";
    }
    return getModifierTags(result).join(" · ");
}

function renderResultsList() {
    if (!STORED_RESULTS.length) {
        TESTS_GRID.innerHTML = `<div class="empty">No test results yet. Complete a test in Reading Practice or Writing Practice and it will appear here.</div>`;
        return;
    }
    TESTS_GRID.innerHTML = STORED_RESULTS.map(item => `
        <button class="test-tile ${item.mode} ${item.type === "average" ? "average" : ""} ${item.id === selectedResultId ? "active" : ""}" data-result-id="${item.id}" type="button">
            <div class="test-tile-top">
                <div>
                    <div class="test-title">${item.title}</div>
                    <div class="test-sub">${item.date} · ${item.startedAt} · ${item.kanaAsked} kana shown</div>
                </div>
                <div class="test-score">${item.overallScore}%</div>
            </div>
            <div class="tag-row">
                ${item.type === "average" ? `<span class="tag gold">Overall Average</span>` : ''}
                ${getModifierTags(item).map(tag => `<span class="tag gold">${tag}</span>`).join('')}
                <span class="tag">${item.correct} right / ${item.wrong} wrong</span>
            </div>
        </button>
    `).join("");

    TESTS_GRID.querySelectorAll(".test-tile").forEach(button => {
        button.addEventListener("click", () => {
            selectedResultId = button.dataset.resultId;
            selectedKana = null;
            renderAll();
        });
    });
}

function renderSnapshot(result) {
    OVERALL_KICKER.textContent = result.type === "average" ? "Selected overall average" : "Selected test score";
    OVERALL_SELECTED_NAME.textContent = result.title;
    OVERALL_SCORE.textContent = `${result.overallScore}%`;
    OVERALL_SUB.textContent = result.notes;
    OVERALL_MODE.textContent = getResultTypeLabel(result);
    OVERALL_CORRECT.textContent = result.correct;
    OVERALL_WRONG.textContent = result.wrong;
    OVERALL_TIME.textContent = formatDuration(result.durationMs);

    OVERALL_SCORE_CARD.classList.remove("reading", "writing", "average");
    if (result.type === "average") {
        OVERALL_SCORE_CARD.classList.add("average");
    } else if (result.mode === "reading") {
        OVERALL_SCORE_CARD.classList.add("reading");
    } else {
        OVERALL_SCORE_CARD.classList.add("writing");
    }

    ROW_PERFORMANCE_MOUNT.innerHTML = renderRowPerformance(result, activeRowGraphView);

    SNAPSHOT_BREAKDOWN.innerHTML = [
        `
            <div class="mega-inline-card">
                <div class="label">Hiragana</div>
                <div class="value">${result.breakdown.hiragana.correct} / ${result.breakdown.hiragana.correct + result.breakdown.hiragana.wrong}</div>
            </div>
        `,
        `
            <div class="mega-inline-card">
                <div class="label">Katakana</div>
                <div class="value">${result.breakdown.katakana.correct} / ${result.breakdown.katakana.correct + result.breakdown.katakana.wrong}</div>
            </div>
        `,
        `
            <div class="mega-inline-card">
                <div class="label">Dakuten</div>
                <div class="value">${result.type === "average" ? (result.dakuten ? "Mixed" : "Off") : (result.dakuten ? "On" : "Off")}</div>
            </div>
        `,
        `
            <div class="mega-inline-card">
                <div class="label">Yōon</div>
                <div class="value">${result.type === "average" ? (result.yoon ? "Mixed" : "Off") : (result.yoon ? "On" : "Off")}</div>
            </div>
        `,
        `
            <div class="mega-inline-card">
                <div class="label">Ext. Katakana</div>
                <div class="value">${result.type === "average" ? (result.extendedKatakana ? "Mixed" : "Off") : (result.extendedKatakana ? "On" : "Off")}</div>
            </div>
        `,
        `
            <div class="mega-inline-card">
                <div class="label">Kana shown</div>
                <div class="value">${result.kanaAsked}</div>
            </div>
        `
    ].join("");
}

function renderDetailHeader(result) {
    DETAIL_TITLE.textContent = result.title;
    DETAIL_SUB.textContent = `${result.mode === "reading" ? "Reading Practice" : "Writing Practice"} · ${result.type === "average" ? "Pinned summary" : result.date} · ${result.type === "average" ? "Click a kana for its average timing" : formatDuration(result.durationMs) + " total time"}`;
    DETAIL_METRICS.innerHTML = [
        detailMetric("Overall", `${result.overallScore}%`),
        detailMetric("Correct", `${result.correct}`),
        detailMetric("Wrong", `${result.wrong}`),
        detailMetric("Avg Time", `${formatDuration(result.avgMs)}`)
    ].join("");
    const hideBtn = document.getElementById("hideUnusedBtn");
    if (hideBtn) {
        hideBtn.classList.toggle("active", hideUnusedKana);
        hideBtn.textContent = hideUnusedKana ? "Show unused kana" : "Hide unused kana";
    }
}

function openKanaModal(result, kana) {
    const record = result.kana[kana];
    if (!record) return;

    const attempts = (record.correct || 0) + (record.wrong || 0);
    const accuracy = attempts ? Math.round((record.correct / attempts) * 100) : 0;
    const wasCorrect = (record.wrong || 0) === 0;

    KANA_MODAL_TITLE.textContent = `${result.title} · ${kana}`;
    KANA_MODAL_SUB.textContent = result.type === "average"
        ? `Average stats for ${result.mode === "reading" ? "Reading" : "Writing"}`
        : `Single test result for ${result.mode === "reading" ? "Reading" : "Writing"}`;
    KANA_MODAL_CHAR.textContent = kana;
    KANA_MODAL_ROMAJI.textContent = record.romaji || "—";

    if (result.type === "average") {
        KANA_MODAL_STATS.innerHTML = `
            <div class="modal-stat">
                <div class="label">Correct</div>
                <div class="value">${record.correct || 0}</div>
            </div>
            <div class="modal-stat">
                <div class="label">Wrong</div>
                <div class="value">${record.wrong || 0}</div>
            </div>
            <div class="modal-stat">
                <div class="label">Accuracy</div>
                <div class="value">${accuracy}%</div>
            </div>
            <div class="modal-stat">
                <div class="label">Avg Time</div>
                <div class="value">${formatDuration(record.avgMs)}</div>
            </div>
        `;
    } else {
        KANA_MODAL_STATS.innerHTML = `
            <div class="modal-stat">
                <div class="label">Result</div>
                <div class="value" style="color:${wasCorrect ? '#bdf3cf' : '#ffb3b3'};">${wasCorrect ? 'Correct' : 'Wrong'}</div>
            </div>
            <div class="modal-stat">
                <div class="label">Time</div>
                <div class="value">${formatDuration(record.avgMs)}</div>
            </div>
        `;
    }

    KANA_MODAL_BACKDROP.classList.add("open");
}

function closeKanaModal() {
    KANA_MODAL_BACKDROP.classList.remove("open");
}

function renderHeatmap(result) {
    const rowExtremes = getRowCellExtremes(result);
    const visibleGroups = REGULAR_ROW_GROUPS
        .map(row => {
            const rowEntries = row.chars.map(char => [char, result.kana?.[char]]).filter(([, record]) => record);
            const activeChars = hideUnusedKana ? rowEntries.map(([char]) => char) : row.chars;
            return { ...row, rowEntries, activeChars };
        })
        .filter(row => !hideUnusedKana || row.activeChars.length);

    const buildCell = (char, record, markers) => {
        if (!record) {
            if (SPECIAL_CHAR_SET.has(char)) {
                if (hideUnusedKana) return `<div class="cell empty-slot" aria-hidden="true"></div>`;
                return `
                    <div class="cell reference" aria-label="${char} not used in this test">
                        <div class="cell-char">${char}</div>
                        <div class="cell-time">Off</div>
                    </div>
                `;
            }
            return `<div class="cell empty-slot" aria-hidden="true"></div>`;
        }
        const marker = markers[char];
        const badge = marker
            ? `<span class="cell-badge ${marker}">${marker === 'fastest' ? 'Fastest' : 'Slowest'}</span>`
            : '';
        return `
            <button class="cell ${selectedKana === char ? "active" : ""}" data-kana="${char}" type="button" style="background:${getHeatColor(result, record)};">
                ${badge}
                <div class="cell-char">${char}</div>
                <div class="cell-time">${formatDuration(record.avgMs)}</div>
            </button>
        `;
    };

    TEST_HEATMAP.innerHTML = visibleGroups.map(row => {
        const markers = rowExtremes.get(`${row.script}:${row.key}`) || {};
        const chunks = [];
        for (let i = 0; i < row.activeChars.length; i += 5) {
            const slice = row.activeChars.slice(i, i + 5);
            while (slice.length < 5) slice.push(null);
            chunks.push(slice);
        }

        const rowsHtml = chunks.map(chunk => `
            <div class="heatmap-row-cells">
                ${chunk.map(char => char ? buildCell(char, result.kana?.[char], markers) : `<div class="cell empty-slot" aria-hidden="true"></div>`).join("")}
            </div>
        `).join("");

        return `
            <div class="heatmap-row-group">
                <div class="heatmap-row-label">${row.key} Row</div>
                ${rowsHtml}
            </div>
        `;
    }).join("");

    TEST_HEATMAP.querySelectorAll(".cell[data-kana]").forEach(button => {
        button.addEventListener("click", () => {
            selectedKana = button.dataset.kana;
            renderHeatmap(result);
            openKanaModal(result, selectedKana);
        });
    });
}

function renderAll() {
    STORED_RESULTS = loadStoredResults();
    if (!STORED_RESULTS.some(item => item.id === selectedResultId)) {
        selectedResultId = STORED_RESULTS[0]?.id || null;
        selectedKana = null;
    }
    const result = getSelectedResult();
    renderHero();
    renderResultsList();
    if (!result) {
        OVERALL_KICKER.textContent = "Selected result score";
        OVERALL_SELECTED_NAME.textContent = "No test results yet";
        OVERALL_SCORE.textContent = "—";
        OVERALL_SUB.textContent = "This page is ready for saved data from Test Mode in Reading Practice and Writing Practice.";
        OVERALL_MODE.textContent = "—";
        OVERALL_CORRECT.textContent = "0";
        OVERALL_WRONG.textContent = "0";
        OVERALL_TIME.textContent = "—";
        OVERALL_SCORE_CARD.classList.remove("reading", "writing");
        OVERALL_SCORE_CARD.classList.add("average");
        SNAPSHOT_BREAKDOWN.innerHTML = [
            `
                <div class="mega-inline-card">
                    <div class="label">Reading tests</div>
                    <div class="value">0</div>
                </div>
            `,
            `
                <div class="mega-inline-card">
                    <div class="label">Writing tests</div>
                    <div class="value">0</div>
                </div>
            `,
            `
                <div class="mega-inline-card">
                    <div class="label">Overall averages</div>
                    <div class="value">Pending</div>
                </div>
            `,
            `
                <div class="mega-inline-card">
                    <div class="label">Status</div>
                    <div class="value">Ready for Test Mode</div>
                </div>
            `
        ].join("");
        ROW_PERFORMANCE_MOUNT.innerHTML = "";
        DETAIL_TITLE.textContent = "No result selected";
        DETAIL_SUB.textContent = "Complete a test to populate this page.";
        DETAIL_METRICS.innerHTML = "";
        const hideBtn = document.getElementById("hideUnusedBtn");
        if (hideBtn) { hideBtn.classList.remove("active"); hideBtn.textContent = "Hide unused kana"; }
        TEST_HEATMAP.innerHTML = `<div class="empty" style="grid-column:1/-1;">No kana data yet.</div>`;
        return;
    }
    renderSnapshot(result);
    renderDetailHeader(result);
    renderHeatmap(result);
    drawRowCharts(result, activeRowGraphView);
    bindRowInteractions(result);
    const hideBtn = document.getElementById("hideUnusedBtn");
    if (hideBtn) {
        hideBtn.onclick = () => {
            hideUnusedKana = !hideUnusedKana;
            renderDetailHeader(result);
            renderHeatmap(result);
        };
    }
    // row view toggle is handled by a single delegated listener below
}



function findRowPerformanceEntry(result, script, key) {
    const perf = computeRowPerformance(result, activeRowGraphView === "special" ? SPECIAL_ROW_GROUPS : REGULAR_ROW_GROUPS, activeRowGraphView === "special");
    return perf.rows.find(row => row.script === script && row.key === key) || null;
}

function updateRowTooltip(result, script, key) {
    const overlay = document.getElementById("rowTooltipOverlay");
    const card = document.getElementById("rowTooltipCard");
    if (!overlay || !card) return;
    const row = findRowPerformanceEntry(result, script, key);
    if (!row) {
        overlay.classList.remove("show");
        return;
    }
    card.innerHTML = `
        <div class="title">${row.key}</div>
        <div class="sub">${row.isOff ? 'Modifier off for this result' : `Right: ${row.correct} · Wrong: ${row.wrong}<br>Avg time: ${formatDuration(row.avgMs)}`}</div>
    `;
    overlay.classList.add("show");
}

function bindRowInteractions(result) {
    const cards = document.querySelectorAll(".row-doughnut-card");
    const overlay = document.getElementById("rowTooltipOverlay");
    let locked = false;
    let activeCard = null;

    const clearActive = () => {
        cards.forEach(c => c.classList.remove("active"));
        activeCard = null;
    };

    const closeOverlay = () => {
        locked = false;
        clearActive();
        if (overlay) overlay.classList.remove("show");
    };

    cards.forEach(card => {
        card.addEventListener("mouseenter", () => {
            if (locked) return;
            updateRowTooltip(result, card.dataset.rowScript, card.dataset.rowKey);
        });

        card.addEventListener("mouseleave", () => {
            if (locked) return;
            if (overlay) overlay.classList.remove("show");
        });

        card.addEventListener("click", (e) => {
            e.stopPropagation();
            if (activeCard === card && locked) {
                closeOverlay();
                return;
            }
            locked = true;
            clearActive();
            activeCard = card;
            card.classList.add("active");
            updateRowTooltip(result, card.dataset.rowScript, card.dataset.rowKey);
        });
    });

    document.onclick = () => {
        closeOverlay();
    };
}
function drawRowCharts(result, viewMode = activeRowGraphView) {
    const perf = computeRowPerformance(result, viewMode === "special" ? SPECIAL_ROW_GROUPS : REGULAR_ROW_GROUPS, viewMode === "special");

    const drawSet = (rows, prefix, bestRow, worstRow) => {
        rows.forEach((row, index) => {
            const canvas = document.getElementById(`chart-${prefix}-${index}`);
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            const size = canvas.width || 70;
            const cx = size / 2;
            const cy = size / 2;
            const radius = 24;
            const lineWidth = 8;
            const correct = Math.max(0, Math.min(100, row.accuracy));
            const offState = !!row.isOff;

            ctx.clearRect(0, 0, size, size);

            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255,255,255,0.08)";
            ctx.lineWidth = lineWidth;
            ctx.stroke();

            if (!offState) {
                ctx.beginPath();
                ctx.arc(cx, cy, radius, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2) * (correct / 100));
                let stroke = correct >= 80 ? "#67d78b" : correct >= 60 ? "#cba34a" : "#ff7b7b";
                if (bestRow && bestRow.key === row.key) stroke = "#67d78b";
                if (worstRow && worstRow.key === row.key) {
                    stroke = rowNeedsErrorStyling(row) ? "#ff7b7b" : "#cba34a";
                }
                ctx.strokeStyle = stroke;
                ctx.lineWidth = lineWidth;
                ctx.lineCap = "round";
                ctx.stroke();
            }

            ctx.fillStyle = offState ? "rgba(255,255,255,0.5)" : "#f3f3f3";
            ctx.font = `700 ${offState ? 11 : 12}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(offState ? "Off" : `${correct}%`, cx, cy);
        });
    };

    drawSet(perf.hiragana, viewMode === "special" ? "sh" : "h", perf.hiraganaBest, perf.hiraganaWorst);
    drawSet(perf.katakana, viewMode === "special" ? "sk" : "k", perf.katakanaBest, perf.katakanaWorst);
}


ROW_PERFORMANCE_MOUNT.addEventListener("click", (event) => {
    const toggleBtn = event.target.closest(".row-view-btn");
    if (!toggleBtn) return;
    event.stopPropagation();
    const selected = getSelectedResult();
    if (!selected) return;
    activeRowGraphView = toggleBtn.dataset.rowView === "special" ? "special" : "regular";
    ROW_PERFORMANCE_MOUNT.innerHTML = renderRowPerformance(selected, activeRowGraphView);
    drawRowCharts(selected, activeRowGraphView);
    bindRowInteractions(selected);
});

KANA_MODAL_CLOSE.addEventListener("click", closeKanaModal);
KANA_MODAL_BACKDROP.addEventListener("click", (e) => {
    if (e.target === KANA_MODAL_BACKDROP) closeKanaModal();
});

renderAll();
// ensure charts render
setTimeout(() => { const selected = getSelectedResult(); if (selected) drawRowCharts(selected, activeRowGraphView); }, 50);

window.addEventListener("focus", async () => {
    await window.KanaCloudSync?.hydrateFromCloud().catch(() => {});
    renderAll();
});
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) renderAll();
});
window.addEventListener("storage", (event) => {
    const watchedKeys = new Set([
        READING_TEST_RESULTS_STORAGE_KEY,
        READING_TEST_RESULTS_STORAGE_BACKUP_KEY,
        READING_TEST_RESULTS_UPDATED_AT_KEY,
        READING_TEST_RESULTS_ALT_STORAGE_KEY,
        READING_TEST_RESULTS_ALT_STORAGE_BACKUP_KEY,
        READING_TEST_RESULTS_ALT_UPDATED_AT_KEY,
        WRITING_TEST_RESULTS_STORAGE_KEY,
        WRITING_TEST_RESULTS_STORAGE_BACKUP_KEY,
        WRITING_TEST_RESULTS_UPDATED_AT_KEY,
        "testModeResults",
        "kanaTrainerTestModeResults",
        "testModeResultsUpdatedAt",
        "readingTestModeResults",
        "kanaTrainerReadingTestModeResults",
        "readingTestModeResultsUpdatedAt",
        "writingTestModeResults",
        "kanaTrainerWritingTestModeResults",
        "writingTestModeResultsUpdatedAt"
    ]);
    if (!event.key || watchedKeys.has(event.key)) {
        renderAll();
    }
});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
