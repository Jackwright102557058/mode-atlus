let cloudHydration = Promise.resolve(false);
try {
  if (window.KanaCloudSync) {
    window.KanaCloudSync.bindUi({
      signInBtn: document.getElementById('profileSignInBtn'),
      signOutBtn: document.getElementById('profileSignOutBtn'),
      statusEl: document.getElementById('profileStatus'),
      nameEl: document.getElementById('profileName'),
      emailEl: document.getElementById('profileEmail'),
      photoEl: document.getElementById('profileAvatar')
    });
    cloudHydration = window.KanaCloudSync.beforePageLoad().then(() => true).catch((error) => {
      console.warn('Word Bank cloud hydration failed.', error);
      return false;
    });
    document.getElementById('profileSignInBtn')?.addEventListener('click', () => {
      setTimeout(() => {
        wordBank = loadWordBank();
        renderEntries();
        updateTopProfileDot();
      }, 1200);
    });
    document.getElementById('profileSignOutBtn')?.addEventListener('click', () => {
      setTimeout(updateTopProfileDot, 400);
    });
  }
} catch (error) {
  console.warn('Cloud save controls could not load on Word Bank.', error);
  const status = document.getElementById('profileStatus');
  if (status) status.textContent = 'Cloud sign-in could not load on this page.';
}

function updateTopProfileDot() {
  const dot = document.getElementById('topProfileDot');
  const user = window.KanaCloudSync?.getUser?.();
  if (!dot) return;
  if (user?.photoURL) {
    dot.innerHTML = `<img src="${user.photoURL}" alt="" />`;
  } else {
    dot.textContent = user?.displayName?.trim()?.[0]?.toUpperCase() || 'M';
  }
}

    const STORAGE_KEY = 'kanaWordBank';

    const elements = {
      kanaInput: document.getElementById('kanaInput'),
      addWordBtn: document.getElementById('addWordBtn'),
      clearInputBtn: document.getElementById('clearInputBtn'),
      statusMsg: document.getElementById('statusMsg'),
      entries: document.getElementById('entries'),
      searchInput: document.getElementById('searchInput'),
      sortSelect: document.getElementById('sortSelect'),
      filterSelect: document.getElementById('filterSelect'),
      exportBtn: document.getElementById('exportBtn'),
      importFile: document.getElementById('importFile'),
      clearAllBtn: document.getElementById('clearAllBtn'),
      statTotal: document.getElementById('statTotal'),
      statEnglish: document.getElementById('statEnglish'),
      statFavorites: document.getElementById('statFavorites'),
      statMissing: document.getElementById('statMissing')
    };

    const baseMap = {
      'あ':'a','い':'i','う':'u','え':'e','お':'o',
      'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
      'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so',
      'た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
      'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
      'は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
      'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
      'や':'ya','ゆ':'yu','よ':'yo',
      'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
      'わ':'wa','を':'wo','ん':'n',
      'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
      'ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
      'だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do',
      'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
      'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
      'ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o',
      'ゔ':'vu','ゎ':'wa',
      'ア':'a','イ':'i','ウ':'u','エ':'e','オ':'o',
      'カ':'ka','キ':'ki','ク':'ku','ケ':'ke','コ':'ko',
      'サ':'sa','シ':'shi','ス':'su','セ':'se','ソ':'so',
      'タ':'ta','チ':'chi','ツ':'tsu','テ':'te','ト':'to',
      'ナ':'na','ニ':'ni','ヌ':'nu','ネ':'ne','ノ':'no',
      'ハ':'ha','ヒ':'hi','フ':'fu','ヘ':'he','ホ':'ho',
      'マ':'ma','ミ':'mi','ム':'mu','メ':'me','モ':'mo',
      'ヤ':'ya','ユ':'yu','ヨ':'yo',
      'ラ':'ra','リ':'ri','ル':'ru','レ':'re','ロ':'ro',
      'ワ':'wa','ヲ':'wo','ン':'n',
      'ガ':'ga','ギ':'gi','グ':'gu','ゲ':'ge','ゴ':'go',
      'ザ':'za','ジ':'ji','ズ':'zu','ゼ':'ze','ゾ':'zo',
      'ダ':'da','ヂ':'ji','ヅ':'zu','デ':'de','ド':'do',
      'バ':'ba','ビ':'bi','ブ':'bu','ベ':'be','ボ':'bo',
      'パ':'pa','ピ':'pi','プ':'pu','ペ':'pe','ポ':'po',
      'ァ':'a','ィ':'i','ゥ':'u','ェ':'e','ォ':'o',
      'ヴ':'vu','ヮ':'wa'
    };

    const yoonMap = {
      'きゃ':'kya','きゅ':'kyu','きょ':'kyo','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
      'しゃ':'sha','しゅ':'shu','しょ':'sho','じゃ':'ja','じゅ':'ju','じょ':'jo',
      'ちゃ':'cha','ちゅ':'chu','ちょ':'cho',
      'にゃ':'nya','にゅ':'nyu','にょ':'nyo','ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo',
      'びゃ':'bya','びゅ':'byu','びょ':'byo','ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo',
      'みゃ':'mya','みゅ':'myu','みょ':'myo','りゃ':'rya','りゅ':'ryu','りょ':'ryo',
      'ゔぁ':'va','ゔぃ':'vi','ゔぇ':'ve','ゔぉ':'vo','ゔゅ':'vyu',
      'シェ':'she','ジェ':'je','チェ':'che','ティ':'ti','ディ':'di','トゥ':'tu','ドゥ':'du',
      'ファ':'fa','フィ':'fi','フェ':'fe','フォ':'fo','フュ':'fyu',
      'ウィ':'wi','ウェ':'we','ウォ':'wo',
      'ヴァ':'va','ヴィ':'vi','ヴェ':'ve','ヴォ':'vo','ヴュ':'vyu',
      'キャ':'kya','キュ':'kyu','キョ':'kyo','ギャ':'gya','ギュ':'gyu','ギョ':'gyo',
      'シャ':'sha','シュ':'shu','ショ':'sho','ジャ':'ja','ジュ':'ju','ジョ':'jo',
      'チャ':'cha','チュ':'chu','チョ':'cho',
      'ニャ':'nya','ニュ':'nyu','ニョ':'nyo','ヒャ':'hya','ヒュ':'hyu','ヒョ':'hyo',
      'ビャ':'bya','ビュ':'byu','ビョ':'byo','ピャ':'pya','ピュ':'pyu','ピョ':'pyo',
      'ミャ':'mya','ミュ':'myu','ミョ':'myo','リャ':'rya','リュ':'ryu','リョ':'ryo'
    };

    let wordBank = loadWordBank();
    const expandedEntries = new Set();

    function loadWordBank() {
      try {
        const parsed = window.ModeAtlasStorage.json(STORAGE_KEY, []);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    function saveWordBank() {
      window.KanaCloudSync?.markSectionUpdated("wordBank");
      window.ModeAtlasStorage.setJSON(STORAGE_KEY, wordBank);
      window.ModeAtlasStorage.now("kanaWordBankUpdatedAt");
      window.KanaCloudSync?.scheduleSync();
    }

    function normalizeKana(value) {
      return (value || '').trim().replace(/\s+/g, '');
    }

    function getTimestamp() {
      return new Date().toISOString();
    }

    function showStatus(message, type = 'ok') {
      elements.statusMsg.textContent = message;
      elements.statusMsg.className = `status ${type}`;
    }

    function clearStatus() {
      elements.statusMsg.textContent = '';
      elements.statusMsg.className = 'status';
    }

    function getRomajiForKana(input) {
      const kana = normalizeKana(input);
      if (!kana) return '';

      let result = '';
      let geminate = false;

      for (let i = 0; i < kana.length; i++) {
        const char = kana[i];
        const next = kana[i + 1] || '';
        const pair = char + next;

        if (char === 'っ' || char === 'ッ') {
          geminate = true;
          continue;
        }

        if (char === 'ー') {
          const lastVowel = getLastVowel(result);
          if (lastVowel) result += lastVowel;
          continue;
        }

        let chunk = '';
        let consumedPair = false;

        if (yoonMap[pair]) {
          chunk = yoonMap[pair];
          consumedPair = true;
        } else {
          chunk = baseMap[char] || char;
        }

        if (geminate && chunk) {
          const consonant = getLeadingConsonant(chunk);
          if (consonant) result += consonant;
          geminate = false;
        }

        result += chunk;
        if (consumedPair) i++;
      }

      result = result.replace(/nn([bmp])/g, 'n$1');
      return result;
    }

    function getLeadingConsonant(chunk) {
      const match = chunk.match(/^[^aeiou]+/i);
      if (!match) return '';
      if (match[0] === 'ch') return 'c';
      if (match[0] === 'sh') return 's';
      if (match[0] === 'ts') return 't';
      return match[0][0] || '';
    }

    function getLastVowel(text) {
      const match = text.match(/[aeiou](?!.*[aeiou])/i);
      return match ? match[0].toLowerCase() : '';
    }

    function classifyKanaType(kana) {
      if (!kana) return 'mixed';
      const onlyHiragana = /^[\u3041-\u3096ー]+$/.test(kana);
      const onlyKatakana = /^[\u30A1-\u30FA\u30FC]+$/.test(kana);
      if (onlyHiragana) return 'hiragana';
      if (onlyKatakana) return 'katakana';
      return 'mixed';
    }

    function buildEntry(kana) {
      const now = getTimestamp();
      return {
        id: `wb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        kana,
        romaji: getRomajiForKana(kana),
        english: '',
        notes: '',
        favorite: false,
        createdAt: now,
        updatedAt: now
      };
    }

    function addWord() {
      const kana = normalizeKana(elements.kanaInput.value);
      if (!kana) {
        showStatus('Enter a kana word first.', 'warn');
        return;
      }

      const existing = wordBank.find(entry => entry.kana === kana);
      if (existing) {
        showStatus(`"${kana}" is already in your word bank.`, 'warn');
        renderEntries(existing.id);
        return;
      }

      const entry = buildEntry(kana);
      wordBank.unshift(entry);
      expandedEntries.add(entry.id);
      saveWordBank();
      elements.kanaInput.value = '';
      clearStatus();
      showStatus(`Added ${kana} to your word bank.`, 'ok');
      renderEntries(entry.id);
      elements.kanaInput.focus();
    }

    function updateEntry(id, patch) {
      const index = wordBank.findIndex(entry => entry.id === id);
      if (index === -1) return;

      const next = { ...wordBank[index], ...patch, updatedAt: getTimestamp() };
      next.kana = normalizeKana(next.kana);
      next.romaji = getRomajiForKana(next.kana);
      wordBank[index] = next;
      saveWordBank();
      renderEntries(id);
    }

    function deleteEntry(id) {
      const entry = wordBank.find(item => item.id === id);
      if (!entry) return;
      const confirmed = window.confirm(`Delete "${entry.kana}" from your word bank?`);
      if (!confirmed) return;
      wordBank = wordBank.filter(item => item.id !== id);
      saveWordBank();
      renderEntries();
      showStatus(`Deleted ${entry.kana}.`, 'ok');
    }

    function clearAllWords() {
      if (!wordBank.length) {
        showStatus('Your word bank is already empty.', 'warn');
        return;
      }
      const confirmed = window.confirm('Clear your entire word bank? This cannot be undone.');
      if (!confirmed) return;
      wordBank = [];
      saveWordBank();
      renderEntries();
      showStatus('All words cleared.', 'ok');
    }

    function exportBank() {
      const blob = new Blob([JSON.stringify(wordBank, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kana-word-bank.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showStatus('Word bank exported.', 'ok');
    }

    function importBank(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result);
          if (!Array.isArray(imported)) throw new Error('Invalid format');

          const merged = [...wordBank];
          for (const raw of imported) {
            if (!raw || typeof raw !== 'object') continue;
            const kana = normalizeKana(raw.kana || '');
            if (!kana) continue;

            const incoming = {
              id: raw.id || `wb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              kana,
              romaji: getRomajiForKana(kana),
              english: String(raw.english || ''),
              notes: String(raw.notes || ''),
              favorite: Boolean(raw.favorite),
              createdAt: raw.createdAt || getTimestamp(),
              updatedAt: raw.updatedAt || raw.createdAt || getTimestamp()
            };

            const existingIndex = merged.findIndex(entry => entry.kana === incoming.kana);
            if (existingIndex === -1) {
              merged.push(incoming);
            } else {
              const existingDate = new Date(merged[existingIndex].updatedAt || 0).getTime();
              const incomingDate = new Date(incoming.updatedAt || 0).getTime();
              if (incomingDate >= existingDate) merged[existingIndex] = incoming;
            }
          }

          wordBank = merged;
          saveWordBank();
          renderEntries();
          showStatus('Import complete.', 'ok');
        } catch {
          showStatus('Import failed. Please use a valid word bank JSON file.', 'err');
        } finally {
          elements.importFile.value = '';
        }
      };
      reader.readAsText(file);
    }

    function getFilteredEntries() {
      const query = elements.searchInput.value.trim().toLowerCase();
      const sort = elements.sortSelect.value;
      const filter = elements.filterSelect.value;

      let items = wordBank.filter(entry => {
        const type = classifyKanaType(entry.kana);
        const matchesQuery = !query || [entry.kana, entry.romaji, entry.english, entry.notes]
          .join(' ')
          .toLowerCase()
          .includes(query);

        let matchesFilter = true;
        if (filter === 'favorites') matchesFilter = entry.favorite;
        else if (filter === 'missingEnglish') matchesFilter = !entry.english.trim();
        else if (filter === 'withNotes') matchesFilter = !!entry.notes.trim();
        else if (filter === 'hiragana') matchesFilter = type === 'hiragana';
        else if (filter === 'katakana') matchesFilter = type === 'katakana';
        else if (filter === 'mixed') matchesFilter = type === 'mixed';

        return matchesQuery && matchesFilter;
      });

      items.sort((a, b) => {
        if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sort === 'updated') return new Date(b.updatedAt) - new Date(a.updatedAt);
        if (sort === 'kanaAZ') return a.kana.localeCompare(b.kana, 'ja');
        if (sort === 'kanaZA') return b.kana.localeCompare(a.kana, 'ja');
        if (sort === 'romajiAZ') return a.romaji.localeCompare(b.romaji);
        if (sort === 'englishAZ') return (a.english || '').localeCompare(b.english || '');
        return 0;
      });

      return items;
    }

    function updateStats() {
      const total = wordBank.length;
      const withEnglish = wordBank.filter(entry => entry.english.trim()).length;
      const favorites = wordBank.filter(entry => entry.favorite).length;
      const missingEnglish = total - withEnglish;
      elements.statTotal.textContent = total;
      elements.statEnglish.textContent = withEnglish;
      elements.statFavorites.textContent = favorites;
      elements.statMissing.textContent = missingEnglish;
    }

    function formatDate(iso) {
      if (!iso) return 'Unknown';
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return 'Unknown';
      return date.toLocaleString([], {
        year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
      });
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderEntries(focusId = null) {
      updateStats();
      const items = getFilteredEntries();

      if (!items.length) {
        elements.entries.innerHTML = '<div class="empty">No matching words yet. Add one above to get started.</div>';
        return;
      }

      elements.entries.innerHTML = items.map(entry => {
        const type = classifyKanaType(entry.kana);
        const englishMissing = !entry.english.trim();
        const isExpanded = expandedEntries.has(entry.id);
        return `
          <details class="card" id="entry-${entry.id}" ${isExpanded ? 'open' : ''}>
            <summary class="card-summary" data-id="${entry.id}">
              <div class="card-summary-main">
                <div class="kana">${escapeHtml(entry.kana)}</div>
                <div class="romaji">${escapeHtml(entry.romaji || '—')}</div>
              </div>
              <div class="summary-col">
                <div class="summary-label">English</div>
                <div class="summary-value">${escapeHtml(entry.english || '—')}</div>
              </div>
              <div class="summary-col">
                <div class="summary-label">Type</div>
                <div class="summary-value">${escapeHtml(type)}${entry.favorite ? ' · ★' : ''}${englishMissing ? ' · missing' : ''}</div>
              </div>
              <div class="summary-col summary-date">
                <div class="summary-label">Date added</div>
                <div class="summary-value">${escapeHtml(formatDate(entry.createdAt))}</div>
              </div>
              <div class="summary-toggle">${isExpanded ? '−' : '+'}</div>
            </summary>

            <div class="card-body">
              <div class="card-top">
                <div class="meta">
                  <span class="tag">${type}</span>
                  ${englishMissing ? '<span class="tag">missing English</span>' : ''}
                  <button class="btn-secondary star-btn" type="button" data-action="favorite" data-id="${entry.id}" title="Toggle favourite">${entry.favorite ? '★' : '☆'}</button>
                </div>
              </div>

              <div class="fields">
                <div class="field-grid">
                  <div class="field-small">
                    <label for="kana-${entry.id}">Kana</label>
                    <input id="kana-${entry.id}" type="text" name="kana_word_${entry.id}" value="${escapeHtml(entry.kana)}" data-field="kana" data-id="${entry.id}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" />
                  </div>
                  <div class="field-small">
                    <label for="english-${entry.id}">English</label>
                    <input id="english-${entry.id}" type="text" name="word_english_${entry.id}" value="${escapeHtml(entry.english)}" placeholder="Add meaning now or later" data-field="english" data-id="${entry.id}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" />
                  </div>
                </div>
                <div class="field-grid single">
                  <div class="field-small">
                    <label for="notes-${entry.id}">Notes</label>
                    <textarea id="notes-${entry.id}" name="word_notes_${entry.id}" data-field="notes" data-id="${entry.id}" placeholder="Add notes, usage, reminders, mnemonics, etc." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">${escapeHtml(entry.notes)}</textarea>
                  </div>
                </div>
              </div>

              <div class="card-actions">
                <div class="small-muted">Added ${formatDate(entry.createdAt)} · Updated ${formatDate(entry.updatedAt)}</div>
                <div class="inline-actions">
                  <button class="btn-primary" type="button" data-action="save" data-id="${entry.id}">Save Changes</button>
                  <button class="btn-danger" type="button" data-action="delete" data-id="${entry.id}">Delete</button>
                </div>
              </div>
            </div>
          </details>
        `;
      }).join('');

      if (focusId) {
        const target = document.getElementById(`entry-${focusId}`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    elements.addWordBtn.addEventListener('click', addWord);
    elements.clearInputBtn.addEventListener('click', () => {
      elements.kanaInput.value = '';
      clearStatus();
      elements.kanaInput.focus();
    });

    elements.kanaInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        addWord();
      }
    });

    [elements.searchInput, elements.sortSelect, elements.filterSelect].forEach(el => {
      el.addEventListener('input', () => renderEntries());
      el.addEventListener('change', () => renderEntries());
    });

    elements.entries.addEventListener('toggle', event => {
      const details = event.target.closest('details.card');
      if (!details) return;
      const id = details.id.replace('entry-', '');
      if (details.open) expandedEntries.add(id);
      else expandedEntries.delete(id);
      const toggleEl = details.querySelector('.summary-toggle');
      if (toggleEl) toggleEl.textContent = details.open ? '−' : '+';
    });

    elements.entries.addEventListener('click', event => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const id = button.dataset.id;
      const action = button.dataset.action;

      if (action === 'delete') {
        deleteEntry(id);
        return;
      }

      if (action === 'favorite') {
        const current = wordBank.find(entry => entry.id === id);
        if (!current) return;
        updateEntry(id, { favorite: !current.favorite });
        return;
      }

      if (action === 'save') {
        const kanaField = document.querySelector(`[data-field="kana"][data-id="${id}"]`);
        const englishField = document.querySelector(`[data-field="english"][data-id="${id}"]`);
        const notesField = document.querySelector(`[data-field="notes"][data-id="${id}"]`);
        const nextKana = normalizeKana(kanaField?.value || '');
        if (!nextKana) {
          showStatus('Kana cannot be empty.', 'err');
          return;
        }

        const duplicate = wordBank.find(entry => entry.id !== id && entry.kana === nextKana);
        if (duplicate) {
          showStatus(`Cannot save. "${nextKana}" already exists in your word bank.`, 'err');
          renderEntries(duplicate.id);
          return;
        }

        updateEntry(id, {
          kana: nextKana,
          english: (englishField?.value || '').trim(),
          notes: (notesField?.value || '').trim()
        });
        showStatus(`Saved ${nextKana}.`, 'ok');
      }
    });


    elements.exportBtn.addEventListener('click', exportBank);
    elements.importFile.addEventListener('change', event => importBank(event.target.files?.[0]));
    elements.clearAllBtn.addEventListener('click', clearAllWords);

    renderEntries();
    cloudHydration.then(() => {
      wordBank = loadWordBank();
      renderEntries();
      updateTopProfileDot();
    });
    window.KanaCloudSync?.ready?.then(updateTopProfileDot);
    window.addEventListener('focus', () => {
      wordBank = loadWordBank();
      renderEntries();
      updateTopProfileDot();
    });
    elements.kanaInput.focus();
  
