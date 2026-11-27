"""
SignConnect AI - Quiz & Quiz Results Model
"""

from database import query_db, execute_db


class Quiz:
    @staticmethod
    def get_questions(include_answer: bool = False):
        """
        Fetch questions.
        SECURITY: Never exposes correct_answer unless include_answer is True (used internally for scoring).
        """
        if include_answer:
            return query_db(
                "SELECT id, question, category, sign_id, option_a, option_b, option_c, option_d, correct_answer, explanation FROM quizzes ORDER BY id ASC"
            )
        else:
            rows = query_db(
                "SELECT id, question, category, sign_id, option_a, option_b, option_c, option_d FROM quizzes ORDER BY id ASC"
            )
            # Format options array for frontend convenience
            formatted = []
            for r in rows:
                formatted.append({
                    'id': r['id'],
                    'question': r['question'],
                    'category': r['category'],
                    'signId': r['sign_id'],
                    'options': [r['option_a'], r['option_b'], r['option_c'], r['option_d']]
                })
            return formatted

    @staticmethod
    def record_result(user_id: int, score: int, total_questions: int, percentage: float, category: str = 'ISL Mixed Quiz'):
        result_id = execute_db(
            """
            INSERT INTO quiz_results (user_id, score, total_questions, percentage, category)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (user_id, score, total_questions, percentage, category)
        )
        return result_id

    @staticmethod
    def get_user_results(user_id: int, limit: int = 10):
        return query_db(
            """
            SELECT id, score, total_questions, percentage, category, attempted_at
            FROM quiz_results
            WHERE user_id = %s
            ORDER BY attempted_at DESC
            LIMIT %s
            """,
            (user_id, limit)
        )
