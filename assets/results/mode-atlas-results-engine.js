(function(){
  if (window.ModeAtlasResultsEngine) return;

  function safeParse(raw, fallback){
    if (window.ModeAtlasStorage?.safeParse) return window.ModeAtlasStorage.safeParse(raw, fallback);
    if (raw === undefined || raw === null || raw === '') return fallback;
    try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return fallback; }
  }

  function loadJSON(key, fallback){
    if (window.ModeAtlasStorage?.json) return window.ModeAtlasStorage.json(key, fallback);
    return fallback;
  }

  function getEmbeddedSaveMaps(){
    const maps = [];
    const addMap = (value) => {
      const parsed = safeParse(value, value);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;
      if (parsed.data && typeof parsed.data === 'object') maps.push(parsed.data);
      if (parsed.localStorage && typeof parsed.localStorage === 'object') maps.push(parsed.localStorage);
      if (parsed.testModeResults || parsed.writingTestModeResults || parsed.readingTestModeResults) maps.push(parsed);
    };

    // Recovery for saves accidentally imported by the old fallback importer, which
    // could store the whole export's data object under localStorage.data instead
    // of expanding its keys.
    ['data','localStorage','modeAtlasLastImportedSave','modeAtlasPendingImport'].forEach((key) => {
      try { addMap(window.ModeAtlasStorage?.get ? window.ModeAtlasStorage.get(key, null) : null); } catch {}
    });
    return maps;
  }

  function readArraysFromKeys(keys){
    const arrays = [];
    (keys || []).forEach((key) => {
      const value = loadJSON(key, null);
      if (Array.isArray(value)) arrays.push(value);
    });

    getEmbeddedSaveMaps().forEach((map) => {
      (keys || []).forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(map, key)) return;
        const value = safeParse(map[key], null);
        if (Array.isArray(value)) arrays.push(value);
      });
    });
    return arrays;
  }

  function loadModeResultsFromKeys(keys, expectedMode, normalizeTestResult){
    const mergedMap = new Map();
    const pushItems = (arr) => {
      if (!Array.isArray(arr)) return;
      arr.forEach((item) => {
        const normalized = normalizeTestResult(item);
        if (!normalized || normalized.mode !== expectedMode) return;
        const key = normalized.id || `${normalized.mode}-${normalized.date}-${normalized.startedAt}`;
        mergedMap.set(key, normalized);
      });
    };
    readArraysFromKeys(keys).forEach(pushItems);
    return Array.from(mergedMap.values());
  }

  function parseStoredResultTimestamp(result){
    const dateStr = String(result?.date || '').trim();
    const timeStr = String(result?.startedAt || '').trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const direct = Date.parse(`${dateStr}T${timeStr || '00:00'}`);
      if (Number.isFinite(direct)) return direct;

      const match12h = timeStr.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
      if (match12h) {
        let hours = Number(match12h[1]) % 12;
        const minutes = Number(match12h[2]);
        const meridiem = match12h[3].toUpperCase();
        if (meridiem === 'PM') hours += 12;
        const rebuilt = Date.parse(`${dateStr}T${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:00`);
        if (Number.isFinite(rebuilt)) return rebuilt;
      }
    }

    const created = Date.parse(result?.createdAt || result?.updatedAt || '');
    if (Number.isFinite(created)) return created;

    const fallback = Date.parse(dateStr);
    if (Number.isFinite(fallback)) return fallback;

    const idMatch = String(result?.id || '').match(/(\d{13})/);
    if (idMatch) return Number(idMatch[1]);

    return 0;
  }

  function loadStoredResults(config){
    const readingTests = loadModeResultsFromKeys(config.readingKeys, 'reading', config.normalizeTestResult);
    const writingTests = loadModeResultsFromKeys(config.writingKeys, 'writing', config.normalizeTestResult);
    const tests = [...readingTests, ...writingTests].sort((a,b) => parseStoredResultTimestamp(b) - parseStoredResultTimestamp(a));
    const averages = [
      config.buildAverageResult('reading', readingTests),
      config.buildAverageResult('writing', writingTests)
    ].filter(Boolean);
    return [...averages, ...tests];
  }

  window.ModeAtlasResultsEngine = {
    safeParse,
    loadJSON,
    readArraysFromKeys,
    loadModeResultsFromKeys,
    parseStoredResultTimestamp,
    loadStoredResults
  };
})();
