"""
SignConnect AI - Authentication Service
Handles password hashing, token generation/verification, and route protection decorators.
"""

import re
import datetime
import jwt
from functools import wraps
from flask import request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config
from database import query_db

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')


def hash_password(password: str) -> str:
    """Securely hash a plaintext password."""
    return generate_password_hash(password, method='pbkdf2:sha256', salt_length=16)


def verify_password(stored_hash: str, password: str) -> bool:
    """Verify plaintext password against stored hash."""
    if not stored_hash or not password:
        return False
    return check_password_hash(stored_hash, password)


def validate_email_format(email: str) -> bool:
    """Check if email matches standard format."""
    return bool(email and EMAIL_REGEX.match(email.strip()))


def generate_token(user_id: int, email: str, role: str) -> str:
    """Generate a signed JWT token."""
    payload = {
        'sub': str(user_id),
        'email': email,
        'role': role,
        'iat': datetime.datetime.now(datetime.timezone.utc),
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=Config.JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')


def decode_token(token: str):
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def extract_token_from_request():
    """Extract token from Authorization header or cookie or query string."""
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header.split(' ', 1)[1].strip()
    
    # Alternatively query param ?token=...
    token = request.args.get('token')
    if token:
        return token
    return None


def token_required(f):
    """Decorator to require a valid JWT token on protected endpoints."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = extract_token_from_request()
        if not token:
            return jsonify({
                'success': False,
                'message': 'Authentication required. Missing Authorization token.'
            }), 401

        payload = decode_token(token)
        if not payload:
            return jsonify({
                'success': False,
                'message': 'Invalid or expired token. Please log in again.'
            }), 401

        user_id = int(payload['sub']) if str(payload['sub']).isdigit() else payload['sub']
        user = query_db("SELECT id, name, email, role, avatar, created_at FROM users WHERE id = %s", (user_id,), one=True)
        if not user:
            return jsonify({
                'success': False,
                'message': 'User associated with token not found.'
            }), 404

        g.current_user = user
        return f(*args, **kwargs)
    return decorated


def optional_token(f):
    """Decorator that attaches current_user if token present, but does not block guests."""
    @wraps(f)
    def decorated(*args, **kwargs):
        g.current_user = None
        token = extract_token_from_request()
        if token:
            payload = decode_token(token)
            if payload:
                user_id = int(payload['sub']) if str(payload['sub']).isdigit() else payload['sub']
                user = query_db("SELECT id, name, email, role, avatar, created_at FROM users WHERE id = %s", (user_id,), one=True)
                if user:
                    g.current_user = user
        return f(*args, **kwargs)
    return decorated
