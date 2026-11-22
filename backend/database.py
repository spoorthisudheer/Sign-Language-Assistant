"""
SignConnect AI - Database Interface
Provides connection management and SQL execution helpers using PyMySQL.
"""

import pymysql
from pymysql.cursors import DictCursor
from config import Config
import logging

logger = logging.getLogger(__name__)


def get_db_connection(use_database=True):
    """
    Establish and return a new MySQL connection.
    """
    return pymysql.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME if use_database else None,
        charset='utf8mb4',
        cursorclass=DictCursor,
        autocommit=True
    )


def query_db(query, args=(), one=False):
    """
    Execute a SELECT query and return results as dictionary/dictionaries.
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(query, args)
            results = cursor.fetchall()
            return (results[0] if results else None) if one else results
    except Exception as e:
        logger.error(f"Database query error: {e} | Query: {query} | Args: {args}")
        raise
    finally:
        if conn:
            conn.close()


def execute_db(query, args=()):
    """
    Execute an INSERT, UPDATE, or DELETE query.
    Returns: lastrowid for INSERT, or rowcount for UPDATE/DELETE.
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(query, args)
            conn.commit()
            return cursor.lastrowid if cursor.lastrowid else cursor.rowcount
    except Exception as e:
        logger.error(f"Database execute error: {e} | Query: {query} | Args: {args}")
        raise
    finally:
        if conn:
            conn.close()


def test_connection():
    """
    Verify MySQL connectivity.
    """
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1 AS status")
            res = cursor.fetchone()
        conn.close()
        return res and res.get('status') == 1
    except Exception as e:
        logger.warning(f"Database connection check failed: {e}")
        return False
