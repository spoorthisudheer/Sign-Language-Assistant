/**
 * SignConnect AI - Learning Progress & Analytics Module
 * Renders Chart.js charts (Weekly Learning Activity, Category Mastery),
 * Achievement Badges, and prepares for Flask GET /api/progress.
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadProgressData();
});

async function loadProgressData() {
  try {
    const response = await SignConnect.apiCall('/progress');
    const p = response.progress || {};

    // Populate stat counters
    const totalLessons = p.totalLessons || 48;
    const completedLessons = p.completedLessons || 18;
    const overallPercent = p.overallPercentage || Math.round((completedLessons / totalLessons) * 100);
    const streak = p.streakDays || 5;

    document.getElementById('progTotalLessons').textContent = totalLessons;
    document.getElementById('progCompletedLessons').textContent = completedLessons;
    document.getElementById('progOverallPercent').textContent = `${overallPercent}%`;
    document.getElementById('progStreakDays').textContent = `${streak} Days`;
    
    const circleBar = document.getElementById('progCircleBar');
    if (circleBar) {
      circleBar.style.strokeDashoffset = 440 - (440 * overallPercent) / 100;
    }

    // Render Charts
    renderWeeklyChart(p.weeklyActivity || [4, 6, 8, 3, 7, 10, 5]);
    renderCategoryChart(p.categoryBreakdown || { alphabets: 75, numbers: 90, greetings: 60, commonWords: 40 });

  } catch (err) {
    console.error('Error loading progress data:', err);
  }
}

// Chart 1: Weekly Learning Activity Bar Chart
function renderWeeklyChart(weeklyData) {
  const ctx = document.getElementById('weeklyActivityChart');
  if (!ctx || typeof Chart === 'undefined') return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Signs Practiced',
        data: weeklyData,
        backgroundColor: 'rgba(79, 70, 229, 0.85)',
        hoverBackgroundColor: '#4338CA',
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0F172A',
          padding: 10,
          cornerRadius: 8,
          titleFont: { family: "'Plus Jakarta Sans', sans-serif", weight: 'bold' },
          bodyFont: { family: "'Plus Jakarta Sans', sans-serif" }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(226, 232, 240, 0.6)' },
          ticks: { font: { family: "'Plus Jakarta Sans', sans-serif" } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "'Plus Jakarta Sans', sans-serif", weight: '600' } }
        }
      }
    }
  });
}

// Chart 2: Category Mastery Radar / Doughnut Chart
function renderCategoryChart(categoryData) {
  const ctx = document.getElementById('categoryMasteryChart');
  if (!ctx || typeof Chart === 'undefined') return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['ISL Alphabets', 'ISL Numbers', 'Greetings', 'Everyday Words'],
      datasets: [{
        data: [
          categoryData.alphabets || 75,
          categoryData.numbers || 90,
          categoryData.greetings || 60,
          categoryData.commonWords || 40
        ],
        backgroundColor: [
          '#4F46E5', // Indigo
          '#06B6D4', // Cyan
          '#10B981', // Emerald
          '#F59E0B'  // Amber
        ],
        borderWidth: 3,
        borderColor: '#FFFFFF'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: { family: "'Plus Jakarta Sans', sans-serif", weight: '600', size: 12 }
          }
        }
      },
      cutout: '72%'
    }
  });
}
