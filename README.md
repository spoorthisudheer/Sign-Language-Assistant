# SignConnect AI – AI-Powered Sign Language Learning and Real-Time Communication Assistant

SignConnect AI is a comprehensive web platform combining an Indian Sign Language (ISL) learning curriculum, interactive practice studios, real-time communication tools, and automated quizzes.

---

## 1. System Architecture & Tech Stack

```
   ┌─────────────────────────────────────────────────────────────┐
   │                      Frontend (HTML5/CSS3/JS)               │
   │  Dashboard · Learn · Practice · Real-Time Comm · Quizzes    │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ JSON REST API (Fetch)
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                  Flask Python Backend (Port 5000)           │
   │  Flask-CORS · PyJWT · Werkzeug Security · OpenCV · MediaPipe│
   ├──────────────────────────────┬──────────────────────────────┤
   │ Routes:                      │ Services:                    │
   │  - /api/register, /login     │  - auth_service              │
   │  - /api/profile              │  - progress_service          │
   │  - /api/lessons              │  - recognition_service       │
   │  - /api/progress             │  - text_to_sign_service      │
   │  - /api/quiz/submit          │                              │
   │  - /api/predict              │                              │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ PyMySQL Connection
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │               MySQL Database (signconnect_ai)               │
   │  users · lessons (48) · user_progress · quizzes · results   │
   └─────────────────────────────────────────────────────────────┘
```

- **Backend**: Python 3.10+ / Flask 3.x, Flask-CORS, PyJWT, Werkzeug
- **Vision & AI Integration Pipeline**: OpenCV (`opencv-python`), MediaPipe Hands (`mediapipe`), NumPy
- **Database**: MySQL 8.x / MariaDB (XAMPP compatible), PyMySQL
- **Frontend**: Responsive HTML5, Bootstrap 5.3, Bootstrap Icons, Chart.js, Canvas-Confetti, Web Speech API

---

## 2. Project Directory Structure

```
Sign-Language-Assistant/
│
├── frontend/
│   ├── index.html               # Landing & Hero Showcase
│   ├── login.html               # User Login Form
│   ├── register.html            # User Registration Form
│   ├── dashboard.html           # Learning Dashboard & Metrics
│   ├── learn.html               # 48 Verified ISL Signs Directory
│   ├── practice.html            # Webcam Studio with Landmarking
│   ├── communication.html       # Real-Time Sign-to-Speech Assistant
│   ├── text-to-sign.html        # Text to ISL Sequence Demonstrator
│   ├── quiz.html                # Multi-Category ISL Knowledge Quiz
│   ├── progress.html            # Visual Learning Analytics & Charts
│   ├── profile.html             # Account Details & API Configuration
│   ├── css/                     # Stylesheets (dashboard, learning, responsive)
│   ├── js/                      # Frontend Logic & API Client
│   └── assets/                  # Icons and 48 Official SVG Demonstration Signs
│
├── backend/
│   ├── app.py                   # Flask Application Entry Point
│   ├── config.py                # Environment & Configuration Manager
│   ├── database.py              # PyMySQL Connection & Query Utilities
│   ├── requirements.txt         # Python Package Dependencies
│   ├── .env.example             # Template for Environment Variables
│   ├── test_backend.py          # 46 Automated Unit & Integration Tests
│   ├── routes/
│   │   ├── auth.py              # Register, Login, Logout
│   │   ├── profile.py           # User Profile & Password Updates
│   │   ├── lessons.py           # Curriculum, Category Filters & Completion
│   │   ├── progress.py          # Progress Metrics & Mastery Calculations
│   │   ├── quiz.py              # Quiz Retrieval & Server-Side Evaluation
│   │   ├── prediction.py        # Webcam Frame Processing & Classification
│   │   ├── text_to_sign.py      # Text Tokenization to Sign Sequences
│   │   └── communication.py     # Real-Time Recognition Logging
│   ├── models/
│   │   ├── user.py              # User ORM / SQL Layer
│   │   ├── lesson.py            # Lesson ORM / SQL Layer
│   │   ├── progress.py          # UserProgress SQL Layer
│   │   ├── quiz.py              # Quiz & QuizResult SQL Layer
│   │   └── communication.py     # CommunicationLog SQL Layer
│   ├── services/
│   │   ├── auth_service.py       # Password Hashing, JWT Tokens, Decorators
│   │   ├── progress_service.py   # Aggregated Progress Calculations
│   │   ├── recognition_service.py# OpenCV/MediaPipe Landmarking Pipeline
│   │   └── text_to_sign_service.py# Natural Language to ISL Mapper
│   └── database/
│       └── schema.sql           # Complete Database DDL & Seed Records
│
├── .gitignore                   # Excludes .env, __pycache__, and venv
└── README.md                    # Project Documentation
```

---

## 3. Database Setup (MySQL / XAMPP)

1. **Start MySQL**:
   - Open **XAMPP Control Panel** and start **MySQL**, or run MySQL service on port `3306`.
2. **Create Database & Import Schema**:
   Open a terminal in the project directory and execute:
   ```bash
   mysql -u root -p < backend/database/schema.sql
   ```
   *(If your MySQL `root` user has no password, omit `-p`).*

3. **Verify Database Creation**:
   The script creates the database `signconnect_ai` with 6 tables and pre-populates:
   - `users`: Default test accounts:
     - `learner@signconnect.ai` (Password: `Password@123`)
     - `admin@signconnect.ai` (Password: `Admin@123`)
   - `lessons`: 48 authentic ISL signs (26 Alphabets, 10 Numbers, 4 Greetings, 8 Common Words).
   - `quizzes`: 10 comprehensive sign language questions.
   - `user_progress`: 18 initial completed lessons for the demo learner.
   - `quiz_results`: 3 sample quiz attempts.

---

## 4. Backend Setup & Run

1. **Navigate to the Backend Directory**:
   ```bash
   cd backend
   ```

2. **Install Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Adjust MySQL credentials if your local setup uses a non-empty password:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=signconnect_ai
   SECRET_KEY=signconnect_ai_super_secret_jwt_key_2026_secure
   FLASK_PORT=5000
   FLASK_DEBUG=True
   CORS_ORIGINS=*
   ```

4. **Run the Automated Test Suite**:
   ```bash
   python test_backend.py
   ```
   *(Verifies all 46 test cases across database, auth, curriculum, quiz, prediction, and security).*

5. **Start the Flask Server**:
   ```bash
   python app.py
   ```
   The server starts at `http://127.0.0.1:5000/api`.

---

## 5. Connecting Frontend and Backend

The frontend automatically connects to the backend at `http://127.0.0.1:5000/api` through `frontend/js/main.js`.

To view and use the frontend:
1. Open any HTML file (e.g. `frontend/index.html` or `frontend/dashboard.html`) in a modern browser (Google Chrome, Microsoft Edge, Firefox).
2. Alternatively, serve via Python's built-in HTTP server:
   ```bash
   python -m http.server 8000 --directory frontend
   ```
   Open `http://localhost:8000` in your web browser.
3. Check the top navigation bar:
   - A green pill indicating **`Flask API: Connected`** confirms live communication with the Flask backend.
   - If the backend is stopped, it gracefully indicates **`Flask API: Mock Mode`**.

---

## 6. Complete API Endpoint Documentation

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | Backend status, DB connectivity, endpoint catalog | No |
| `POST` | `/api/register` | Create user account with Werkzeug password hashing | No |
| `POST` | `/api/login` | Authenticate credentials; returns JWT session token | No |
| `POST` | `/api/logout` | Terminate user session | No |
| `GET` | `/api/profile` | Retrieve active user profile & learning metrics | Optional |
| `PUT` | `/api/profile` | Update user name and email | Yes |
| `POST` | `/api/profile/change-password` | Verify old password and set new hashed password | Yes |
| `GET` | `/api/lessons` | Retrieve all 48 signs; filters by `?category=` & `?search=` | No |
| `GET` | `/api/lessons/<id>` | Retrieve sign specifications, steps, and variations | No |
| `POST` | `/api/lessons/<id>/complete` | Mark sign as completed; updates progress analytics | Optional |
| `GET` | `/api/progress` | Overall completion, category mastery, weekly activity | Optional |
| `GET` | `/api/quiz` | Retrieve 10 quiz questions (answers securely hidden) | No |
| `POST` | `/api/quiz/submit` | Evaluate quiz, calculate score on backend, save attempt | Optional |
| `GET` | `/api/quiz/results` | Retrieve user's previous quiz submission history | Optional |
| `POST` | `/api/predict` | Frame decoding, MediaPipe hand detection, ML inference | No |
| `POST` | `/api/text-to-sign` | Tokenize English text to sequential ISL demonstrations | No |
| `GET` | `/api/communication/history` | Retrieve recent recognized signs & sentence logs | Optional |
| `POST` | `/api/communication/log` | Record a detected sign to communication history | Optional |

---

## 7. Status of Features

### Fully Implemented
- [x] Flask RESTful API architecture with clean, modular blueprints.
- [x] MySQL schema with foreign keys, cascading deletes, and 48 authentic ISL signs.
- [x] User registration, login, logout, and token authentication (JWT).
- [x] Werkzeug SHA256 password hashing (no plaintext passwords).
- [x] Real database progress calculation (total, completed, quizzes, category mastery).
- [x] Quiz question retrieval with zero answer leakage before submission.
- [x] Server-side quiz evaluation, scoring, and history tracking.
- [x] Text-to-Sign NLP tokenizer matching phrases, vocabulary, and fingerspelling.
- [x] Real-time communication logger and speech synthesis bridge.
- [x] Comprehensive 46-case automated test suite.
- [x] Local `.env.example` template with `.gitignore` protection.

### Modular Architecture Ready for Future AI Team Integration
- [ ] **Trained Deep Learning Weights**: The `recognition_service.py` is configured with OpenCV frame decoding and MediaPipe Hand landmarking. When the AI team finishes training the sign language classification model (e.g. PyTorch `.pth` or Keras `.h5`), place the file in `backend/models/` and the service will automatically run live inference instead of the mock response.
