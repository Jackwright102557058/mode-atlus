window.KanaCloudSync?.bindUi?.({
    signInBtn: document.getElementById('profileSignInBtn'),
    signOutBtn: document.getElementById('profileSignOutBtn'),
    statusEl: document.getElementById('profileStatus'),
    nameEl: document.getElementById('profileName'),
    emailEl: document.getElementById('profileEmail'),
    photoEl: document.getElementById('profileAvatar')
});

function updateTopProfileDot() {
    const dot = document.getElementById('topProfileDot');
    if (!dot || !window.KanaCloudSync) return;
    const user = window.KanaCloudSync.getUser?.();
    if (user?.photoURL) {
        dot.innerHTML = `<img src="${user.photoURL}" alt="" />`;
        return;
    }
    const label = (user?.displayName || user?.email || 'M').trim();
    dot.textContent = (label[0] || 'M').toUpperCase();
}
window.KanaCloudSync?.ready?.then(() => {
    updateTopProfileDot();
    setTimeout(updateTopProfileDot, 300);
    setTimeout(updateTopProfileDot, 1200);
});
document.getElementById('profileSignInBtn')?.addEventListener('click', () => setTimeout(updateTopProfileDot, 1200));
document.getElementById('profileSignOutBtn')?.addEventListener('click', () => setTimeout(updateTopProfileDot, 300));

const profileDrawer = document.getElementById('profileDrawer');
const profileBackdrop = document.getElementById('profileBackdrop');
const profileOpenBtn = document.getElementById('profileOpenBtn');
const profileCloseBtn = document.getElementById('profileCloseBtn');
function openProfileDrawer() {
    profileDrawer?.classList.add('open');
    profileBackdrop?.classList.add('open');
    profileDrawer?.setAttribute('aria-hidden', 'false');
}
function closeProfileDrawer() {
    profileDrawer?.classList.remove('open');
    profileBackdrop?.classList.remove('open');
    profileDrawer?.setAttribute('aria-hidden', 'true');
}
profileOpenBtn?.addEventListener('click', openProfileDrawer);
profileCloseBtn?.addEventListener('click', closeProfileDrawer);
profileBackdrop?.addEventListener('click', closeProfileDrawer);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeProfileDrawer(); });

const modeAtlasKanaCloudReady = (window.KanaCloudSync?.beforePageLoad?.() || Promise.resolve())
    .then(() => window.KanaCloudSync?.hydrateFromCloud?.())
    .catch((err) => { console.warn('Kana dashboard cloud hydration failed', err); });
/* ModeAtlas kana dashboard hydration repair */

function loadJSON(key, fallback) {
    try {
        return window.ModeAtlasStorage.json(key, fallback);
    } catch {
        return fallback;
    }
}

function formatMs(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return '—';
    if (ms < 1000) return `${Math.round(ms)} ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

function todayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function normalizeScoreHistory(data) {
    return {
        endlessBest: { total: 0, correct: 0, wrong: 0, ...((data || {}).endlessBest || {}) },
        comboKanaBest: { same_row: 0, random: 0, ...((data || {}).comboKanaBest || {}) },
        timeTrialTop3: Array.isArray((data || {}).timeTrialTop3) ? data.timeTrialTop3 : []
    };
}

function modeColor(mode) {
    return mode === 'reading' ? '#67d78b' : '#66a8ff';
}

function accuracyPct(correct, wrong) {
    const total = correct + wrong;
    return total ? Math.round((correct / total) * 100) : 0;
}

function buildModeSummary({ stats, scoreHistory, dailyHistory, highScore, modeName }) {
    const entries = Object.entries(stats || {});
    let totalCorrect = 0;
    let totalWrong = 0;
    let practicedChars = 0;
    const toughestCandidates = [];
    const strongestCandidates = [];

    for (const [ch, stat] of entries) {
        const c = Number(stat.correct || 0);
        const w = Number(stat.wrong || 0);
        const attempts = c + w;
        totalCorrect += c;
        totalWrong += w;

        if (attempts > 0) {
            practicedChars += 1;
            const accuracy = c / attempts;
            toughestCandidates.push({ ch, accuracy, attempts, correct: c, wrong: w });
            if (c >= 5) {
                strongestCandidates.push({ ch, accuracy, attempts, correct: c, wrong: w });
            }
        }
    }

    toughestCandidates.sort((a, b) => (a.accuracy - b.accuracy) || (b.attempts - a.attempts) || a.ch.localeCompare(b.ch));
    strongestCandidates.sort((a, b) => (b.accuracy - a.accuracy) || (b.correct - a.correct) || (b.attempts - a.attempts) || a.ch.localeCompare(b.ch));

    const toughest = toughestCandidates.length ? {
        accuracy: toughestCandidates[0].accuracy,
        attempts: toughestCandidates[0].attempts,
        chars: toughestCandidates
            .filter(item => item.accuracy === toughestCandidates[0].accuracy)
            .slice(0, 10)
            .map(item => item.ch)
    } : null;

    const strongest = strongestCandidates.length ? {
        accuracy: strongestCandidates[0].accuracy,
        attempts: strongestCandidates[0].attempts,
        chars: strongestCandidates
            .filter(item => item.accuracy === strongestCandidates[0].accuracy)
            .slice(0, 10)
            .map(item => item.ch)
    } : null;

    const totalAttempts = totalCorrect + totalWrong;
    const accuracy = accuracyPct(totalCorrect, totalWrong);
    const daily = dailyHistory || {};
    const today = daily[todayKey()] || null;
    const historyEntries = Object.entries(daily).sort((a, b) => b[0].localeCompare(a[0]));
    const bestDaily = historyEntries.reduce((best, [date, entry]) => {
        const score = Number(entry.officialScore || 0);
        if (!best || score > best.score) return { score, date, entry };
        return best;
    }, null);

    return {
        modeName,
        highScore: Number(highScore || 0),
        scoreHistory,
        dailyHistory: daily,
        totalCorrect,
        totalWrong,
        totalAttempts,
        practicedChars,
        accuracy,
        today,
        bestDaily,
        toughest,
        strongest
    };
}

function metric(label, value) {
    return `<div class="metric"><div class="label">${label}</div><div class="value">${value}</div></div>`;
}

function miniStat(label, value) {
    return `<div class="mini-stat"><div class="k">${label}</div><div class="v">${value}</div></div>`;
}

function summaryRow(label, value, extra='') {
    return `
        <div class="summary-row">
            <div class="summary-main">
                <div class="summary-label">${label}</div>
                ${extra ? `<div class="summary-extra">${extra}</div>` : ''}
            </div>
            <div class="summary-value">${value}</div>
        </div>
    `;
}

function timelineItem(date, scoreText, metaText) {
    return `
        <div class="timeline-item">
            <div class="timeline-date">${date}</div>
            <div class="timeline-card">
                <div class="timeline-score">${scoreText}</div>
                <div class="timeline-meta">${metaText}</div>
            </div>
        </div>
    `;
}

function formatKanaGroup(entry, emptyText = '—') {
    if (!entry || !Array.isArray(entry.chars) || !entry.chars.length) return emptyText;
    const percent = `${Math.round(entry.accuracy * 100)}%`;
    return `${percent} · ${entry.chars.join(', ')}`;
}

function renderSpotlight(modeId, summary) {
    document.getElementById(`${modeId}SpotlightStats`).innerHTML = [
        metric('High Score', summary.highScore || 0),
        metric('Accuracy', `${summary.accuracy}%`),
        metric('Chars Practiced', summary.practicedChars || 0),
        metric('Total Attempts', summary.totalAttempts || 0)
    ].join('');

    document.getElementById(`${modeId}Toughest`).textContent = formatKanaGroup(summary.toughest);
    document.getElementById(`${modeId}Strongest`).textContent = formatKanaGroup(summary.strongest, '—');
}

function renderHero(summaryReading, summaryWriting) {
    document.getElementById('heroReadingHigh').textContent = summaryReading.highScore || 0;
    document.getElementById('heroWritingHigh').textContent = summaryWriting.highScore || 0;

    const readingToday = summaryReading.today ? `${summaryReading.today.officialScore || 0}/${summaryReading.today.total || 20}` : '—';
    const writingToday = summaryWriting.today ? `${summaryWriting.today.officialScore || 0}/${summaryWriting.today.total || 20}` : '—';

    document.getElementById('heroStatusText').innerHTML =
        `Reading today: <strong>${readingToday}</strong><br>Writing today: <strong>${writingToday}</strong>`;
}

function renderGauges(readingSummary, writingSummary) {
    const data = [
        { key: 'reading', name: 'Reading Practice', summary: readingSummary },
        { key: 'writing', name: 'Writing Practice', summary: writingSummary }
    ];

    document.getElementById('gaugeGrid').innerHTML = data.map(item => {
        const color = modeColor(item.key);
        const pct = Math.max(0, Math.min(100, item.summary.accuracy));
        const today = item.summary.today;
        return `
            <div class="gauge-card">
                <div class="ring-wrap">
                    <div class="ring" style="--pct:${pct}; --ring-color:${color};">
                        <div class="ring-center">
                            <div>
                                <div class="big">${pct}%</div>
                                <div class="small">Accuracy</div>
                            </div>
                        </div>
                    </div>
                    <div class="gauge-copy">
                        <h3>${item.name}</h3>
                        <p>${item.key === 'reading'
                            ? 'Recognition-heavy practice with fast feedback and classic romaji input.'
                            : 'Recall-focused prompts built around choosing or typing the correct kana.'}</p>
                    </div>
                </div>
                <div class="mini-stats">
                    ${miniStat('High Score', item.summary.highScore || 0)}
                    ${miniStat('Practiced', item.summary.practicedChars || 0)}
                    ${miniStat('Attempts', item.summary.totalAttempts || 0)}
                    ${miniStat('Today', today ? `${today.officialScore || 0}/${today.total || 20}` : '—')}
                </div>
            </div>
        `;
    }).join('');
}

function renderRecords(readingSummary, writingSummary) {
    const compareRows = [
        {
            label: 'Endless best',
            reading: readingSummary.scoreHistory.endlessBest.correct || 0,
            writing: writingSummary.scoreHistory.endlessBest.correct || 0,
            extra: 'best correct count'
        },
        {
            label: 'Combo same row',
            reading: readingSummary.scoreHistory.comboKanaBest.same_row || 0,
            writing: writingSummary.scoreHistory.comboKanaBest.same_row || 0,
            extra: 'best streak'
        },
        {
            label: 'Combo random',
            reading: readingSummary.scoreHistory.comboKanaBest.random || 0,
            writing: writingSummary.scoreHistory.comboKanaBest.random || 0,
            extra: 'best streak'
        },
        {
            label: 'Top time trial',
            reading: (readingSummary.scoreHistory.timeTrialTop3[0] || {}).score || 0,
            writing: (writingSummary.scoreHistory.timeTrialTop3[0] || {}).score || 0,
            extra: 'best listed score'
        }
    ];

    const maxValue = Math.max(1, ...compareRows.flatMap(row => [row.reading, row.writing]));

    document.getElementById('recordsBars').innerHTML = compareRows.map(row => `
        <div class="bar-row">
            <div class="bar-top">
                <strong>${row.label}</strong>
                <span style="color:var(--muted);">${row.extra}</span>
            </div>
            <div class="bar-top" style="font-size:13px;">
                <span>Reading · ${row.reading}</span>
                <span>Writing · ${row.writing}</span>
            </div>
            <div class="bar-track">
                <div class="bar-fill" style="--bar-color:#67d78b; width:${Math.max(4, (row.reading / maxValue) * 100)}%;"></div>
            </div>
            <div class="bar-track">
                <div class="bar-fill" style="--bar-color:#66a8ff; width:${Math.max(4, (row.writing / maxValue) * 100)}%;"></div>
            </div>
        </div>
    `).join('');
}

function renderTodaySummary(targetId, summary, mode) {
    const today = summary.today;
    const bestDaily = summary.bestDaily;

    const html = [
        summaryRow('Today’s official score', today ? `${today.officialScore || 0}/${today.total || 20}` : '—', today ? `Official time ${formatMs(today.timeMs)} · Attempts ${today.attempts || 1}` : 'No completed daily challenge yet today'),
        summaryRow('Best daily on record', bestDaily ? `${bestDaily.score}/${bestDaily.entry.total || 20}` : '—', bestDaily ? `${bestDaily.date} · ${formatMs(bestDaily.entry.timeMs)}` : 'No history yet'),
        summaryRow('Mode high score', summary.highScore || 0, mode === 'reading' ? 'Best streak in Reading Practice' : 'Best streak in Writing Practice')
    ].join('');

    document.getElementById(targetId).innerHTML = html;
}

function renderTimeline(targetId, dailyHistory) {
    const items = Object.entries(dailyHistory || {}).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 5);
    document.getElementById(targetId).innerHTML = items.length
        ? items.map(([date, entry]) => timelineItem(date, `${entry.officialScore || 0}/${entry.total || 20}`, `Official time ${formatMs(entry.timeMs)} · Attempts ${entry.attempts || 1}`)).join('')
        : `<div class="empty">No daily challenge history yet.</div>`;
}

function renderLearningPulse(readingSummary, writingSummary) {
    const cards = [
        {
            label: 'Correct answers',
            total: `${readingSummary.totalCorrect + writingSummary.totalCorrect}`,
            reading: `${readingSummary.totalCorrect}`,
            writing: `${writingSummary.totalCorrect}`,
            readingSub: 'Recognition mode',
            writingSub: 'Recall mode'
        },
        {
            label: 'Wrong answers',
            total: `${readingSummary.totalWrong + writingSummary.totalWrong}`,
            reading: `${readingSummary.totalWrong}`,
            writing: `${writingSummary.totalWrong}`,
            readingSub: 'Reading misses',
            writingSub: 'Writing misses'
        },
        {
            label: 'Toughest kana',
            total: `${formatKanaGroup(readingSummary.toughest)} / ${formatKanaGroup(writingSummary.toughest)}`,
            reading: `${readingSummary.toughest && readingSummary.toughest.chars ? readingSummary.toughest.chars.join(', ') : '—'}`,
            writing: `${writingSummary.toughest && writingSummary.toughest.chars ? writingSummary.toughest.chars.join(', ') : '—'}`,
            readingSub: `${readingSummary.toughest ? Math.round(readingSummary.toughest.accuracy * 100) : '—'}% accuracy`,
            writingSub: `${writingSummary.toughest ? Math.round(writingSummary.toughest.accuracy * 100) : '—'}% accuracy`
        },
        {
            label: 'Strongest kana',
            total: `${formatKanaGroup(readingSummary.strongest)} / ${formatKanaGroup(writingSummary.strongest)}`,
            reading: `${readingSummary.strongest && readingSummary.strongest.chars ? readingSummary.strongest.chars.join(', ') : '—'}`,
            writing: `${writingSummary.strongest && writingSummary.strongest.chars ? writingSummary.strongest.chars.join(', ') : '—'}`,
            readingSub: `${readingSummary.strongest ? Math.round(readingSummary.strongest.accuracy * 100) : '—'}% accuracy`,
            writingSub: `${writingSummary.strongest ? Math.round(writingSummary.strongest.accuracy * 100) : '—'}% accuracy`
        },
        {
            label: 'Practiced kana',
            total: `${readingSummary.practicedChars + writingSummary.practicedChars}`,
            reading: `${readingSummary.practicedChars}`,
            writing: `${writingSummary.practicedChars}`,
            readingSub: 'Reading coverage',
            writingSub: 'Writing coverage'
        },
        {
            label: 'High score',
            total: `${Math.max(readingSummary.highScore, writingSummary.highScore)}`,
            reading: `${readingSummary.highScore}`,
            writing: `${writingSummary.highScore}`,
            readingSub: 'Reading best streak',
            writingSub: 'Writing best streak'
        }
    ];

    document.getElementById('learningPulse').innerHTML = cards.map(card => `
        <div class="pulse-key-card">
            <div class="pulse-key-head">
                <div class="k">${card.label}</div>
                <div class="v">${card.total}</div>
            </div>
            <div class="pulse-mode-pair">
                <div class="pulse-mode-box reading">
                    <div class="pulse-mode-name">Reading</div>
                    <div class="pulse-mode-value">${card.reading}</div>
                    <div class="pulse-mode-sub">${card.readingSub}</div>
                </div>
                <div class="pulse-mode-box writing">
                    <div class="pulse-mode-name">Writing</div>
                    <div class="pulse-mode-value">${card.writing}</div>
                    <div class="pulse-mode-sub">${card.writingSub}</div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderLearningPulseHighlights(readingSummary, writingSummary) {
    const highlightRows = [
        readingSummary.highScore === writingSummary.highScore
            ? summaryRow('High score edge', 'Tie', `Both modes are sitting on ${readingSummary.highScore}`)
            : (readingSummary.highScore > writingSummary.highScore
                ? summaryRow('High score edge', 'Reading lead', `${readingSummary.highScore} vs ${writingSummary.highScore}`)
                : summaryRow('High score edge', 'Writing lead', `${writingSummary.highScore} vs ${readingSummary.highScore}`)),

        readingSummary.accuracy === writingSummary.accuracy
            ? summaryRow('Accuracy edge', 'Tie', `Both modes are at ${readingSummary.accuracy}%`)
            : (readingSummary.accuracy > writingSummary.accuracy
                ? summaryRow('Accuracy edge', 'Reading lead', `${readingSummary.accuracy}% vs ${writingSummary.accuracy}%`)
                : summaryRow('Accuracy edge', 'Writing lead', `${writingSummary.accuracy}% vs ${readingSummary.accuracy}%`)),

        readingSummary.practicedChars === writingSummary.practicedChars
            ? summaryRow('Coverage edge', 'Tie', `Both have ${readingSummary.practicedChars} practiced kana`)
            : (readingSummary.practicedChars > writingSummary.practicedChars
                ? summaryRow('Coverage edge', 'Reading lead', `${readingSummary.practicedChars} vs ${writingSummary.practicedChars} practiced kana`)
                : summaryRow('Coverage edge', 'Writing lead', `${writingSummary.practicedChars} vs ${writingSummary.practicedChars} practiced kana`))
    ];

    document.getElementById('learningPulseHighlights').innerHTML = highlightRows.join('');
}

function renderLearningPulseCompare(readingSummary, writingSummary) {
    const compareRows = [
        { label: 'Correct answers', reading: readingSummary.totalCorrect, writing: writingSummary.totalCorrect },
        { label: 'Wrong answers', reading: readingSummary.totalWrong, writing: writingSummary.totalWrong },
        { label: 'Practiced kana', reading: readingSummary.practicedChars, writing: writingSummary.practicedChars },
        { label: 'High score', reading: readingSummary.highScore, writing: writingSummary.highScore }
    ];

    document.getElementById('learningPulseCompare').innerHTML = compareRows.map(row => {
        const maxVal = Math.max(1, row.reading, row.writing);
        const readingPct = (row.reading / maxVal) * 100;
        const writingPct = (row.writing / maxVal) * 100;

        return `
            <div class="vs-row">
                <div class="vs-value reading">${row.reading}</div>
                <div class="vs-center">
                    <div class="vs-label">
                        <strong>${row.label}</strong>
                        <span style="color:var(--muted);">Reading vs Writing progress</span>
                    </div>
                    <div class="vs-track">
                        <div class="vs-fill reading" style="width:${readingPct}%;"></div>
                        <div class="vs-fill writing" style="width:${writingPct}%;"></div>
                    </div>
                </div>
                <div class="vs-value writing">${row.writing}</div>
            </div>
        `;
    }).join('');
}

function buildSummaries() {
    const readingStats = loadJSON('charStats', {});
    const readingScoreHistory = normalizeScoreHistory(loadJSON('scoreHistory', {}));
    const readingDailyHistory = loadJSON('dailyChallengeHistory', {});
    const readingHighScore = window.ModeAtlasStorage.number('highScore', 0);

    const writingStats = loadJSON('reverseCharStats', {});
    const writingScoreHistory = normalizeScoreHistory(loadJSON('reverseScoreHistory', {}));
    const writingDailyHistory = loadJSON('reverseDailyChallengeHistory', {});
    const writingHighScore = window.ModeAtlasStorage.number('reverseHighScore', 0);

    return {
        readingSummary: buildModeSummary({
            stats: readingStats,
            scoreHistory: readingScoreHistory,
            dailyHistory: readingDailyHistory,
            highScore: readingHighScore,
            modeName: 'Reading Practice'
        }),
        writingSummary: buildModeSummary({
            stats: writingStats,
            scoreHistory: writingScoreHistory,
            dailyHistory: writingDailyHistory,
            highScore: writingHighScore,
            modeName: 'Writing Practice'
        })
    };
}

function renderAll() {
    const { readingSummary, writingSummary } = buildSummaries();
    renderHero(readingSummary, writingSummary);
    renderSpotlight('reading', readingSummary);
    renderSpotlight('writing', writingSummary);
    renderGauges(readingSummary, writingSummary);
    renderRecords(readingSummary, writingSummary);
    renderTodaySummary('readingTodaySummary', readingSummary, 'reading');
    renderTodaySummary('writingTodaySummary', writingSummary, 'writing');
    renderTimeline('readingTimeline', readingSummary.dailyHistory);
    renderTimeline('writingTimeline', writingSummary.dailyHistory);
    renderLearningPulse(readingSummary, writingSummary);
    renderLearningPulseHighlights(readingSummary, writingSummary);
    renderLearningPulseCompare(readingSummary, writingSummary);
}

renderAll();
modeAtlasKanaCloudReady.then(() => {
    renderAll();
    setTimeout(renderAll, 250);
    setTimeout(renderAll, 1000);
}).catch(() => {
    setTimeout(renderAll, 250);
    setTimeout(renderAll, 1000);
});
window.addEventListener('pageshow', () => setTimeout(renderAll, 100));
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setTimeout(renderAll, 100);
});
window.addEventListener('focus', () => setTimeout(renderAll, 100));
