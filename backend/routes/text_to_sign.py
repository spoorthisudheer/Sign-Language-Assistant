"""
SignConnect AI - Text to Sign Blueprint
Transforms text into structured Indian Sign Language (ISL) sequence demonstrations.
"""

from flask import Blueprint, request, jsonify
from services.text_to_sign_service import process_text_to_sign_sequence

text_to_sign_bp = Blueprint('text_to_sign', __name__)


@text_to_sign_bp.route('/text-to-sign', methods=['POST'])
def text_to_sign():
    """
    POST /api/text-to-sign
    Parse and convert text into sequential ISL signs and fingerspelling tokens.
    """
    data = request.get_json(silent=True) or {}
    text = data.get('text', '')

    if not text or not text.strip():
        return jsonify({
            'success': False,
            'message': 'Text field is required for sign conversion.'
        }), 400

    result = process_text_to_sign_sequence(text)
    return jsonify(result), 200
