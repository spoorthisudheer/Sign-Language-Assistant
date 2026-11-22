/**
 * SignConnect AI - Dashboard Page Script
 * Populates learning metrics, continue learning widgets, recent signs, and recommended lessons.
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadDashboardMetrics();
  renderRecentSigns();
  initDashboardEvents();
});

// Load metrics from backend /progress or local fallback
async function loadDashboardMetrics() {
  const user = SignConnect.getUser();
  const welcomeName = document.getElementById('dashWelcomeName');
  if (welcomeName && user) {
    welcomeName.textContent = user.name;
  }

  try {
    const data = await SignConnect.apiCall('/progress');
    const p = data.progress || user.stats || {};

    const elTotal = document.getElementById('statTotalLessons');
    const elCompleted = document.getElementById('statCompletedLessons');
    const elQuizzes = document.getElementById('statQuizzesAttempted');
    const elProgress = document.getElementById('statLearningProgress');
    const elProgressBar = document.getElementById('statLearningProgressBar');

    if (elTotal) elTotal.textContent = p.totalLessons || 48;
    if (elCompleted) elCompleted.textContent = p.completedLessons || 18;
    if (elQuizzes) elQuizzes.textContent = p.quizzesAttempted || 12;
    
    const percentage = p.overallPercentage || Math.round(((p.completedLessons || 18) / (p.totalLessons || 48)) * 100);
    if (elProgress) elProgress.textContent = `${percentage}%`;
    if (elProgressBar) elProgressBar.style.width = `${percentage}%`;

  } catch (err) {
    console.error('Error loading dashboard metrics:', err);
  }
}

// Render Recently Learned Signs Carousel/Grid
function renderRecentSigns() {
  const container = document.getElementById('recentSignsGrid');
  if (!container) return;

  // Selected sample recent signs from ISL dataset
  const recentIds = ['hello', 'a', 'thank_you', '5', 'help'];
  
  if (!window.ISL_DATA) {
    console.warn('ISL_DATA not yet loaded.');
    return;
  }

  const signs = recentIds.map(id => window.ISL_DATA.getSign(id)).filter(Boolean);

  container.innerHTML = signs.map(sign => `
    <div class="recent-sign-card" onclick="window.location.href='learn.html?sign=${sign.id}'" title="Click to view ${sign.title}">
      <div class="recent-sign-thumb">
        <img src="assets/images/isl_${sign.id}.svg" alt="${sign.title}" loading="lazy">
      </div>
      <div class="recent-sign-name">${sign.label}</div>
      <div class="recent-sign-time">${sign.category}</div>
    </div>
  `).join('');
}

// Interactive Dashboard Events
function initDashboardEvents() {
  const quickPracticeBtn = document.getElementById('btnQuickPractice');
  if (quickPracticeBtn) {
    quickPracticeBtn.addEventListener('click', () => {
      // Pick a random sign from ISL_DATA and redirect to practice
      if (window.ISL_DATA) {
        const all = [...window.ISL_DATA.alphabets, ...window.ISL_DATA.words];
        const randomSign = all[Math.floor(Math.random() * all.length)];
        window.location.href = `practice.html?sign=${randomSign.id}`;
      } else {
        window.location.href = 'practice.html';
      }
    });
  }
}
