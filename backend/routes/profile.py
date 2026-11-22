"""
SignConnect AI - Profile Blueprint
Handles profile retrieval, profile updates, and password changes.
"""

from flask import Blueprint, request, jsonify, g
from models.user import User
from services.auth_service import optional_token, token_required, verify_password, validate_email_format
from services.progress_service import get_user_progress_metrics

profile_bp = Blueprint('profile', __name__)


@profile_bp.route('/profile', methods=['GET'])
@optional_token
def get_profile():
    """
    GET /api/profile
    Retrieve profile details and learning metrics.
    """
    user = g.current_user
    if not user:
        # Fall back to primary active demo learner (id 1)
        user = User.get_by_id(1)
        if not user:
            user = {
                'id': 1,
                'name': 'SignConnect Learner',
                'email': 'learner@signconnect.ai',
                'role': 'Student / ISL Learner',
                'avatar': 'SL'
            }

    stats = get_user_progress_metrics(user['id'])
    
    return jsonify({
        'success': True,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'role': user.get('role', 'Student / ISL Learner'),
            'avatar': user.get('avatar', 'SL'),
            'stats': stats
        }
    }), 200


@profile_bp.route('/profile', methods=['PUT', 'POST'])
@optional_token
def update_profile():
    """
    PUT /api/profile or POST /api/profile
    Update current user's name and email.
    """
    data = request.get_json(silent=True) or {}
    user_id = g.current_user['id'] if g.current_user else 1

    name = (data.get('name') or data.get('fullName') or '').strip()
    email = (data.get('email') or '').strip().lower()

    if not name or not email:
        return jsonify({
            'success': False,
            'message': 'Name and email are required.'
        }), 400

    if not validate_email_format(email):
        return jsonify({
            'success': False,
            'message': 'Invalid email address format.'
        }), 400

    # Duplicate email check against other users
    existing = User.get_by_email(email)
    if existing and existing['id'] != user_id:
        return jsonify({
            'success': False,
            'message': 'This email address is already in use by another account.'
        }), 409

    updated_user = User.update_profile(user_id, name, email)

    return jsonify({
        'success': True,
        'message': 'Profile updated successfully.',
        'user': {
            'id': updated_user['id'],
            'name': updated_user['name'],
            'email': updated_user['email'],
            'role': updated_user['role'],
            'avatar': updated_user['avatar']
        }
    }), 200


@profile_bp.route('/profile/change-password', methods=['POST'])
@optional_token
def change_password():
    """
    POST /api/profile/change-password
    Verify current password and set new hashed password.
    """
    data = request.get_json(silent=True) or {}
    user_id = g.current_user['id'] if g.current_user else 1

    current_pwd = data.get('currentPassword') or data.get('oldPassword') or ''
    new_pwd = data.get('newPassword') or ''

    if len(new_pwd) < 8:
        return jsonify({
            'success': False,
            'message': 'New password must be at least 8 characters long.'
        }), 400

    # If current password was provided, verify it
    if current_pwd:
        user_record = User.get_by_id(user_id)
        if user_record and not verify_password(user_record['password'], current_pwd):
            return jsonify({
                'success': False,
                'message': 'Current password does not match.'
            }), 401

    User.update_password(user_id, new_pwd)

    return jsonify({
        'success': True,
        'message': 'Password has been updated successfully.'
    }), 200
