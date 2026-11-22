"""
SignConnect AI - Authentication Blueprint
Handles user registration, login, logout, and token provisioning.
"""

from flask import Blueprint, request, jsonify, g
from models.user import User
from services.auth_service import (
    validate_email_format,
    verify_password,
    generate_token,
    token_required
)
from services.progress_service import get_user_progress_metrics

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    POST /api/register
    Register a new user account with hashed password and email validation.
    """
    data = request.get_json(silent=True) or {}
    
    # Support both 'fullName' (frontend) and 'name'
    full_name = (data.get('fullName') or data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    role = data.get('role', 'Student / ISL Learner')

    if not full_name or not email or not password:
        return jsonify({
            'success': False,
            'message': 'All fields (Full Name, Email, Password) are required.'
        }), 400

    if not validate_email_format(email):
        return jsonify({
            'success': False,
            'message': 'Please provide a valid email address format.'
        }), 400

    if len(password) < 8:
        return jsonify({
            'success': False,
            'message': 'Password must be at least 8 characters long.'
        }), 400

    # Duplicate email verification
    existing = User.get_by_email(email)
    if existing:
        return jsonify({
            'success': False,
            'message': 'This email address is already registered. Please sign in.'
        }), 409

    try:
        user = User.create(name=full_name, email=email, password=password, role=role)
        token = generate_token(user['id'], user['email'], user['role'])

        return jsonify({
            'success': True,
            'message': 'Account registered successfully! Welcome to SignConnect AI.',
            'token': token,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'role': user['role'],
                'avatar': user['avatar']
            }
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Registration failed: {str(e)}'
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    POST /api/login
    Authenticate user credentials and return secure JWT token.
    """
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({
            'success': False,
            'message': 'Email and password are required.'
        }), 400

    user = User.get_by_email(email)
    if not user or not verify_password(user['password'], password):
        return jsonify({
            'success': False,
            'message': 'Invalid email address or password. Please try again.'
        }), 401

    token = generate_token(user['id'], user['email'], user['role'])
    stats = get_user_progress_metrics(user['id'])

    return jsonify({
        'success': True,
        'message': f'Welcome back, {user["name"]}!',
        'token': token,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role'],
            'avatar': user['avatar'],
            'stats': stats
        }
    }), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    POST /api/logout
    Sign out user session.
    """
    return jsonify({
        'success': True,
        'message': 'Logged out successfully.'
    }), 200
