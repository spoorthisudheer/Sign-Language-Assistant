
/**
 * SignConnect AI - Learning Progress & Analytics Module
 * Displays real progress retrieved from Flask API and MySQL.
 * Includes empty-state messages for charts.
 */

document.addEventListener('DOMContentLoaded', async () => {
    await loadProgressData();
});


// ==========================================
// LOAD PROGRESS DATA FROM FLASK API
// ==========================================

async function loadProgressData() {
    try {
        const response = await SignConnect.apiCall('/progress');
        const p = response.progress || {};

        const totalLessons = p.totalLessons ?? 48;
        const completedLessons = p.completedLessons ?? 0;

        const overallPercent = p.overallPercentage ??
            (totalLessons > 0
                ? Math.round((completedLessons / totalLessons) * 100)
                : 0);

        const streak = p.streakDays ?? 0;

        document.getElementById('progTotalLessons').textContent = totalLessons;
        document.getElementById('progCompletedLessons').textContent = completedLessons;
        document.getElementById('progOverallPercent').textContent = `${overallPercent}%`;
        document.getElementById('progStreakDays').textContent = `${streak} Days`;

        // Update completed lessons summary
        const completedSummary = document.getElementById('progCompletedSummary');

        if (completedSummary) {
            completedSummary.textContent =
                `${completedLessons} of ${totalLessons} Signs`;
        }

        // Update circular progress bar
        const circleBar = document.getElementById('progCircleBar');

        if (circleBar) {
            circleBar.style.strokeDashoffset =
                440 - (440 * overallPercent) / 100;
        }

        // Render weekly activity
        renderWeeklyChart(p.weeklyActivity ?? [0, 0, 0, 0, 0, 0, 0]);

        // Render category mastery
        renderCategoryChart(p.categoryBreakdown ?? {
            alphabets: 0,
            numbers: 0,
            greetings: 0,
            commonWords: 0
        });

        // Render actual recent lessons and quizzes
        renderRecentActivity(
            p.recentLessons ?? [],
            p.recentQuizzes ?? []
        );

    } catch (err) {
        console.error('Error loading progress data:', err);

        showChartMessage(
            document.getElementById('weeklyActivityChart'),
            'Unable to load weekly activity.'
        );

        showChartMessage(
            document.getElementById('categoryMasteryChart'),
            'Unable to load category mastery.'
        );

        const table = document.getElementById('recentActivityTable');

        if (table) {
            table.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-danger py-4">
                        Unable to load activity. Please check your connection.
                    </td>
                </tr>`;
        }
    }
}


// ==========================================
// CHART EMPTY-STATE MESSAGE
// ==========================================

function showChartMessage(canvas, message) {

    if (!canvas) return;

    const parent = canvas.parentElement;

    parent.style.position = 'relative';

    canvas.style.visibility = 'hidden';

    let messageBox = parent.querySelector('.chart-empty-state');

    if (!messageBox) {

        messageBox = document.createElement('div');

        messageBox.className = 'chart-empty-state';

        messageBox.style.cssText = `
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 20px;
            color: #64748b;
            font-size: 14px;
            pointer-events: none;
        `;

        parent.appendChild(messageBox);
    }

    messageBox.innerHTML = `
        <div style="
            width: 55px;
            height: 55px;
            border-radius: 50%;
            background: #f1f5f9;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 12px;
            color: #6366f1;
            font-size: 23px;
        ">
            <i class="bi bi-bar-chart-line"></i>
        </div>

        <strong style="color:#334155; margin-bottom:5px;">
            No Data Available
        </strong>

        <span>${escapeHTML(message)}</span>
    `;
}


// Remove empty-state message when actual data becomes available
function removeChartMessage(canvas) {

    if (!canvas) return;

    canvas.style.visibility = 'visible';

    const messageBox =
        canvas.parentElement.querySelector('.chart-empty-state');

    if (messageBox) {
        messageBox.remove();
    }
}


// ==========================================
// FORMAT DATABASE DATE
// ==========================================

function formatActivityDate(dateValue) {

    if (!dateValue) return 'Date unavailable';

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return 'Date unavailable';
    }

    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}


// ==========================================
// RENDER RECENT LESSONS AND QUIZZES
// ==========================================

function renderRecentActivity(lessons, quizzes) {

    const table = document.getElementById('recentActivityTable');

    if (!table) return;

    const activities = [];

    lessons.forEach(lesson => {

        activities.push({
            title: lesson.title || 'Completed Lesson',
            category: lesson.category || 'Lesson',
            date: lesson.completed_at,
            status: 'Lesson Completed',
            score: '—'
        });

    });

    quizzes.forEach(quiz => {

        const score =
            `${quiz.score ?? 0} / ${quiz.total_questions ?? 0}`;

        const percentage = quiz.percentage ?? 0;

        activities.push({
            title: quiz.category || 'Quiz',
            category: 'Quiz',
            date: quiz.attempted_at,
            status: 'Quiz Attempted',
            score: `${score} (${percentage}%)`
        });

    });

    // Sort newest activity first
    activities.sort((a, b) =>
        new Date(b.date || 0) - new Date(a.date || 0)
    );

    const recentActivities = activities.slice(0, 5);

    if (recentActivities.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    No learning activity yet. Complete a lesson or take a quiz
                    to see your activity here.
                </td>
            </tr>`;

        return;
    }

    table.innerHTML = recentActivities.map(activity => `

        <tr>

            <td class="fw-bold">
                ${escapeHTML(activity.title)}
            </td>

            <td>
                <span class="badge bg-primary-subtle text-primary">
                    ${escapeHTML(activity.category)}
                </span>
            </td>

            <td class="text-secondary">
                ${formatActivityDate(activity.date)}
            </td>

            <td>
                <span class="badge bg-success-subtle text-success">
                    ${escapeHTML(activity.status)}
                </span>
            </td>

            <td class="fw-bold">
                ${escapeHTML(activity.score)}
            </td>

        </tr>

    `).join('');
}


// ==========================================
// PREVENT HTML INJECTION
// ==========================================

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => ({

        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'

    })[character]);

}


// ==========================================
// CHART 1: WEEKLY LEARNING ACTIVITY
// ==========================================

function renderWeeklyChart(weeklyData) {

    const ctx = document.getElementById('weeklyActivityChart');

    if (!ctx || typeof Chart === 'undefined') return;

    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }

    const values = Array.isArray(weeklyData)
        ? weeklyData.map(value => Number(value) || 0)
        : [0, 0, 0, 0, 0, 0, 0];

    // Check whether any learning activity exists
    const hasActivity = values.some(value => value > 0);

    if (!hasActivity) {

        showChartMessage(
            ctx,
            'Complete your first lesson to see your weekly learning activity here.'
        );

        return;
    }

    removeChartMessage(ctx);

    new Chart(ctx, {

        type: 'bar',

        data: {

            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],

            datasets: [{

                label: 'Completed Lessons',

                data: values,

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

                legend: {
                    display: false
                },

                tooltip: {

                    backgroundColor: '#0F172A',

                    padding: 10,

                    cornerRadius: 8

                }

            },

            scales: {

                y: {

                    beginAtZero: true,

                    grid: {
                        color: 'rgba(226, 232, 240, 0.6)'
                    }

                },

                x: {

                    grid: {
                        display: false
                    }

                }

            }

        }

    });

}


// ==========================================
// CHART 2: CATEGORY MASTERY
// ==========================================

function renderCategoryChart(categoryData) {

    const ctx = document.getElementById('categoryMasteryChart');

    if (!ctx || typeof Chart === 'undefined') return;

    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }

    const values = [

        Number(categoryData.alphabets) || 0,

        Number(categoryData.numbers) || 0,

        Number(categoryData.greetings) || 0,

        Number(categoryData.commonWords) || 0

    ];

    // Check whether any category has progress
    const hasProgress = values.some(value => value > 0);

    if (!hasProgress) {

        showChartMessage(
            ctx,
            'Complete lessons to see your category-wise learning mastery.'
        );

        return;
    }

    removeChartMessage(ctx);

    new Chart(ctx, {

        type: 'doughnut',

        data: {

            labels: [

                'ISL Alphabets',

                'ISL Numbers',

                'Greetings',

                'Everyday Words'

            ],

            datasets: [{

                data: values,

                backgroundColor: [

                    '#4F46E5',

                    '#06B6D4',

                    '#10B981',

                    '#F59E0B'

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

                        font: {

                            family: "'Plus Jakarta Sans', sans-serif",

                            weight: '600',

                            size: 12

                        }

                    }

                }

            },

            cutout: '72%'

        }

    });

}
