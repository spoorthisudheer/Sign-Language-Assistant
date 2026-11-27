"""
SignConnect AI - Communication Blueprint
Manages real-time communication logs and live session history.
"""

from flask import Blueprint, request, jsonify, g
from models.communication import CommunicationLog
from services.auth_service import optional_token

communication_bp = Blueprint('communication', __name__)


@communication_bp.route('/communication/history', methods=['GET'])
@optional_token
def get_history():
    """
    GET /api/communication/history
    Retrieve recent communication recognition logs.
    """
    user_id = g.current_user['id'] if g.current_user else 1
    limit = int(request.args.get('limit', 20))
    logs = CommunicationLog.get_recent(user_id=user_id, limit=limit)

    return jsonify({
        'success': True,
        'count': len(logs),
        'history': logs
    }), 200


@communication_bp.route('/communication/log', methods=['POST'])
@optional_token
def add_log():
    """
    POST /api/communication/log
    Record a recognized gesture or accumulated sentence.
    """
    data = request.get_json(silent=True) or {}
    sign = data.get('sign')
    confidence = float(data.get('confidence') or 0.95)
    user_id = g.current_user['id'] if g.current_user else 1

    if not sign:
        return jsonify({
            'success': False,
            'message': 'Sign name is required.'
        }), 400

    log_id = CommunicationLog.log_sign(user_id, sign, confidence)

    return jsonify({
        'success': True,
        'message': 'Communication event logged.',
        'log_id': log_id
    }), 201
