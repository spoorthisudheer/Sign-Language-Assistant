/**
 * SignConnect AI - Interactive Quiz Module
 * Handles Question Banks (Alphabets, Numbers, Common Signs), Real-Time Feedback,
 * Score Tracking, Confetti Celebration, and Flask POST /api/quiz/submit.
 */

// Comprehensive Question Bank
const QUIZ_QUESTION_BANK = [
  {
    id: 1,
    category: 'Alphabets',
    signId: 'a',
    question: 'Identify the Indian Sign Language (ISL) letter shown in the image:',
    options: ['Letter A', 'Letter S', 'Letter T', 'Letter M'],
    correct: 0,
    explanation: 'In ISL, Letter A is signed with both fists closed and thumbs touching together at chest height.'
  },
  {
    id: 2,
    category: 'Common Signs',
    signId: 'hello',
    question: 'What message or greeting does this sign represent in ISL?',
    options: ['Good Bye', 'Hello / Namaste', 'Thank You', 'Excuse Me'],
    correct: 1,
    explanation: 'Both palms joined together in front of the chest in a Namaste posture represents Hello or Namaste in Indian Sign Language.'
  },
  {
    id: 3,
    category: 'Common Signs',
    signId: 'thank_you',
    question: 'Identify the polite expression demonstrated in this gesture:',
    options: ['Please', 'Sorry', 'Thank You', 'Welcome'],
    correct: 2,
    explanation: 'Touching the chin or lips with a flat hand and moving it gently forward towards the person signs Thank You.'
  },
  {
    id: 4,
    category: 'Numbers',
    signId: '5',
    question: 'Which numerical digit is represented by this sign?',
    options: ['Number 3', 'Number 4', 'Number 5', 'Number 10'],
    correct: 2,
    explanation: 'An open hand with all five fingers and thumb spread outward clearly represents Number 5.'
  },
  {
    id: 5,
    category: 'Common Signs',
    signId: 'help',
    question: 'Which crucial emergency or everyday word is signed here?',
    options: ['Stop', 'Help', 'Wait', 'Doctor'],
    correct: 1,
    explanation: 'Left hand flat palm up, with right thumbs-up fist placed onto it and lifted upward together signifies Help.'
  },
  {
    id: 6,
    category: 'Alphabets',
    signId: 'c',
    question: 'Identify the ISL alphabet letter demonstrated:',
    options: ['Letter O', 'Letter C', 'Letter G', 'Letter U'],
    correct: 1,
    explanation: 'Curving the fingers and thumb to form a curved open arc represents the Letter C in ISL.'
  },
  {
    id: 7,
    category: 'Common Signs',
    signId: 'sorry',
    question: 'Which sign is formed by a closed fist rubbing circular over the heart?',
    options: ['Pain', 'Angry', 'Sorry', 'Love'],
    correct: 2,
    explanation: 'In ISL, rubbing a closed fist in a soothing circular motion over the heart represents Sorry / Apology.'
  },
  {
    id: 8,
    category: 'Numbers',
    signId: '1',
    question: 'Identify this single-finger sign:',
    options: ['Number 1', 'Letter I', 'Look Up', 'Silence'],
    correct: 0,
    explanation: 'A single upright index finger with other fingers folded represents Number 1.'
  },
  {
    id: 9,
    category: 'Everyday',
    signId: 'water',
    question: 'Which daily essential is signed by tapping a W-shape at the chin?',
    options: ['Tea', 'Food', 'Water', 'Medicine'],
    correct: 2,
    explanation: 'Forming a W-handshape and tapping the fingertips against the chin/lips twice is the standard ISL sign for Water.'
  },
  {
    id: 10,
    category: 'Common Signs',
    signId: 'yes',
    question: 'Which affirmative response is communicated by this nodding fist?',
    options: ['No', 'Yes', 'Maybe', 'Sure'],
    correct: 1,
    explanation: 'A closed fist held forward that nods up and down from the wrist mimics a nodding head for Yes.'
  }
];

let activeQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let isAnswerSubmitted = false;

document.addEventListener('DOMContentLoaded', () => {
  initQuiz();
});

function initQuiz() {
  // Start with default 10-question set
  activeQuestions = [...QUIZ_QUESTION_BANK];
  currentQuestionIndex = 0;
  score = 0;
  userAnswers = [];
  isAnswerSubmitted = false;

  renderQuestion();

  const btnNext = document.getElementById('btnNextQuestion');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (currentQuestionIndex < activeQuestions.length - 1) {
        currentQuestionIndex++;
        isAnswerSubmitted = false;
        renderQuestion();
      } else {
        finishQuiz();
      }
    });
  }

  const btnRetake = document.getElementById('btnRetakeQuiz');
  if (btnRetake) {
    btnRetake.addEventListener('click', () => {
      document.getElementById('quizResultScreen').style.display = 'none';
      document.getElementById('quizActiveScreen').style.display = 'block';
      initQuiz();
    });
  }
}

// Render active question
function renderQuestion() {
  const q = activeQuestions[currentQuestionIndex];
  if (!q) return;

  // Update counters and progress bar
  document.getElementById('quizCurrentNumber').textContent = currentQuestionIndex + 1;
  document.getElementById('quizTotalCount').textContent = activeQuestions.length;
  document.getElementById('quizScoreTracker').textContent = `Score: ${score}`;
  
  const progressPercent = Math.round(((currentQuestionIndex) / activeQuestions.length) * 100);
  const progressBar = document.getElementById('quizProgressBar');
  if (progressBar) progressBar.style.width = `${progressPercent}%`;

  // Image and Question
  document.getElementById('quizQuestionText').textContent = q.question;
  const imgEl = document.getElementById('quizQuestionImg');
  if (imgEl) {
    imgEl.src = `assets/images/isl_${q.signId}.svg`;
    imgEl.alt = 'Sign Question';
  }

  // Render 4 options
  const optionsContainer = document.getElementById('quizOptionsGrid');
  const prefixes = ['A', 'B', 'C', 'D'];

  optionsContainer.innerHTML = q.options.map((opt, idx) => `
    <button type="button" class="quiz-option-btn" id="optionBtn_${idx}" onclick="handleOptionSelect(${idx})">
      <span class="option-prefix">${prefixes[idx]}</span>
      <span class="option-text">${opt}</span>
    </button>
  `).join('');

  // Reset feedback box and Next button
  const feedbackBox = document.getElementById('quizFeedbackBox');
  if (feedbackBox) feedbackBox.style.display = 'none';

  const nextBtn = document.getElementById('btnNextQuestion');
  if (nextBtn) {
    nextBtn.disabled = true;
    nextBtn.textContent = (currentQuestionIndex === activeQuestions.length - 1) ? 'View Final Results' : 'Next Question';
  }
}

// User selects an answer option
function handleOptionSelect(selectedIndex) {
  if (isAnswerSubmitted) return;
  isAnswerSubmitted = true;

  const q = activeQuestions[currentQuestionIndex];
  const isCorrect = selectedIndex === q.correct;

  if (isCorrect) {
    score++;
    document.getElementById('quizScoreTracker').textContent = `Score: ${score}`;
  }

  userAnswers.push({
    questionId: q.id,
    question: q.question,
    selected: selectedIndex,
    correct: q.correct,
    isCorrect: isCorrect,
    signId: q.signId
  });

  // Highlight options
  const selectedBtn = document.getElementById(`optionBtn_${selectedIndex}`);
  const correctBtn = document.getElementById(`optionBtn_${q.correct}`);

  if (selectedBtn) {
    selectedBtn.classList.add(isCorrect ? 'correct' : 'incorrect');
  }
  if (!isCorrect && correctBtn) {
    correctBtn.classList.add('correct');
  }

  // Disable all options
  document.querySelectorAll('.quiz-option-btn').forEach(btn => {
    btn.disabled = true;
  });

  // Display feedback explanation
  const feedbackBox = document.getElementById('quizFeedbackBox');
  const feedbackTitle = document.getElementById('quizFeedbackTitle');
  const feedbackText = document.getElementById('quizFeedbackExplanation');

  if (feedbackBox) {
    feedbackBox.style.display = 'block';
    if (isCorrect) {
      feedbackBox.className = 'alert alert-success d-flex align-items-start gap-3 mt-3';
      feedbackTitle.innerHTML = '<i class="bi bi-check-circle-fill text-success me-2"></i> Correct Answer!';
    } else {
      feedbackBox.className = 'alert alert-danger d-flex align-items-start gap-3 mt-3';
      feedbackTitle.innerHTML = '<i class="bi bi-x-circle-fill text-danger me-2"></i> Incorrect';
    }
    feedbackText.textContent = q.explanation;
  }

  // Enable Next button
  const nextBtn = document.getElementById('btnNextQuestion');
  if (nextBtn) nextBtn.disabled = false;
}

// Complete Quiz & Render Results
async function finishQuiz() {
  document.getElementById('quizActiveScreen').style.display = 'none';
  const resultScreen = document.getElementById('quizResultScreen');
  resultScreen.style.display = 'block';

  const total = activeQuestions.length;
  const percentage = Math.round((score / total) * 100);

  document.getElementById('finalScoreNumber').textContent = score;
  document.getElementById('finalScoreTotal').textContent = `/ ${total}`;
  document.getElementById('finalScorePercentage').textContent = `${percentage}% Accuracy`;

  // Result Badge & Messaging
  const badgeEl = document.getElementById('finalResultBadge');
  const messageEl = document.getElementById('finalResultMessage');

  if (percentage >= 80) {
    badgeEl.textContent = 'ISL Champion';
    badgeEl.className = 'badge bg-success px-3 py-2 fs-6';
    messageEl.textContent = 'Outstanding! You have demonstrated exceptional mastery of Indian Sign Language signs!';
    
    // Trigger celebration confetti
    triggerConfetti();

  } else if (percentage >= 50) {
    badgeEl.textContent = 'Proficient Learner';
    badgeEl.className = 'badge bg-primary px-3 py-2 fs-6';
    messageEl.textContent = 'Great work! You are making steady progress. Review the missed signs to solidify your recall.';
  } else {
    badgeEl.textContent = 'Keep Practicing';
    badgeEl.className = 'badge bg-warning px-3 py-2 fs-6 text-dark';
    messageEl.textContent = 'Good effort! Sign language takes regular practice. Visit the Learn Module to review these signs.';
  }

  // Render question review breakdown list
  renderQuizReview();

  // Submit result to Flask Backend POST /api/quiz/submit
  try {
    await SignConnect.apiCall('/quiz/submit', 'POST', {
      score: score,
      total: total,
      percentage: percentage,
      category: 'ISL Mixed Quiz',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Quiz score submit error:', err);
  }
}

function renderQuizReview() {
  const container = document.getElementById('quizReviewContainer');
  if (!container) return;

  container.innerHTML = userAnswers.map((ans, idx) => {
    const q = activeQuestions[idx];
    return `
      <div class="list-group-item d-flex align-items-center justify-content-between p-3">
        <div class="d-flex align-items-center gap-3">
          <img src="assets/images/isl_${ans.signId}.svg" alt="Sign" style="width: 45px; height: 45px; object-fit: contain;">
          <div>
            <div class="fw-bold small">${q.question}</div>
            <div class="text-secondary smaller">
              Your answer: <span class="${ans.isCorrect ? 'text-success fw-bold' : 'text-danger fw-bold'}">${q.options[ans.selected]}</span>
              ${!ans.isCorrect ? ` · Correct: <span class="text-success fw-bold">${q.options[ans.correct]}</span>` : ''}
            </div>
          </div>
        </div>
        <div>
          ${ans.isCorrect ? '<span class="badge bg-success"><i class="bi bi-check"></i> Correct</span>' : '<span class="badge bg-danger"><i class="bi bi-x"></i> Incorrect</span>'}
        </div>
      </div>
    `;
  }).join('');
}

// Confetti celebration animation using canvas-confetti
function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}
