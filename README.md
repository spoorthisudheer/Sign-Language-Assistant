# SignConnect AI: AI-Powered Sign Language Learning and Real-Time Communication Assistant

> **College Mini-Project Frontend Module**  
> **Project Title:** AI-Powered Sign Language Learning and Real-Time Communication Assistant  
> **Branding:** SignConnect AI  
> **Tagline:** *"Breaking Communication Barriers, One Sign at a Time."*

---

## 🌟 Executive Summary

**SignConnect AI** is an accessibility and educational platform developed for Indian Sign Language (ISL). The platform enables deaf and hard-of-hearing individuals and hearing peers to learn verified ISL signs, practice gestures with camera-guided feedback, and engage in real-time bilateral communication with automated voice output (Text-to-Speech).

This repository contains the complete frontend implementation, crafted with pure **HTML5, CSS3, JavaScript, and Bootstrap 5**, strictly avoiding heavy external frameworks for maximum performance, maintainability, and clean academic demonstration.

---

## 📂 Project Structure

```
Sign-Language-Assistant/
│
├── frontend/
│   ├── index.html              # High-conversion modern landing page
│   ├── login.html              # User authentication (Sign In)
│   ├── register.html           # User registration (Sign Up)
│   ├── dashboard.html          # Central learning dashboard
│   ├── learn.html              # Indian Sign Language curriculum explorer
│   ├── practice.html           # Webcam gesture practice studio
│   ├── communication.html      # Real-time Sign-to-Speech communication module
│   ├── text-to-sign.html       # Sentence-to-sign visual demonstrator
│   ├── quiz.html               # Interactive multiple-choice sign quizzes
│   ├── progress.html           # Analytics, Chart.js trends & achievement badges
│   ├── profile.html            # User account settings & Flask API configuration
│   │
│   ├── css/
│   │   ├── style.css           # Design tokens, gradients, buttons, public layouts
│   │   ├── dashboard.css       # Sidebar, topbar, metric cards, widget cards
│   │   ├── learning.css        # Sign grid, practice HUD, camera feed, quiz styles
│   │   └── responsive.css      # Mobile & tablet off-canvas breakpoints
│   │
│   ├── js/
│   │   ├── main.js             # API client, mock fallback engine, Web Speech TTS, toasts
│   │   ├── isl-data.js         # ISL curriculum database (48 signs + instructions)
│   │   ├── auth.js             # Form validation, show/hide passwords, session handler
│   │   ├── dashboard.js        # Dashboard metric cards & recent activity
│   │   ├── learning.js         # Category filtering, live search, sign modal
│   │   ├── practice.js         # getUserMedia webcam, canvas landmarks, AI simulation
│   │   ├── communication.js    # Live webcam stream, sentence builder, Web Speech TTS
│   │   ├── text-to-sign.js     # Text parser, ISL token matching, animated playback
│   │   ├── quiz.js             # Question bank, scoring, answer feedback, confetti
│   │   └── progress.js         # Chart.js weekly activity and category mastery charts
│   │
│   └── assets/
│       ├── icons/              # Brand SVG logo and icon marks
│       ├── images/             # 48+ Authentic ISL SVG hand diagrams & hero vectors
│       └── videos/             # Video demonstration assets placeholder
│
└── README.md                   # Complete architectural guide & API handover specs
```

---

## 🎨 Design System & Theme

- **Color Palette:**
  - **Deep Indigo / Royal Purple:** `#4F46E5`, `#7C3AED`
  - **Electric Blue & Cyan:** `#2563EB`, `#06B6D4`
  - **Clean Background Whites & Neutral Slates:** `#FFFFFF`, `#F8FAFC`, `#0F172A`
  - **Accents:** Success `#10B981`, Danger `#EF4444`, Warning `#F59E0B`
- **Typography:** Plus Jakarta Sans & Inter via Google Fonts.
- **Visuals:** Soft drop-shadows, rounded SaaS cards (`border-radius: 18px`), glassmorphic sticky navbars, and animated keypoint overlays mimicking MediaPipe hand meshes.

---

## 🇮🇳 Authentic Indian Sign Language (ISL) Standard

A critical academic highlight of this project is its strict adherence to **Indian Sign Language (ISL)**:
1. **Two-Handed Alphabets:** Unlike American Sign Language (ASL) where alphabets are one-handed, ISL alphabets (A-Z) heavily employ two-handed interaction.
2. **Distinct Vocabulary:** Greetings and daily words (such as *Namaste*, *Good Morning*, *Thank You*, *Help*, *Water*) feature verified ISL hand formations.
3. **Linguistic Grammar Transparency:** The platform explicitly notes that word-by-word sequence display provides lexical reference, acknowledging the distinct Topic-Comment grammatical syntax of natural ISL.

---

## 🔌 Backend Integration Specification (Flask + MySQL + OpenCV + MediaPipe)

The frontend is prepared to integrate with the Python Flask backend. While the Flask backend is being developed, the frontend runs in an **automatic Mock Fallback Mode** so all buttons, quizzes, and forms function out-of-the-box.

### Configurable Base URL
The API base URL defaults to:
```javascript
http://127.0.0.1:5000/api
```
This can be changed dynamically in the UI under **Profile → Backend API Connection Settings**, stored in `localStorage.getItem('signconnect_api_url')`.

### API Endpoints Handover Spec

#### 1. User Registration
- **Endpoint:** `POST /api/register`
- **Request Body (JSON):**
```json
{
  "fullName": "Aarav Sharma",
  "email": "aarav.sharma@example.edu",
  "password": "hashed_or_plain_string"
}
```
- **Expected Response (JSON):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "usr_101",
    "name": "Aarav Sharma",
    "email": "aarav.sharma@example.edu",
    "role": "Student / ISL Learner",
    "avatar": "AS"
  }
}
```

#### 2. User Authentication (Login)
- **Endpoint:** `POST /api/login`
- **Request Body (JSON):**
```json
{
  "email": "aarav.sharma@example.edu",
  "password": "password123",
  "rememberMe": true
}
```
- **Expected Response (JSON):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_101",
    "name": "Aarav Sharma",
    "email": "aarav.sharma@example.edu",
    "role": "Student / ISL Learner",
    "avatar": "AS"
  }
}
```

#### 3. User Profile
- **Endpoint:** `GET /api/profile`
- **Expected Response (JSON):**
```json
{
  "success": true,
  "user": {
    "id": "usr_101",
    "name": "Aarav Sharma",
    "email": "aarav.sharma@example.edu",
    "role": "Student / ISL Learner",
    "stats": {
      "totalLessons": 48,
      "completedLessons": 18,
      "quizzesAttempted": 12,
      "averageScore": 88
    }
  }
}
```

#### 4. Curriculum Lessons
- **Endpoint:** `GET /api/lessons`
- **Expected Response (JSON):**
```json
{
  "success": true,
  "lessons": [
    {
      "id": "a",
      "label": "A",
      "category": "Alphabets",
      "twoHanded": true,
      "title": "Letter A",
      "desc": "Both fists closed with thumbs touching each other."
    }
  ]
}
```

#### 5. User Progress & Analytics
- **Endpoint:** `GET /api/progress`
- **Expected Response (JSON):**
```json
{
  "success": true,
  "progress": {
    "totalLessons": 48,
    "completedLessons": 18,
    "quizzesAttempted": 12,
    "overallPercentage": 42,
    "streakDays": 5,
    "weeklyActivity": [4, 6, 8, 3, 7, 10, 5],
    "categoryBreakdown": {
      "alphabets": 75,
      "numbers": 90,
      "greetings": 60,
      "commonWords": 40
    }
  }
}
```

#### 6. Quiz Score Submission
- **Endpoint:** `POST /api/quiz/submit`
- **Request Body (JSON):**
```json
{
  "score": 8,
  "total": 10,
  "percentage": 80,
  "category": "ISL Mixed Quiz",
  "timestamp": "2026-11-22T08:30:00.000Z"
}
```
- **Expected Response (JSON):**
```json
{
  "success": true,
  "message": "Quiz submission recorded successfully."
}
```

#### 7. AI Gesture Recognition & Prediction
- **Endpoint:** `POST /api/predict`
- **Request Body (JSON):**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "target": "HELLO"
}
```
- **Expected Response (JSON):**
```json
{
  "prediction": "HELLO",
  "confidence": 0.96,
  "landmarks": [[x1, y1, z1], "..."]
}
```

---

## 🚀 How to Run the Website

### Method 1: Python Built-in Web Server (Recommended)
Because modern browser security policies (CORS) restrict camera streams and local module fetching on `file://` URLs, run a local web server:

1. Open PowerShell / Terminal in the project directory:
   ```powershell
   cd Sign-Language-Assistant/frontend
   ```
2. Start Python's built-in HTTP server:
   ```powershell
   python -m http.server 8000
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:8000/index.html
   ```

### Method 2: VS Code Live Server Extension
1. Open the `Sign-Language-Assistant/frontend` folder in VS Code.
2. Right-click `index.html` and select **"Open with Live Server"**.

---

## 🧪 Testing Checklist

- [x] **Navigation:** All 11 pages link to each other with active sidebar highlighting and breadcrumbs.
- [x] **Webcam Stream:** Accesses webcam using `navigator.mediaDevices.getUserMedia` in both `practice.html` and `communication.html`.
- [x] **Text-to-Speech:** Vocalizes recognized sentences and sign pronunciations using browser Web Speech API.
- [x] **Interactive Quiz:** Calculates scores, delivers immediate correct/incorrect explanations, and fires victory confetti.
- [x] **Text-to-Sign:** Tokenizes English phrases, displays animated sign sequences, and provides finger-spelling for unlisted words.
- [x] **Progress Analytics:** Renders Chart.js weekly activity and category mastery charts.
- [x] **Reviewer Demo Mode:** Includes simulated AI prediction buttons so professors and evaluators can test feedback states before the Flask model is loaded.

---

## 📜 Academic Declaration
This frontend application was created as part of the College Mini-Project:  
**"AI-POWERED SIGN LANGUAGE LEARNING AND REAL-TIME COMMUNICATION ASSISTANT"**  
Designed for future full-stack integration with Python Flask, MySQL, OpenCV, and MediaPipe.
