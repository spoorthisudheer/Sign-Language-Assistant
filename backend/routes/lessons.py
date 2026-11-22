"""
SignConnect AI - Lessons Blueprint
Provides sign language curriculum retrieval, category filtering, search, and completion tracking.
"""

from flask import Blueprint, request, jsonify, g
from models.lesson import Lesson
from models.progress import UserProgress
from services.auth_service import optional_token
from services.progress_service import get_user_progress_metrics

lessons_bp = Blueprint('lessons', __name__)


@lessons_bp.route('/lessons', methods=['GET'])
def get_lessons():
    """
    GET /api/lessons
    Retrieve all sign language lessons with optional filtering by category or search term.
    Query params: ?category=Alphabets&search=hello
    """
    category = request.args.get('category')
    search = request.args.get('search') or request.args.get('q')

    lessons = Lesson.get_all(category=category, search=search)

    return jsonify({
        'success': True,
        'count': len(lessons),
        'category': category or 'all',
        'lessons': lessons
    }), 200


@lessons_bp.route('/lessons/categories', methods=['GET'])
def get_categories():
    """
    GET /api/lessons/categories
    Retrieve all available curriculum categories.
    """
    categories = Lesson.get_categories()
    return jsonify({
        'success': True,
        'categories': categories
    }), 200


@lessons_bp.route('/lessons/<lesson_id>', methods=['GET'])
def get_lesson_detail(lesson_id):
    """
    GET /api/lessons/<lesson_id>
    Retrieve full details for an individual lesson (e.g. 'a', '5', 'hello').
    """
    lesson = Lesson.get_by_id(lesson_id)
    if not lesson:
        return jsonify({
            'success': False,
            'message': f"Lesson with identifier '{lesson_id}' not found."
        }), 404

    return jsonify({
        'success': True,
        'lesson': lesson
    }), 200


@lessons_bp.route('/lessons/<lesson_id>/complete', methods=['POST'])
@lessons_bp.route('/lessons/complete', methods=['POST'])
@optional_token
def mark_lesson_complete(lesson_id=None):
    """
    POST /api/lessons/<lesson_id>/complete or POST /api/lessons/complete
    Mark a sign language lesson as completed for the current user.
    """
    if not lesson_id:
        data = request.get_json(silent=True) or {}
        lesson_id = data.get('lesson_id') or data.get('lessonId') or data.get('sign_id')

    if not lesson_id:
        return jsonify({
            'success': False,
            'message': 'lesson_id is required.'
        }), 400

    lesson = Lesson.get_by_id(lesson_id)
    if not lesson:
        return jsonify({
            'success': False,
            'message': f"Lesson '{lesson_id}' does not exist in curriculum."
        }), 404

    user_id = g.current_user['id'] if g.current_user else 1
    UserProgress.mark_completed(user_id, lesson_id)
    updated_progress = get_user_progress_metrics(user_id)

    return jsonify({
        'success': True,
        'message': f"Lesson '{lesson['title']}' marked as completed.",
        'lesson_id': lesson_id,
        'progress': updated_progress
    }), 200
