"""
SignConnect AI - Backend Application Entry Point
Flask RESTful API service supporting the SignConnect AI frontend.
"""

import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from database import test_connection

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
)
logger = logging.getLogger('signconnect')


def create_app():
    """Application factory for SignConnect AI Backend."""
    app = Flask(__name__)
    app.config.from_object(Config)

    # Configure CORS for frontend integration
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "Accept"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    # Register API Blueprints
    from routes.auth import auth_bp
    from routes.profile import profile_bp
    from routes.progress import progress_bp
    from routes.lessons import lessons_bp
    from routes.quiz import quiz_bp
    from routes.prediction import prediction_bp
    from routes.text_to_sign import text_to_sign_bp
    from routes.communication import communication_bp

    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(profile_bp, url_prefix='/api')
    app.register_blueprint(progress_bp, url_prefix='/api')
    app.register_blueprint(lessons_bp, url_prefix='/api')
    app.register_blueprint(quiz_bp, url_prefix='/api')
    app.register_blueprint(prediction_bp, url_prefix='/api')
    app.register_blueprint(text_to_sign_bp, url_prefix='/api')
    app.register_blueprint(communication_bp, url_prefix='/api')

    # Base Health Check Route
    @app.route('/api', methods=['GET'])
    @app.route('/api/health', methods=['GET'])
    @app.route('/api/status', methods=['GET'])
    def health_check():
        db_ok = test_connection()
        return jsonify({
            'success': True,
            'app': 'SignConnect AI Backend',
            'status': 'online',
            'database_connected': db_ok,
            'version': '1.0.0',
            'endpoints': {
                'auth': ['POST /api/register', 'POST /api/login', 'POST /api/logout'],
                'profile': ['GET /api/profile', 'PUT /api/profile', 'POST /api/profile/change-password'],
                'progress': ['GET /api/progress'],
                'lessons': ['GET /api/lessons', 'GET /api/lessons/<id>', 'POST /api/lessons/<id>/complete'],
                'quiz': ['GET /api/quiz', 'POST /api/quiz/submit', 'GET /api/quiz/results'],
                'prediction': ['POST /api/predict'],
                'text_to_sign': ['POST /api/text-to-sign'],
                'communication': ['GET /api/communication/history', 'POST /api/communication/log']
            }
        }), 200

    # Global Error Handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'success': False,
            'error': 'Bad Request',
            'message': str(error.description if hasattr(error, 'description') else 'Invalid input provided.')
        }), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'error': 'Not Found',
            'message': f"The requested endpoint '{request.path}' was not found on this server."
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            'success': False,
            'error': 'Method Not Allowed',
            'message': f"HTTP method '{request.method}' is not permitted for '{request.path}'."
        }), 405

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal 500 error: {error}")
        return jsonify({
            'success': False,
            'error': 'Internal Server Error',
            'message': 'An unexpected server error occurred. Please check backend logs.'
        }), 500

    return app


app = create_app()

if __name__ == '__main__':
    logger.info("Verifying MySQL database connection...")
    if test_connection():
        logger.info(f"Connected to MySQL database '{Config.DB_NAME}' successfully.")
    else:
        logger.warning(f"Could not connect to MySQL database '{Config.DB_NAME}'. Ensure MySQL is running on port {Config.DB_PORT}.")

    logger.info(f"Starting SignConnect AI Flask Server on http://127.0.0.1:{Config.FLASK_PORT}")
    app.run(
        host='127.0.0.1',
        port=Config.FLASK_PORT,
        debug=Config.FLASK_DEBUG
    )
