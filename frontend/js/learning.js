/**
 * SignConnect AI - Learning Module Script
 * Handles ISL curriculum browsing, multi-factor search (alphabet, word, sign name),
 * verified category filtering, audio speech synthesis, and detailed modal views.
 */

let activeCategory = 'all';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  initCategories();
  initSearch();
  renderSigns();

  // Check URL query parameters for direct sign modal opening (e.g. learn.html?sign=hello)
  const urlParams = new URLSearchParams(window.location.search);
  const signId = urlParams.get('sign');
  if (signId) {
    setTimeout(() => {
      openSignModal(signId);
    }, 250);
  }
});

// Category Filter Tabs (All Signs, Alphabets, Numbers, Greetings, Common Words)
function initCategories() {
  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.getAttribute('data-category');
      renderSigns();
    });
  });
}

// Live Search Input (Filters by alphabet letter, word, sign name, or description)
function initSearch() {
  const searchInput = document.getElementById('searchSignsInput');
  const clearBtn = document.getElementById('clearSearchBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      if (clearBtn) {
        clearBtn.style.display = searchQuery ? 'inline-flex' : 'none';
      }
      renderSigns();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchQuery = '';
        clearBtn.style.display = 'none';
        renderSigns();
        searchInput.focus();
      }
    });
  }
}

// Render Signs Grid based on active category & search query
function renderSigns() {
  const container = document.getElementById('signsGridContainer');
  const countBadge = document.getElementById('signsCountBadge');
  if (!container || !window.ISL_DATA) return;

  const signs = window.ISL_DATA.searchSigns(searchQuery, activeCategory);

  if (countBadge) {
    countBadge.textContent = `${signs.length} Signs Available`;
  }

  if (signs.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="p-4 bg-white rounded-4 border shadow-sm max-w-500 mx-auto">
          <i class="bi bi-search fs-1 text-primary mb-3 d-block"></i>
          <h5 class="fw-bold mb-1">No Matching Signs Found</h5>
          <p class="text-secondary small mb-3">
            No Indian Sign Language gesture matched "<strong>${escapeHtml(searchQuery)}</strong>" in category "<strong>${escapeHtml(activeCategory)}</strong>".
          </p>
          <button class="btn btn-primary btn-sm" onclick="resetFilters()">
            <i class="bi bi-arrow-repeat me-1"></i> Reset Filters
          </button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = signs.map(sign => {
    const isTwo = sign.twoHanded;
    const handBadgeClass = isTwo ? 'bg-primary-subtle text-primary border border-primary border-opacity-25' : 'bg-info-subtle text-info border border-info border-opacity-25';
    const handLabel = isTwo ? '2 Hands' : '1 Hand';

    return `
      <div class="sign-card">
        <div class="sign-card-thumb" onclick="openSignModal('${sign.id}')" role="button" title="Click to view details for ${sign.title}">
          <span class="sign-badge-isl"><i class="bi bi-patch-check-fill me-1 text-success"></i>ISL</span>
          <img src="assets/images/isl_${sign.id}.svg" alt="${sign.title}" loading="lazy">
        </div>
        <div class="sign-card-body">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="sign-card-category">${sign.category}</span>
            <span class="badge ${handBadgeClass} fs-8">${handLabel}</span>
          </div>
          <div class="sign-card-title">
            <span class="text-truncate">${sign.label}</span>
          </div>
          <div class="small text-muted mb-2">${sign.pronunciation || ''}</div>
          <p class="sign-card-desc mb-3">${sign.desc}</p>
          <div class="sign-card-footer mt-auto">
            <button type="button" class="btn btn-primary btn-sm flex-grow-1" onclick="openSignModal('${sign.id}')">
              <i class="bi bi-eye"></i> View Sign
            </button>
            <a href="practice.html?sign=${sign.id}" class="btn btn-outline-primary btn-sm" title="Practice ${sign.title} with Webcam">
              <i class="bi bi-camera-video"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Reset all filters to default
function resetFilters() {
  activeCategory = 'all';
  searchQuery = '';
  const searchInput = document.getElementById('searchSignsInput');
  if (searchInput) searchInput.value = '';
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) clearBtn.style.display = 'none';

  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(p => p.classList.remove('active'));
  const allPill = document.querySelector('.category-pill[data-category="all"]');
  if (allPill) allPill.classList.add('active');

  renderSigns();
}

// Open Sign Detail Modal with full authentic Indian Sign Language specifications
function openSignModal(signId) {
  if (!window.ISL_DATA) return;
  const sign = window.ISL_DATA.getSign(signId);
  if (!sign) return;

  const modalEl = document.getElementById('signDetailModal');
  if (!modalEl) return;

  // 1. Sign name & category
  document.getElementById('modalSignTitle').textContent = `${sign.title} (ISL)`;
  document.getElementById('modalSignCategory').textContent = sign.category;

  // 2. One-handed vs Two-handed badge
  const handTypeEl = document.getElementById('modalSignHandType');
  if (handTypeEl) {
    handTypeEl.textContent = sign.twoHanded ? 'Two-Handed Gesture' : 'Single-Handed Gesture';
    handTypeEl.className = sign.twoHanded 
      ? 'position-absolute top-0 start-0 m-3 badge bg-primary text-white' 
      : 'position-absolute top-0 start-0 m-3 badge bg-info text-white';
  }

  // 3. Authentic ISL demonstration image
  const imgEl = document.getElementById('modalSignImage');
  if (imgEl) {
    imgEl.src = `assets/images/isl_${sign.id}.svg`;
    imgEl.alt = `${sign.title} Indian Sign Language Demonstration`;
  }

  // 4. Pronunciation
  const pronEl = document.getElementById('modalSignPronunciation');
  if (pronEl) {
    pronEl.textContent = sign.pronunciation || '/--/';
  }

  // 5. Explanation & Linguistic Concept
  const descEl = document.getElementById('modalSignDescription');
  if (descEl) {
    descEl.textContent = sign.desc;
  }

  // 6. One-Handed and Two-Handed Variations
  const varEl = document.getElementById('modalSignVariations');
  if (varEl) {
    varEl.textContent = sign.variations || 'Standard Indian Sign Language national configuration.';
  }

  // 7. Step-by-Step Hand Positioning Instructions
  const instructionsList = document.getElementById('modalSignInstructions');
  if (instructionsList) {
    const steps = sign.stepByStep || (sign.instructions ? sign.instructions.split('\n').filter(s => s.trim()) : []);
    instructionsList.innerHTML = steps.map((step, idx) => `
      <div class="instruction-step">
        <div class="step-bullet">${idx + 1}</div>
        <div class="text-secondary small fw-medium">${step.replace(/^\d+\.\s*/, '')}</div>
      </div>
    `).join('');
  }

  // 8. Non-Manual Markers & Facial Expression
  const nonManualEl = document.getElementById('modalSignNonManual');
  if (nonManualEl) {
    nonManualEl.textContent = sign.nonManualMarkers || 'Neutral head alignment and direct eye contact.';
  }

  // 9. Practice in Studio direct link
  const practiceBtn = document.getElementById('modalPracticeBtn');
  if (practiceBtn) {
    practiceBtn.href = `practice.html?sign=${sign.id}`;
  }

  // 10. Web Speech Audio Pronunciation Playback
  const speakBtn = document.getElementById('modalSpeakBtn');
  const speakIcon = document.getElementById('modalSpeakIcon');
  const speakText = document.getElementById('modalSpeakText');

  if (speakBtn) {
    speakBtn.onclick = () => {
      if (speakIcon) speakIcon.className = 'bi bi-volume-up-fill fs-5 text-success spinner-grow spinner-grow-sm';
      if (speakText) speakText.textContent = 'Speaking...';

      // Spoken text clean-up
      const textToSpeak = sign.label.replace('/', ' or ');
      SignConnect.speakText(textToSpeak, () => {
        if (speakIcon) speakIcon.className = 'bi bi-volume-up-fill fs-5';
        if (speakText) speakText.textContent = 'Audio Playback';
      });

      // Safety timeout for icon reset
      setTimeout(() => {
        if (speakIcon) speakIcon.className = 'bi bi-volume-up-fill fs-5';
        if (speakText) speakText.textContent = 'Audio Playback';
      }, 2000);
    };
  }

  const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  modal.show();
}

// Utility: Escape HTML characters
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}
