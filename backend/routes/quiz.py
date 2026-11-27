"""
SignConnect AI - Quiz Blueprint
Handles quiz question retrieval, answer evaluation, score calculation, and result persistence.
"""

from flask import Blueprint, request, jsonify, g
from models.quiz import Quiz
from services.auth_service import optional_token
from services.progress_service import get_user_progress_metrics

quiz_bp = Blueprint('quiz', __name__)


@quiz_bp.route('/quiz', methods=['GET'])
@quiz_bp.route('/quizzes', methods=['GET'])
@quiz_bp.route('/quiz/questions', methods=['GET'])
def get_quiz_questions():
    """
    GET /api/quiz
    Retrieve quiz questions.
    SECURITY: correct_answer is never exposed before submission.
    """
    questions = Quiz.get_questions(include_answer=False)
    return jsonify({
        'success': True,
        'count': len(questions),
        'questions': questions
    }), 200


@quiz_bp.route('/quiz/submit', methods=['POST'])
@optional_token
def submit_quiz():
    """
    POST /api/quiz/submit
    Evaluate quiz submission, compute or validate score on backend, and store in MySQL.
    Supports both direct score recording and question-by-question answer evaluation.
    """
    data = request.get_json(silent=True) or {}
    user_id = g.current_user['id'] if g.current_user else 1

    category = data.get('category', 'ISL Mixed Quiz')
    score = data.get('score')
    total = data.get('total')
    answers = data.get('answers')

    # Case 1: Client submitted array of answers for server-side evaluation
    if answers and isinstance(answers, list):
        full_questions = Quiz.get_questions(include_answer=True)
        q_map = {q['id']: q for q in full_questions}
        calculated_score = 0
        total_eval = len(answers)
        prefixes = ['A', 'B', 'C', 'D']

        for ans in answers:
            qid = ans.get('questionId') or ans.get('question_id')
            selected_idx = ans.get('selected')
            if qid in q_map and selected_idx is not None:
                correct_char = q_map[qid]['correct_answer']
                user_char = prefixes[selected_idx] if 0 <= selected_idx < 4 else ''
                if user_char == correct_char:
                    calculated_score += 1

        score = calculated_score
        total = total_eval if total_eval > 0 else len(full_questions)

    # Case 2: Frontend evaluated score submitted
    if score is None or total is None or total <= 0:
        return jsonify({
            'success': False,
            'message': 'Valid score and total question count are required.'
        }), 400

    percentage = round((score / total) * 100, 2)

    # Record to MySQL database
    result_id = Quiz.record_result(
        user_id=user_id,
        score=score,
        total_questions=total,
        percentage=percentage,
        category=category
    )

    # Retrieve updated progress stats
    updated_progress = get_user_progress_metrics(user_id)

    return jsonify({
        'success': True,
        'message': 'Quiz result recorded in database successfully.',
        'submissionId': result_id,
        'score': score,
        'total': total,
        'percentage': percentage,
        'progress': updated_progress
    }), 200


@quiz_bp.route('/quiz/results', methods=['GET'])
@quiz_bp.route('/quiz/history', methods=['GET'])
@optional_token
def get_quiz_history():
    """
    GET /api/quiz/results
    Retrieve recent quiz attempt history for the user.
    """
    user_id = g.current_user['id'] if g.current_user else 1
    results = Quiz.get_user_results(user_id)

    return jsonify({
        'success': True,
        'count': len(results),
        'results': results
    }), 200
