(function ModeAtlasKanaDashboardFallback(){
  if (window.__maKanaDashboardFallbackInstalled) return;
  window.__maKanaDashboardFallbackInstalled = true;
  function $(id){ return document.getElementById(id); }
  function readJSON(key, fallback){
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch(e) { return fallback; }
  }
  function readFirst(keys, fallback){
    for (var i=0;i<keys.length;i++){
      var v = readJSON(keys[i], null);
      if (v && ((Array.isArray(v) && v.length) || (!Array.isArray(v) && typeof v === 'object' && Object.keys(v).length))) return v;
    }
    return fallback;
  }
  function num(v){ var n=Number(v||0); return Number.isFinite(n)?n:0; }
  function statParts(stat){
    stat = stat || {};
    var c = num(stat.correct ?? stat.right ?? stat.correctCount ?? stat.success ?? stat.good);
    var w = num(stat.wrong ?? stat.incorrect ?? stat.fail ?? stat.mistakes);
    var t = num(stat.total ?? stat.attempts ?? stat.seen);
    if (!t) t = c + w;
    return {correct:c, wrong:w, total:t};
  }
  function summarize(stats, highKey){
    var entries = Object.entries(stats || {});
    var correct=0, wrong=0, practiced=0, tough=[], strong=[];
    entries.forEach(function(pair){
      var p=statParts(pair[1]);
      correct += p.correct; wrong += p.wrong;
      if (p.total > 0){
        practiced += 1;
        var acc = p.total ? p.correct / p.total : 0;
        tough.push({ch:pair[0], acc:acc, total:p.total});
        if (p.correct >= 3) strong.push({ch:pair[0], acc:acc, total:p.total});
      }
    });
    tough.sort(function(a,b){ return (a.acc-b.acc) || (b.total-a.total) || a.ch.localeCompare(b.ch); });
    strong.sort(function(a,b){ return (b.acc-a.acc) || (b.total-a.total) || a.ch.localeCompare(b.ch); });
    var attempts=correct+wrong;
    return {
      correct:correct,
      wrong:wrong,
      attempts:attempts,
      practiced:practiced,
      accuracy:attempts?Math.round((correct/attempts)*100):0,
      high:num(localStorage.getItem(highKey)),
      toughest:tough.slice(0,5).map(function(x){return x.ch;}).join(', ') || 'Not enough data yet',
      strongest:strong.slice(0,5).map(function(x){return x.ch;}).join(', ') || 'Not enough data yet'
    };
  }
  function todayKey(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function formatDaily(hist){
    hist = hist || {};
    var today = hist[todayKey()];
    var rows = Object.entries(hist).sort(function(a,b){return b[0].localeCompare(a[0]);});
    var best = rows.reduce(function(best, row){ var score=num((row[1]||{}).officialScore || (row[1]||{}).score); return (!best || score > best.score) ? {date:row[0], score:score, item:row[1]} : best; }, null);
    return {today: today ? (num(today.officialScore || today.score)+'/'+num(today.total || 20)) : 'Ready', best: best ? (best.score+'/'+num((best.item||{}).total || 20)) : 'No history yet', rows: rows};
  }
  function card(label, value, sub){ return '<div class="mini-stat"><div class="k">'+label+'</div><div class="v">'+value+'</div>'+(sub?'<div class="summary-extra">'+sub+'</div>':'')+'</div>'; }
  function summaryRow(label,value,extra){ return '<div class="summary-row"><div class="summary-main"><div class="summary-label">'+label+'</div>'+(extra?'<div class="summary-extra">'+extra+'</div>':'')+'</div><div class="summary-value">'+value+'</div></div>'; }
  function render(){
    if (!$('gaugeGrid') || !$('recordsBars') || !$('learningPulse')) return;
    var readingStats = readFirst(['charStats','stats','readingStats'], {});
    var writingStats = readFirst(['reverseCharStats','reverseStats','writingStats'], {});
    var r = summarize(readingStats, 'highScore');
    var w = summarize(writingStats, 'reverseHighScore');
    var rDaily = formatDaily(readJSON('dailyChallengeHistory', {}));
    var wDaily = formatDaily(readJSON('reverseDailyChallengeHistory', {}));
    if ($('heroReadingHigh')) $('heroReadingHigh').textContent = r.high || 0;
    if ($('heroWritingHigh')) $('heroWritingHigh').textContent = w.high || 0;
    if ($('heroStatusText')) $('heroStatusText').innerHTML = 'Reading today: <strong>'+rDaily.today+'</strong><br>Writing today: <strong>'+wDaily.today+'</strong>';
    if ($('readingSpotlightStats')) $('readingSpotlightStats').innerHTML = card('High score',r.high)+card('Accuracy',r.accuracy+'%')+card('Practiced',r.practiced)+card('Attempts',r.attempts);
    if ($('writingSpotlightStats')) $('writingSpotlightStats').innerHTML = card('High score',w.high)+card('Accuracy',w.accuracy+'%')+card('Practiced',w.practiced)+card('Attempts',w.attempts);
    if ($('readingToughest')) $('readingToughest').textContent = r.toughest;
    if ($('writingToughest')) $('writingToughest').textContent = w.toughest;
    if ($('readingStrongest')) $('readingStrongest').textContent = r.strongest;
    if ($('writingStrongest')) $('writingStrongest').textContent = w.strongest;
    $('gaugeGrid').innerHTML = [
      '<div class="gauge-card"><h3>Reading Practice</h3><div class="mini-stats">'+card('Accuracy',r.accuracy+'%')+card('Practiced',r.practiced)+card('Attempts',r.attempts)+card('Today',rDaily.today)+'</div></div>',
      '<div class="gauge-card"><h3>Writing Practice</h3><div class="mini-stats">'+card('Accuracy',w.accuracy+'%')+card('Practiced',w.practiced)+card('Attempts',w.attempts)+card('Today',wDaily.today)+'</div></div>'
    ].join('');
    $('recordsBars').innerHTML = [
      summaryRow('Reading high score', r.high || 0, 'Best saved Reading streak'),
      summaryRow('Writing high score', w.high || 0, 'Best saved Writing streak'),
      summaryRow('Reading strongest', r.strongest, 'Best tracked kana'),
      summaryRow('Writing strongest', w.strongest, 'Best tracked kana')
    ].join('');
    $('learningPulse').innerHTML = [
      card('Correct answers', r.correct+w.correct, 'Reading '+r.correct+' · Writing '+w.correct),
      card('Wrong answers', r.wrong+w.wrong, 'Reading '+r.wrong+' · Writing '+w.wrong),
      card('Practiced kana', r.practiced+w.practiced, 'Reading '+r.practiced+' · Writing '+w.practiced),
      card('Accuracy edge', r.accuracy===w.accuracy?'Tie':(r.accuracy>w.accuracy?'Reading':'Writing'), r.accuracy+'% vs '+w.accuracy+'%')
    ].join('');
    if ($('learningPulseHighlights')) $('learningPulseHighlights').innerHTML = summaryRow('Review Reading', r.toughest)+summaryRow('Review Writing', w.toughest)+summaryRow('Best daily', 'Reading '+rDaily.best, 'Writing '+wDaily.best);
    if ($('learningPulseCompare')) $('learningPulseCompare').innerHTML = summaryRow('Reading accuracy', r.accuracy+'%', r.attempts+' answers')+summaryRow('Writing accuracy', w.accuracy+'%', w.attempts+' answers')+summaryRow('Coverage', (r.practiced+w.practiced)+' kana', 'Tracked across both modes');
    if ($('readingTodaySummary')) $('readingTodaySummary').innerHTML = summaryRow('Today’s official score', rDaily.today)+summaryRow('Best daily on record', rDaily.best)+summaryRow('Mode high score', r.high || 0);
    if ($('writingTodaySummary')) $('writingTodaySummary').innerHTML = summaryRow('Today’s official score', wDaily.today)+summaryRow('Best daily on record', wDaily.best)+summaryRow('Mode high score', w.high || 0);
    if ($('readingTimeline')) $('readingTimeline').innerHTML = rDaily.rows.length ? rDaily.rows.slice(0,5).map(function(row){ return '<div class="timeline-item"><div class="timeline-date">'+row[0]+'</div><div class="timeline-card"><div class="timeline-score">'+num((row[1]||{}).officialScore || (row[1]||{}).score)+'/'+num((row[1]||{}).total || 20)+'</div></div></div>'; }).join('') : '<div class="empty">No daily challenge history yet.</div>';
    if ($('writingTimeline')) $('writingTimeline').innerHTML = wDaily.rows.length ? wDaily.rows.slice(0,5).map(function(row){ return '<div class="timeline-item"><div class="timeline-date">'+row[0]+'</div><div class="timeline-card"><div class="timeline-score">'+num((row[1]||{}).officialScore || (row[1]||{}).score)+'/'+num((row[1]||{}).total || 20)+'</div></div></div>'; }).join('') : '<div class="empty">No daily challenge history yet.</div>';
  }
  function needsFallback(){
    var ids=['gaugeGrid','recordsBars','learningPulse','readingTodaySummary','writingTodaySummary'];
    return ids.some(function(id){ var el=$(id); return el && !el.textContent.trim() && !el.children.length; });
  }
  function maybe(){ try { if (needsFallback()) render(); } catch(e) { console.warn('Kana dashboard fallback failed', e); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(maybe, 300); }); else setTimeout(maybe, 300);
  setTimeout(maybe, 1200); setTimeout(maybe, 2500); window.addEventListener('focus', maybe); window.addEventListener('pageshow', function(){ setTimeout(maybe, 300); });
})();
