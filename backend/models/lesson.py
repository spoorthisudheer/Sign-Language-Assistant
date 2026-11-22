"""
SignConnect AI - Lesson Model
"""

from database import query_db, execute_db


class Lesson:
    @staticmethod
    def get_all(category: str = None, search: str = None):
        sql = "SELECT id, title, category, sign, description, instructions, image_path, two_handed, hand_type, pronunciation, variations, non_manual_markers, created_at FROM lessons WHERE 1=1"
        params = []

        if category and category.lower() != 'all':
            sql += " AND LOWER(category) = LOWER(%s)"
            params.append(category)

        if search and search.strip():
            term = f"%{search.strip()}%"
            sql += " AND (title LIKE %s OR sign LIKE %s OR description LIKE %s)"
            params.extend([term, term, term])

        sql += " ORDER BY category ASC, id ASC"
        return query_db(sql, tuple(params))

    @staticmethod
    def get_by_id(lesson_id: str):
        return query_db(
            "SELECT id, title, category, sign, description, instructions, image_path, two_handed, hand_type, pronunciation, variations, non_manual_markers, created_at FROM lessons WHERE id = %s",
            (lesson_id,), one=True
        )

    @staticmethod
    def get_categories():
        rows = query_db("SELECT DISTINCT category FROM lessons ORDER BY category ASC")
        return [r['category'] for r in rows] if rows else []
