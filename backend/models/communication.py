"""
SignConnect AI - Communication Log Model
"""

from database import query_db, execute_db


class CommunicationLog:
    @staticmethod
    def log_sign(user_id: int, recognized_sign: str, confidence: float = 0.0):
        return execute_db(
            "INSERT INTO communication_logs (user_id, recognized_sign, confidence) VALUES (%s, %s, %s)",
            (user_id, recognized_sign.upper(), confidence)
        )

    @staticmethod
    def get_recent(user_id: int = None, limit: int = 20):
        if user_id:
            return query_db(
                "SELECT id, recognized_sign, confidence, created_at FROM communication_logs WHERE user_id = %s ORDER BY created_at DESC LIMIT %s",
                (user_id, limit)
            )
        return query_db(
            "SELECT id, recognized_sign, confidence, created_at FROM communication_logs ORDER BY created_at DESC LIMIT %s",
            (limit,)
        )
