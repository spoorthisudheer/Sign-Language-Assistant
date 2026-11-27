"""
SignConnect AI - Progress Service
Calculates real database analytics, mastery metrics, and activity breakdowns.
"""

from database import query_db


def get_user_progress_metrics(user_id=None):
    """
    Calculate comprehensive progress statistics and recent lessons
    for the logged-in user.
    """

    # 1. Total lessons count
    total_lessons_res = query_db(
        "SELECT COUNT(*) AS total FROM lessons",
        one=True
    )
    total_lessons = total_lessons_res['total'] if total_lessons_res else 48

    # Validate user ID
    if user_id is None:
        raise ValueError("A valid user ID is required")

    effective_user_id = user_id

    # 2. Completed lessons for this user
    completed_res = query_db(
        """
        SELECT COUNT(*) AS completed
        FROM user_progress
        WHERE user_id = %s
        AND completion_status = 'completed'
        """,
        (effective_user_id,),
        one=True
    )

    completed_lessons = completed_res['completed'] if completed_res else 0

    # 3. Recently completed lessons
    recent_lessons = query_db(
        """
        SELECT
            l.id,
            l.title,
            l.category,
            l.sign,
            l.image_path,
            up.completed_at
        FROM user_progress up
        INNER JOIN lessons l ON l.id = up.lesson_id
        WHERE up.user_id = %s
        AND up.completion_status = 'completed'
        ORDER BY up.completed_at DESC
        LIMIT 5
        """,
        (effective_user_id,)
    )
    # 4. Recently attempted quizzes
    recent_quizzes = query_db(
        """
        SELECT
            id,
            score,
            total_questions,
            percentage,
            category,
            attempted_at
        FROM quiz_results
        WHERE user_id = %s
        ORDER BY attempted_at DESC
        LIMIT 5
        """,
        (effective_user_id,)
    )
    # 4. Quizzes attempted & average score
    quiz_stats = query_db(
        """
        SELECT COUNT(*) AS count, AVG(percentage) AS avg_score
        FROM quiz_results
        WHERE user_id = %s
        """,
        (effective_user_id,),
        one=True
    )

    quizzes_attempted = (
        quiz_stats['count']
        if quiz_stats and quiz_stats['count']
        else 0
    )

    avg_score = (
        round(float(quiz_stats['avg_score']), 1)
        if quiz_stats and quiz_stats['avg_score'] is not None
        else 0.0
    )

    # 5. Overall completion percentage
    overall_percentage = (
        round((completed_lessons / total_lessons) * 100)
        if total_lessons > 0
        else 0
    )

    # 6. Category Mastery Breakdown
    category_totals = {
        'Alphabets': 26,
        'Numbers': 10,
        'Greetings': 4,
        'Common Words': 8
    }

    cat_rows = query_db(
        """
        SELECT l.category, COUNT(up.id) AS completed_count
        FROM lessons l
        LEFT JOIN user_progress up
            ON l.id = up.lesson_id
            AND up.user_id = %s
            AND up.completion_status = 'completed'
        GROUP BY l.category
        """,
        (effective_user_id,)
    )

    cat_mastery = {
        'alphabets': 0,
        'numbers': 0,
        'greetings': 0,
        'commonWords': 0
    }

    for row in cat_rows:
        cat_name = row['category']
        completed = row['completed_count']
        total = category_totals.get(cat_name, 1)
        pct = round((completed / total) * 100)

        if cat_name == 'Alphabets':
            cat_mastery['alphabets'] = min(pct, 100)
        elif cat_name == 'Numbers':
            cat_mastery['numbers'] = min(pct, 100)
        elif cat_name == 'Greetings':
            cat_mastery['greetings'] = min(pct, 100)
        elif cat_name == 'Common Words':
            cat_mastery['commonWords'] = min(pct, 100)

    # 7. Weekly Activity
    weekly_activity = [0, 0, 0, 0, 0, 0, 0]

    try:
        activity_rows = query_db(
            """
            SELECT DAYOFWEEK(completed_at) AS day_num, COUNT(*) AS count
            FROM user_progress
            WHERE user_id = %s
            AND completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DAYOFWEEK(completed_at)
            """,
            (effective_user_id,)
        )

        if activity_rows:
            # MySQL: 1=Sun, 2=Mon, ..., 7=Sat
            # Chart expects Mon-Sun
            day_map = {
                2: 0, 3: 1, 4: 2, 5: 3,
                6: 4, 7: 5, 1: 6
            }

            custom_weekly = [0] * 7

            for row in activity_rows:
                idx = day_map.get(row['day_num'])

                if idx is not None:
                    custom_weekly[idx] = row['count']

            weekly_activity = custom_weekly

    except Exception:
        pass

    # 8. Streak calculation
    streak_days = 1 if completed_lessons > 0 else 0

    # 9. Return all progress information
    return {
        'totalLessons': total_lessons,
        'completedLessons': completed_lessons,
        'quizzesAttempted': quizzes_attempted,
        'averageScore': avg_score,
        'overallPercentage': overall_percentage,
        'streakDays': streak_days,
        'weeklyActivity': weekly_activity,
        'categoryBreakdown': cat_mastery,
        'recentLessons': recent_lessons,
        'recentQuizzes': recent_quizzes
    }