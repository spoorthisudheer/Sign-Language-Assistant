"""
SignConnect AI - User Progress Model
"""

from database import query_db, execute_db


class UserProgress:
    @staticmethod
    def mark_completed(user_id: int, lesson_id: str):
        # Insert or ignore duplicate
        execute_db(
            """
            INSERT INTO user_progress (user_id, lesson_id, completion_status)
            VALUES (%s, %s, 'completed')
            ON DUPLICATE KEY UPDATE completed_at = CURRENT_TIMESTAMP
            """,
            (user_id, lesson_id)
        )
        return True

    @staticmethod
    def get_completed_lesson_ids(user_id: int):
        rows = query_db(
            "SELECT lesson_id FROM user_progress WHERE user_id = %s AND completion_status = 'completed'",
            (user_id,)
        )
        return [r['lesson_id'] for r in rows] if rows else []
