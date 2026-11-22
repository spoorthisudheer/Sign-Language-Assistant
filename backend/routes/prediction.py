"""
SignConnect AI - Prediction Blueprint
Receives webcam frames from practice and communication modules, performs OpenCV / MediaPipe
processing, and provides a modular interface for future AI model integration.
"""

from flask import Blueprint, request, jsonify, g
from services.recognition_service import predict_sign
from services.auth_service import optional_token
from models.communication import CommunicationLog

prediction_bp = Blueprint('prediction', __name__)


@prediction_bp.route('/predict', methods=['POST'])
@optional_token
def predict():
    """
    POST /api/predict
    Process webcam frame / image data and return sign language classification.
    """
    data = request.get_json(silent=True) or {}
    image_base64 = data.get('image')
    target_sign = data.get('target')

    # Run inference through recognition service pipeline
    result = predict_sign(image_base64=image_base64, target_sign=target_sign)

    # Optional: Log recognized signs if user is active
    try:
        user_id = g.current_user['id'] if g.current_user else 1
        if result.get('prediction'):
            conf = float(result.get('confidence') or 0.95)
            CommunicationLog.log_sign(user_id, result['prediction'], conf)
    except Exception:
        pass

    return jsonify(result), 200
