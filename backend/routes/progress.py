"""
SignConnect AI - Progress Blueprint
Provides learning progress, statistics, and category mastery data.
"""

from flask import Blueprint, jsonify, g
from services.auth_service import token_required
from services.progress_service import get_user_progress_metrics

progress_bp = Blueprint('progress', __name__)


@progress_bp.route('/progress', methods=['GET'])
@token_required
def get_progress():
    """
    GET /api/progress
    Retrieve comprehensive progress metrics for current user or default active session.
    """
    user_id = g.current_user['id']
    metrics = get_user_progress_metrics(user_id)

    return jsonify({
        'success': True,
        'progress': metrics
    }), 200
