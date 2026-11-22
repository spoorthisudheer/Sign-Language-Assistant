"""
SignConnect AI - Automated Backend Verification Suite
Tests all endpoints, database queries, and response payloads.
"""

import sys
import json
from app import create_app
from database import test_connection, query_db

app = create_app()
client = app.test_client()

passed_count = 0
failed_count = 0


def assert_test(name: str, condition: bool, details: str = ""):
    global passed_count, failed_count
    if condition:
        print(f"  [PASS] {name}")
        passed_count += 1
    else:
        print(f"  [FAIL] {name} - Details: {details}")
        failed_count += 1


def run_all_tests():
    global passed_count, failed_count
    print("======================================================================")
    print(" SignConnect AI - Comprehensive Backend Test Suite")
    print("======================================================================")

    # 1. Database Connection
    print("\n--- 1. Database Connectivity ---")
    db_connected = test_connection()
    assert_test("MySQL Connectivity Check", db_connected, "Cannot connect to MySQL database")

    # 2. Health & Base Route
    print("\n--- 2. Health Check Endpoints ---")
    res = client.get('/api')
    assert_test("GET /api returns 200", res.status_code == 200)
    data = res.get_json()
    assert_test("Health status is online", data.get('status') == 'online')
    assert_test("Health confirms database connected", data.get('database_connected') is True)

    # 3. Lessons Module
    print("\n--- 3. Learning & Lessons Module ---")
    res = client.get('/api/lessons')
    assert_test("GET /api/lessons returns 200", res.status_code == 200)
    data = res.get_json()
    assert_test("Lessons count is 48", data.get('count') == 48, f"Got {data.get('count')}")

    res_cat = client.get('/api/lessons?category=Alphabets')
    assert_test("GET /api/lessons?category=Alphabets returns 200", res_cat.status_code == 200)
    data_cat = res_cat.get_json()
    assert_test("Alphabets category count is 26", data_cat.get('count') == 26)

    res_search = client.get('/api/lessons?search=hello')
    data_search = res_search.get_json()
    assert_test("Search for 'hello' returns matching sign", len(data_search.get('lessons', [])) >= 1)

    res_detail = client.get('/api/lessons/hello')
    assert_test("GET /api/lessons/hello returns 200", res_detail.status_code == 200)
    data_detail = res_detail.get_json()
    assert_test("Detail title is 'Hello / Namaste'", 'Hello' in data_detail.get('lesson', {}).get('title', ''))

    # 4. Quiz Module & Security
    print("\n--- 4. Quiz Module & Security ---")
    res_quiz = client.get('/api/quiz')
    assert_test("GET /api/quiz returns 200", res_quiz.status_code == 200)
    data_quiz = res_quiz.get_json()
    questions = data_quiz.get('questions', [])
    assert_test("Quiz has 10 questions", len(questions) == 10)
    
    # SECURITY: Verify correct_answer is NOT leaked in question payload
    has_leak = any('correct_answer' in q or 'correct' in q for q in questions)
    assert_test("Security: correct_answer is NOT exposed before submission", not has_leak)

    # 5. User Registration & Validation
    print("\n--- 5. User Authentication & Validation ---")
    test_email = "test_student_2026@signconnect.ai"
    # Clean up prior test user if present
    from database import execute_db
    execute_db("DELETE FROM users WHERE email = %s", (test_email,))

    # Invalid short password
    res_short = client.post('/api/register', json={
        'fullName': 'Test Student',
        'email': test_email,
        'password': '123'
    })
    assert_test("Reject registration with password < 8 chars (400)", res_short.status_code == 400)

    # Valid registration
    res_reg = client.post('/api/register', json={
        'fullName': 'Test Student',
        'email': test_email,
        'password': 'TestPassword@2026'
    })
    assert_test("POST /api/register creates user (201)", res_reg.status_code == 201)
    reg_data = res_reg.get_json()
    auth_token = reg_data.get('token')
    assert_test("Registration returns valid JWT token", bool(auth_token))
    assert_test("Registration returns user object", reg_data.get('user', {}).get('email') == test_email)

    # Duplicate registration check
    res_dup = client.post('/api/register', json={
        'fullName': 'Test Student 2',
        'email': test_email,
        'password': 'TestPassword@2026'
    })
    assert_test("Reject duplicate email registration (409)", res_dup.status_code == 409)

    # 6. User Login
    print("\n--- 6. User Login Verification ---")
    res_bad_login = client.post('/api/login', json={
        'email': test_email,
        'password': 'WrongPassword!'
    })
    assert_test("Reject invalid login credentials (401)", res_bad_login.status_code == 401)

    res_good_login = client.post('/api/login', json={
        'email': test_email,
        'password': 'TestPassword@2026'
    })
    assert_test("POST /api/login succeeds (200)", res_good_login.status_code == 200)
    login_data = res_good_login.get_json()
    assert_test("Login returns user name", login_data.get('user', {}).get('name') == 'Test Student')

    # Test seed user login
    res_seed_login = client.post('/api/login', json={
        'email': 'learner@signconnect.ai',
        'password': 'Password@123'
    })
    assert_test("Seed user learner@signconnect.ai logs in successfully", res_seed_login.status_code == 200)

    # 7. Profile API
    print("\n--- 7. Profile API ---")
    res_prof = client.get('/api/profile', headers={'Authorization': f'Bearer {auth_token}'})
    assert_test("GET /api/profile returns 200", res_prof.status_code == 200)
    prof_data = res_prof.get_json()
    assert_test("Profile user matches authenticated user", prof_data.get('user', {}).get('email') == test_email)

    # 8. Progress API
    print("\n--- 8. Learning Progress API ---")
    res_prog = client.get('/api/progress')
    assert_test("GET /api/progress returns 200", res_prog.status_code == 200)
    prog_data = res_prog.get_json()
    p = prog_data.get('progress', {})
    assert_test("Progress totalLessons is 48", p.get('totalLessons') == 48)
    assert_test("Progress has categoryBreakdown", 'categoryBreakdown' in p)
    assert_test("Progress has weeklyActivity 7-day array", len(p.get('weeklyActivity', [])) == 7)

    # 9. Mark Lesson Complete
    print("\n--- 9. Lesson Completion & Progress Update ---")
    res_comp = client.post('/api/lessons/b/complete', headers={'Authorization': f'Bearer {auth_token}'})
    assert_test("POST /api/lessons/b/complete succeeds", res_comp.status_code == 200)
    assert_test("Completion returns updated progress", 'progress' in res_comp.get_json())

    # 10. Quiz Submission & Scoring
    print("\n--- 10. Quiz Submission & Scoring ---")
    # Submitting score directly (as in frontend quiz.js)
    res_quiz_sub = client.post('/api/quiz/submit', json={
        'score': 9,
        'total': 10,
        'percentage': 90,
        'category': 'ISL Mixed Quiz'
    }, headers={'Authorization': f'Bearer {auth_token}'})
    assert_test("POST /api/quiz/submit succeeds (200)", res_quiz_sub.status_code == 200)
    sub_data = res_quiz_sub.get_json()
    assert_test("Quiz submission returns submissionId", bool(sub_data.get('submissionId')))

    # Submitting answers array for server-side evaluation
    res_eval_sub = client.post('/api/quiz/submit', json={
        'answers': [
            {'questionId': 1, 'selected': 0}, # Letter A -> Option A (correct)
            {'questionId': 2, 'selected': 1}, # Hello -> Option B (correct)
            {'questionId': 3, 'selected': 0}  # Incorrect option
        ]
    }, headers={'Authorization': f'Bearer {auth_token}'})
    assert_test("POST /api/quiz/submit evaluates server-side score", res_eval_sub.status_code == 200)
    eval_data = res_eval_sub.get_json()
    assert_test("Server-side evaluated score is 2/3", eval_data.get('score') == 2 and eval_data.get('total') == 3)

    # Quiz history
    res_hist = client.get('/api/quiz/results', headers={'Authorization': f'Bearer {auth_token}'})
    assert_test("GET /api/quiz/results returns attempts", len(res_hist.get_json().get('results', [])) >= 1)

    # 11. Sign Prediction / Recognition Module
    print("\n--- 11. Sign Language Recognition API ---")
    res_pred = client.post('/api/predict', json={
        'target': 'HELLO',
        'image': None
    })
    assert_test("POST /api/predict returns 200", res_pred.status_code == 200)
    pred_data = res_pred.get_json()
    assert_test("Predict returns success: true", pred_data.get('success') is True)
    assert_test("Predict returns mode: mock (or live_ai)", pred_data.get('mode') in ('mock', 'live_ai'))
    assert_test("Predict returns prediction label", pred_data.get('prediction') == 'HELLO')
    assert_test("Predict acknowledges pending model status", 'pending' in pred_data.get('message', '').lower() or pred_data.get('mode') == 'live_ai')

    # 12. Text-to-Sign Module
    print("\n--- 12. Text-to-Sign Module ---")
    res_t2s = client.post('/api/text-to-sign', json={
        'text': 'GOOD MORNING DEAF'
    })
    assert_test("POST /api/text-to-sign returns 200", res_t2s.status_code == 200)
    t2s_data = res_t2s.get_json()
    assert_test("T2S returns sequence array", len(t2s_data.get('sequence', [])) > 0)
    assert_test("T2S correctly decomposes fingerspelling for non-core word", t2s_data.get('has_unsupported_words') is True)

    # 13. Communication Module
    print("\n--- 13. Real-Time Communication API ---")
    res_comm_log = client.post('/api/communication/log', json={
        'sign': 'THANK YOU',
        'confidence': 0.94
    }, headers={'Authorization': f'Bearer {auth_token}'})
    assert_test("POST /api/communication/log succeeds", res_comm_log.status_code == 201)

    res_comm_hist = client.get('/api/communication/history')
    assert_test("GET /api/communication/history returns logs", res_comm_hist.status_code == 200)

    # Clean up test user
    execute_db("DELETE FROM users WHERE email = %s", (test_email,))

    print("\n======================================================================")
    print(f" Test Results: {passed_count} PASSED, {failed_count} FAILED")
    print("======================================================================")

    if failed_count == 0:
        print(">> ALL BACKEND TESTS PASSED SUCCESSFULLY! <<\n")
        return 0
    else:
        print(">> SOME TESTS FAILED! <<\n")
        return 1


if __name__ == '__main__':
    code = run_all_tests()
    sys.exit(code)
