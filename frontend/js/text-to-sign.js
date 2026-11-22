/**
 * SignConnect AI - Text to Sign Language Module
 * Converts textual input into sequential Indian Sign Language (ISL) visual demonstrations,
 * provides token breakdown, sequential playback engine, and linguistic grammar notes.
 */

let demonstrationQueue = [];
let playbackIndex = 0;
let playbackTimer = null;
let playbackSpeed = 1000; // ms per sign

document.addEventListener('DOMContentLoaded', () => {
  initTextToSignControls();
  initPresetButtons();
});

function initTextToSignControls() {
  const form = document.getElementById('textToSignForm');
  const input = document.getElementById('textSignInput');
  const btnClear = document.getElementById('btnClearTextInput');
  const btnPlayAll = document.getElementById('btnPlaySignSequence');
  const btnPause = document.getElementById('btnPauseSignSequence');
  const speedSelect = document.getElementById('playbackSpeedSelect');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      convertCurrentText();
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (input) input.value = '';
      clearDemonstrations();
    });
  }

  if (btnPlayAll) {
    btnPlayAll.addEventListener('click', () => {
      startPlayback();
    });
  }

  if (btnPause) {
    btnPause.addEventListener('click', () => {
      pausePlayback();
    });
  }

  if (speedSelect) {
    speedSelect.addEventListener('change', (e) => {
      const multiplier = parseFloat(e.target.value) || 1;
      playbackSpeed = 1000 / multiplier;
      if (playbackTimer) {
        pausePlayback();
        startPlayback();
      }
    });
  }
}

// Preset sentence pills
function initPresetButtons() {
  const pills = document.querySelectorAll('.preset-sentence-pill');
  const input = document.getElementById('textSignInput');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const text = pill.getAttribute('data-text');
      if (input) {
        input.value = text;
        convertCurrentText();
      }
    });
  });
}

// Main conversion logic
function convertCurrentText() {
  const input = document.getElementById('textSignInput');
  if (!input || !window.ISL_DATA) return;

  const rawText = input.value.trim().toUpperCase();
  if (!rawText) {
    SignConnect.showToast('Please enter words or a sentence to convert.', 'warning');
    return;
  }

  // Tokenize into words and recognize phrases
  demonstrationQueue = parseTextToTokens(rawText);
  renderTokens(demonstrationQueue);
  renderSignCards(demonstrationQueue);

  // Enable playback controls
  const playControls = document.getElementById('playbackControlsBar');
  if (playControls) playControls.style.display = 'flex';

  playbackIndex = 0;
}

// Parse text into recognized words, phrases or fallback letters
function parseTextToTokens(text) {
  const tokens = [];
  
  // Clean punctuation
  const clean = text.replace(/[^A-Z0-9\s]/g, ' ');
  const words = clean.split(/\s+/).filter(Boolean);

  let i = 0;
  while (i < words.length) {
    // Check 3-word phrase (e.g. WHAT IS YOUR)
    const threeWord = (words[i] + ' ' + (words[i+1]||'') + ' ' + (words[i+2]||'')).trim();
    if (threeWord === 'WHAT IS YOUR' || threeWord === 'WHAT IS YOUR NAME') {
      const match = window.ISL_DATA.getSign('what_is_your_name');
      tokens.push({ type: 'phrase', label: 'WHAT IS YOUR NAME?', sign: match, supported: true });
      i += (threeWord === 'WHAT IS YOUR NAME' ? 4 : 3);
      continue;
    }

    // Check 2-word phrases
    const twoWord = (words[i] + ' ' + (words[i+1]||'')).trim();
    if (twoWord === 'GOOD MORNING') {
      const match = window.ISL_DATA.getSign('good_morning');
      tokens.push({ type: 'phrase', label: 'GOOD MORNING', sign: match, supported: true });
      i += 2;
      continue;
    }
    if (twoWord === 'THANK YOU') {
      const match = window.ISL_DATA.getSign('thank_you');
      tokens.push({ type: 'phrase', label: 'THANK YOU', sign: match, supported: true });
      i += 2;
      continue;
    }
    if (twoWord === 'HOW ARE YOU' || twoWord === 'HOW ARE') {
      const match = window.ISL_DATA.getSign('how_are_you');
      tokens.push({ type: 'phrase', label: 'HOW ARE YOU?', sign: match, supported: true });
      i += (twoWord === 'HOW ARE YOU' ? 3 : 2);
      continue;
    }

    // Check 1-word exact match
    const currentWord = words[i];
    const match = window.ISL_DATA.getSign(currentWord);

    if (match) {
      tokens.push({ type: 'word', label: match.label.toUpperCase(), sign: match, supported: true });
    } else {
      // Word is not in standard vocabulary -> Break down into ISL finger-spelling!
      const letterTokens = [];
      for (const char of currentWord) {
        const charMatch = window.ISL_DATA.getSign(char);
        letterTokens.push({
          type: 'letter',
          label: char,
          sign: charMatch,
          supported: !!charMatch
        });
      }
      tokens.push({
        type: 'fingerspell',
        label: currentWord,
        letters: letterTokens,
        supported: false
      });
    }
    i++;
  }

  return tokens;
}

// Render token chips
function renderTokens(tokens) {
  const container = document.getElementById('tokensContainer');
  if (!container) return;

  container.innerHTML = tokens.map((tok, idx) => {
    if (tok.supported) {
      return `<span class="token-chip" onclick="jumpToSign(${idx})">${tok.label}</span>`;
    } else {
      return `<span class="token-chip unsupported" onclick="jumpToSign(${idx})" title="Word not in core dictionary - Finger-spelled via ISL alphabets">${tok.label} (Fingerspell)</span>`;
    }
  }).join('');
}

// Render Demonstration Cards Carousel
function renderSignCards(tokens) {
  const container = document.getElementById('signCardsCarousel');
  const noticeBox = document.getElementById('unsupportedNoticeBox');
  if (!container) return;

  let hasUnsupported = false;
  let flattenedCards = [];

  tokens.forEach((tok, tokIdx) => {
    if (tok.supported && tok.sign) {
      flattenedCards.push({
        tokenIndex: tokIdx,
        sign: tok.sign,
        title: tok.label,
        sub: 'ISL Vocabulary Sign',
        badge: tok.sign.twoHanded ? '2 Hands' : '1 Hand'
      });
    } else if (tok.letters) {
      hasUnsupported = true;
      tok.letters.forEach(l => {
        if (l.sign) {
          flattenedCards.push({
            tokenIndex: tokIdx,
            sign: l.sign,
            title: `Letter ${l.label}`,
            sub: `Finger-spelling: ${tok.label}`,
            badge: 'ISL Alphabet'
          });
        }
      });
    }
  });

  // Store for player
  window._flattenedPlaybackCards = flattenedCards;

  if (flattenedCards.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-4 text-muted">
        No sign demonstrations available for this input.
      </div>
    `;
    return;
  }

  container.innerHTML = flattenedCards.map((item, idx) => `
    <div class="sign-demo-card" id="demoCard_${idx}">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="badge bg-primary-subtle text-primary fw-bold">${item.badge}</span>
        <span class="badge bg-light text-dark">Step ${idx + 1}</span>
      </div>
      <div class="py-2">
        <img src="assets/images/isl_${item.sign.id}.svg" alt="${item.title}" style="max-height: 120px; width: 100%; object-fit: contain;">
      </div>
      <h6 class="fw-bold mb-1 mt-2">${item.title}</h6>
      <p class="text-secondary small mb-2">${item.sub}</p>
      <button class="btn btn-outline-primary btn-sm w-100" onclick="SignConnect.speakText('${item.title}')">
        <i class="bi bi-volume-up"></i> Listen
      </button>
    </div>
  `).join('');

  if (noticeBox) {
    noticeBox.style.display = hasUnsupported ? 'block' : 'none';
  }
}

// Playback Engine
function startPlayback() {
  const cards = window._flattenedPlaybackCards;
  if (!cards || cards.length === 0) return;

  const btnPlay = document.getElementById('btnPlaySignSequence');
  const btnPause = document.getElementById('btnPauseSignSequence');

  if (btnPlay) btnPlay.style.display = 'none';
  if (btnPause) btnPause.style.display = 'inline-flex';

  if (playbackIndex >= cards.length) {
    playbackIndex = 0;
  }

  highlightActiveCard(playbackIndex);

  playbackTimer = setInterval(() => {
    playbackIndex++;
    if (playbackIndex >= cards.length) {
      pausePlayback();
      playbackIndex = 0;
      SignConnect.showToast('Sequence demonstration completed.', 'info');
      return;
    }
    highlightActiveCard(playbackIndex);
  }, playbackSpeed);
}

function pausePlayback() {
  if (playbackTimer) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }
  const btnPlay = document.getElementById('btnPlaySignSequence');
  const btnPause = document.getElementById('btnPauseSignSequence');
  if (btnPlay) btnPlay.style.display = 'inline-flex';
  if (btnPause) btnPause.style.display = 'none';
}

function highlightActiveCard(idx) {
  const cards = window._flattenedPlaybackCards;
  if (!cards) return;

  document.querySelectorAll('.sign-demo-card').forEach(c => c.classList.remove('active-playback'));

  const activeCard = document.getElementById(`demoCard_${idx}`);
  if (activeCard) {
    activeCard.classList.add('active-playback');
    activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    // Highlight corresponding token chip
    const tokenIdx = cards[idx].tokenIndex;
    const chips = document.querySelectorAll('.token-chip');
    chips.forEach(c => c.classList.remove('active'));
    if (chips[tokenIdx]) {
      chips[tokenIdx].classList.add('active');
    }
  }
}

function jumpToSign(tokenIdx) {
  const cards = window._flattenedPlaybackCards;
  if (!cards) return;
  const matchIdx = cards.findIndex(c => c.tokenIndex === tokenIdx);
  if (matchIdx !== -1) {
    playbackIndex = matchIdx;
    highlightActiveCard(matchIdx);
  }
}

function clearDemonstrations() {
  pausePlayback();
  demonstrationQueue = [];
  playbackIndex = 0;
  window._flattenedPlaybackCards = [];
  
  const container = document.getElementById('signCardsCarousel');
  const tokens = document.getElementById('tokensContainer');
  const noticeBox = document.getElementById('unsupportedNoticeBox');
  const playControls = document.getElementById('playbackControlsBar');

  if (container) container.innerHTML = '<div class="col-12 text-center py-4 text-muted">Enter words above and click "Convert to Sign" to see sign demonstrations.</div>';
  if (tokens) tokens.innerHTML = '';
  if (noticeBox) noticeBox.style.display = 'none';
  if (playControls) playControls.style.display = 'none';
}
