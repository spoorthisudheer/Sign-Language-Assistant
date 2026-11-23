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
    const elAverage = document.getElementById('statAverageScore');
    const elProgress = document.getElementById('statLearningProgress');
    const elProgressBar = document.getElementById('statLearningProgressBar');
    const elCompletionRate = document.getElementById('statCompletionRate');

    if (elTotal) elTotal.textContent = p.totalLessons || 48;
    if (elCompleted) elCompleted.textContent = p.completedLessons ?? 0;
    if (elQuizzes) elQuizzes.textContent = p.quizzesAttempted ?? 0;
    if (elAverage) elAverage.textContent = `${p.averageScore ?? 0}%`;
    
    const percentage = p.overallPercentage ?? Math.round(((p.completedLessons ?? 0) / (p.totalLessons ?? 48)) * 100);
    if (elProgress) elProgress.textContent = `${percentage}%`;
    if (elCompletionRate) elCompletionRate.textContent = `${percentage}%`;
    if (elProgressBar) elProgressBar.style.width = `${percentage}%`;

  } catch (err) {
    console.error('Error loading dashboard metrics:', err);
  }
}

// Render Recently Learned Signs from actual user progress
async function renderRecentSigns() {
    const container = document.getElementById('recentSignsGrid');
    if (!container) return;

    try {
        const data = await SignConnect.apiCall('/progress');
        const recentLessons = data.progress?.recentLessons || [];

        if (recentLessons.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; width: 100%; text-align: center; padding: 30px 10px;">
                    <p class="text-muted mb-1">
                        No completed lessons yet.
                    </p>
                    <p class="text-muted small">
                        Start learning to see your recently completed signs here!
                    </p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentLessons.map(lesson => `
            <div class="recent-sign-card"
                 onclick="window.location.href='learn.html?sign=${encodeURIComponent(lesson.id)}'"
                 title="Click to view ${lesson.title}">

                <div class="recent-sign-thumb">
                    <img src="${lesson.image_path}"
                         alt="${lesson.title}"
                         loading="lazy">
                </div>

                <div class="recent-sign-name">
                    ${lesson.title}
                </div>

                <div class="recent-sign-time">
                    ${lesson.category}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Failed to load recent lessons:', error);

        container.innerHTML = `
            <p class="text-muted">
                Unable to load recently completed lessons.
            </p>
        `;
    }
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
