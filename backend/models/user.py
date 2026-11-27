"""
SignConnect AI - User Model
"""

from database import query_db, execute_db
from services.auth_service import hash_password, verify_password


class User:
    @staticmethod
    def get_by_id(user_id: int):
        return query_db(
            "SELECT id, name, email, role, avatar, created_at, updated_at FROM users WHERE id = %s",
            (user_id,), one=True
        )

    @staticmethod
    def get_by_email(email: str):
        return query_db(
            "SELECT id, name, email, password, role, avatar, created_at, updated_at FROM users WHERE email = %s",
            (email.strip().lower(),), one=True
        )

    @staticmethod
    def create(name: str, email: str, password: str, role: str = 'Student / ISL Learner', avatar: str = None):
        if not avatar:
            avatar = name.strip()[:2].upper() if name else 'SL'
            
        hashed = hash_password(password)
        user_id = execute_db(
            """
            INSERT INTO users (name, email, password, role, avatar)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (name.strip(), email.strip().lower(), hashed, role, avatar)
        )
        return User.get_by_id(user_id)

    @staticmethod
    def update_profile(user_id: int, name: str, email: str):
        avatar = name.strip()[:2].upper() if name else 'SL'
        execute_db(
            "UPDATE users SET name = %s, email = %s, avatar = %s WHERE id = %s",
            (name.strip(), email.strip().lower(), avatar, user_id)
        )
        return User.get_by_id(user_id)

    @staticmethod
    def update_password(user_id: int, new_password: str):
        hashed = hash_password(new_password)
        return execute_db("UPDATE users SET password = %s WHERE id = %s", (hashed, user_id))
