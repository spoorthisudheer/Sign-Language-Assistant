
/**
 * SignConnect AI - Practice Studio
 * Browser webcam + Flask API + MediaPipe hand landmark visualization.
 * Sign classification will be integrated after model training.
 */

let currentPracticeSign = null;
let mediaStream = null;
let predictionTimer = null;
let isPredicting = false;

const API_INTERVAL = 350;

// MediaPipe hand connections (21 landmarks)
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

document.addEventListener('DOMContentLoaded', () => {
  initTargetSign();
  initCameraControls();
  initSimulationControls();
});

// --------------------------------------------------
// TARGET SIGN
// --------------------------------------------------

function initTargetSign() {
  const urlParams = new URLSearchParams(window.location.search);
  const signId = urlParams.get('sign');

  if (window.ISL_DATA) {
    if (signId) {
      currentPracticeSign = window.ISL_DATA.getSign(signId);
    }

    if (!currentPracticeSign) {
      const all = [
        ...window.ISL_DATA.alphabets,
        ...window.ISL_DATA.words
      ];

      currentPracticeSign =
        all[Math.floor(Math.random() * all.length)];
    }
  }

  updateTargetSignUI();

  const nextBtn = document.getElementById('btnNextRandomSign');

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (!window.ISL_DATA) return;

      const all = [
        ...window.ISL_DATA.alphabets,
        ...window.ISL_DATA.words
      ];

      currentPracticeSign =
        all[Math.floor(Math.random() * all.length)];

      updateTargetSignUI();
      resetFeedback();
    });
  }

  const selector = document.getElementById('practiceSignSelector');

  if (selector && window.ISL_DATA) {
    const all = [
      ...window.ISL_DATA.alphabets,
      ...window.ISL_DATA.numbers,
      ...window.ISL_DATA.words
    ];

    selector.innerHTML = all.map(sign => `
            <option value="${sign.id}"
                ${currentPracticeSign &&
        currentPracticeSign.id === sign.id ? 'selected' : ''}>
                [${sign.category}] ${sign.title}
            </option>
        `).join('');

    selector.addEventListener('change', event => {
      currentPracticeSign =
        window.ISL_DATA.getSign(event.target.value);

      updateTargetSignUI();
      resetFeedback();
    });
  }
}

function updateTargetSignUI() {
  if (!currentPracticeSign) return;

  document.getElementById('targetSignLabel').textContent =
    currentPracticeSign.label;

  document.getElementById('targetSignTitle').textContent =
    `${currentPracticeSign.title} (ISL)`;

  document.getElementById('targetSignCategory').textContent =
    currentPracticeSign.category;

  document.getElementById('targetSignDescription').textContent =
    currentPracticeSign.desc;

  const image = document.getElementById('targetSignImage');

  if (image) {
    image.src = `assets/images/isl_${currentPracticeSign.id}.svg`;
    image.alt = currentPracticeSign.title;
  }

  const badge = document.getElementById('targetSignHandBadge');

  if (badge) {
    badge.textContent = currentPracticeSign.twoHanded
      ? '2 Hands Required'
      : '1 Hand Required';
  }
}

// --------------------------------------------------
// CAMERA CONTROLS
// --------------------------------------------------

function initCameraControls() {
  const startBtn = document.getElementById('btnStartCamera');
  const stopBtn = document.getElementById('btnStopCamera');

  if (startBtn) {
    startBtn.addEventListener('click', startCamera);
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', stopCamera);
  }
}

async function startCamera() {
  const startBtn = document.getElementById('btnStartCamera');
  const stopBtn = document.getElementById('btnStopCamera');

  const video = document.getElementById('practiceVideo');
  const placeholder = document.getElementById('cameraPlaceholder');

  try {
    startBtn.disabled = true;

    updateCameraStatus('requesting', 'Requesting camera access...');

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      },
      audio: false
    });

    video.srcObject = mediaStream;

    await video.play();

    placeholder.style.display = 'none';
    video.style.display = 'block';

    updateCameraStatus('active', 'Camera Active');

    startBtn.disabled = true;
    stopBtn.disabled = false;

    SignConnect.showToast(
      'Camera started successfully.',
      'success'
    );

    // Start actual Flask + MediaPipe detection
    startPredictionLoop();

  } catch (error) {
    console.error('Camera error:', error);

    updateCameraStatus('error', 'Camera Access Failed');

    startBtn.disabled = false;

    SignConnect.showToast(
      'Could not access camera: ' + error.message,
      'danger'
    );
  }
}

// --------------------------------------------------
// STOP CAMERA
// --------------------------------------------------

function stopCamera() {
  if (predictionTimer) {
    clearTimeout(predictionTimer);
    predictionTimer = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  const video = document.getElementById('practiceVideo');
  const placeholder = document.getElementById('cameraPlaceholder');

  document.getElementById('btnStartCamera').disabled = false;
  document.getElementById('btnStopCamera').disabled = true;

  video.srcObject = null;
  video.style.display = 'none';

  placeholder.style.display = 'flex';

  clearLandmarkCanvas();

  updateCameraStatus('off', 'Camera Disconnected');

  resetFeedback();
}

// --------------------------------------------------
// CAMERA STATUS
// --------------------------------------------------

function updateCameraStatus(state, message) {
  const badge = document.getElementById('cameraStatusBadge');

  if (!badge) return;

  if (state === 'active') {
    badge.innerHTML =
      '<span class="camera-live-dot"></span> ' + message;

    badge.className =
      'camera-hud-badge bg-success bg-opacity-75';

  } else if (state === 'requesting') {
    badge.textContent = message;

    badge.className =
      'camera-hud-badge bg-warning text-dark';

  } else if (state === 'error') {
    badge.textContent = message;

    badge.className =
      'camera-hud-badge bg-danger';

  } else {
    badge.textContent = message;

    badge.className =
      'camera-hud-badge bg-dark bg-opacity-75';
  }
}

// --------------------------------------------------
// SEND CAMERA FRAMES TO FLASK
// --------------------------------------------------

function startPredictionLoop() {
  if (predictionTimer) {
    clearTimeout(predictionTimer);
  }

  const video = document.getElementById('practiceVideo');

  async function processFrame() {
    if (!mediaStream || !video || video.readyState < 2) {
      return;
    }

    if (!isPredicting) {
      isPredicting = true;

      try {
        const canvas = document.createElement('canvas');

        canvas.width = 320;
        canvas.height = 240;

        const context = canvas.getContext('2d');

        context.drawImage(video, 0, 0, 320, 240);

        const imageBase64 =
          canvas.toDataURL('image/jpeg', 0.7);

        const result = await SignConnect.apiCall(
          '/predict',
          'POST',
          {
            image: imageBase64,
            target: null
          }
        );

        if (result && result.success) {
          drawHandLandmarks(result.landmarks || []);

          updateDetectionFeedback(result);

        } else {
          clearLandmarkCanvas();
        }

      } catch (error) {
        console.error('Prediction API error:', error);

        updateDetectionMessage(
          'Backend connection failed. Check Flask server.'
        );

      } finally {
        isPredicting = false;
      }
    }

    if (mediaStream) {
      predictionTimer = setTimeout(
        processFrame,
        API_INTERVAL
      );
    }
  }

  processFrame();
}

// --------------------------------------------------
// DRAW ACTUAL MEDIAPIPE LANDMARKS
// --------------------------------------------------

function drawHandLandmarks(hands) {
  const canvas = document.getElementById('practiceCanvasOverlay');

  if (!canvas) return;

  const container = canvas.parentElement;

  const width = container.clientWidth;
  const height = container.clientHeight;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext('2d');

  context.clearRect(0, 0, width, height);

  // Tracking guide
  const boxWidth = Math.min(width * 0.55, 320);
  const boxHeight = Math.min(height * 0.7, 340);

  context.strokeStyle = 'rgba(56, 189, 248, 0.75)';
  context.lineWidth = 2;
  context.setLineDash([8, 6]);

  context.strokeRect(
    (width - boxWidth) / 2,
    (height - boxHeight) / 2,
    boxWidth,
    boxHeight
  );

  context.setLineDash([]);

  // Actual hand landmarks
  hands.forEach(hand => {
    if (!hand || hand.length !== 21) return;

    // Draw connections
    context.strokeStyle = '#00E5FF';
    context.lineWidth = 3;

    HAND_CONNECTIONS.forEach(([start, end]) => {
      const point1 = hand[start];
      const point2 = hand[end];

      context.beginPath();

      context.moveTo(
        point1.x * width,
        point1.y * height
      );

      context.lineTo(
        point2.x * width,
        point2.y * height
      );

      context.stroke();
    });

    // Draw landmark points
    hand.forEach(point => {
      context.beginPath();

      context.arc(
        point.x * width,
        point.y * height,
        4,
        0,
        Math.PI * 2
      );

      context.fillStyle = '#FFEB3B';
      context.fill();

      context.strokeStyle = '#FFFFFF';
      context.lineWidth = 1;
      context.stroke();
    });
  });
}

function clearLandmarkCanvas() {
  const canvas = document.getElementById('practiceCanvasOverlay');

  if (!canvas) return;

  const context = canvas.getContext('2d');

  context.clearRect(0, 0, canvas.width, canvas.height);
}

// --------------------------------------------------
// DETECTION STATUS
// --------------------------------------------------

function updateDetectionFeedback(result) {
  if (result.landmarks_detected) {
    updateDetectionMessage(
      `${result.hand_count} hand(s) detected. Actual MediaPipe landmarks received.`
    );
  } else {
    updateDetectionMessage(
      'No hand detected. Position your hand inside the camera.'
    );
  }
}

function updateDetectionMessage(message) {
  const title = document.getElementById('practiceResultTitle');
  const text = document.getElementById('practiceResultText');
  const icon = document.getElementById('practiceResultIcon');
  const confidence = document.getElementById('practiceConfidenceText');
  const bar = document.getElementById('practiceConfidenceBar');

  if (title) {
    title.textContent = 'Live Hand Detection';
    title.className = 'fw-bold text-dark';
  }

  if (text) {
    text.textContent = message;
  }

  if (icon) {
    icon.className = 'bi bi-hand-index-thumb fs-1 text-primary';
  }

  // No sign classification is claimed yet.
  if (confidence) confidence.textContent = 'Not trained yet';

  if (bar) {
    bar.style.width = '0%';
  }
}

// --------------------------------------------------
// SIMULATION BUTTONS
// --------------------------------------------------

function initSimulationControls() {
  const correct = document.getElementById('btnSimulateCorrect');
  const incorrect = document.getElementById('btnSimulateIncorrect');

  if (correct) {
    correct.addEventListener('click', () => {
      displayFeedback(true, 'DEMO', 0.96);
    });
  }

  if (incorrect) {
    incorrect.addEventListener('click', () => {
      displayFeedback(false, 'DEMO', 0.42);
    });
  }
}

function displayFeedback(isCorrect, predictedSign, confidence) {
  const title = document.getElementById('practiceResultTitle');
  const text = document.getElementById('practiceResultText');
  const icon = document.getElementById('practiceResultIcon');

  if (isCorrect) {
    title.textContent = 'Simulation: Correct Feedback';
    text.textContent = 'This is a demonstration result, not an AI prediction.';
    icon.className = 'bi bi-check-circle-fill text-success fs-1';
  } else {
    title.textContent = 'Simulation: Try Again';
    text.textContent = 'This is a demonstration result, not an AI prediction.';
    icon.className = 'bi bi-arrow-repeat text-danger fs-1';
  }

  document.getElementById('practiceConfidenceText').textContent =
    `${Math.round(confidence * 100)}% (Simulation)`;

  document.getElementById('practiceConfidenceBar').style.width =
    `${Math.round(confidence * 100)}%`;
}

// --------------------------------------------------
// RESET FEEDBACK
// --------------------------------------------------

function resetFeedback() {
  const title = document.getElementById('practiceResultTitle');
  const text = document.getElementById('practiceResultText');
  const icon = document.getElementById('practiceResultIcon');

  if (title) {
    title.textContent = 'Waiting for Live AI Recognition';
    title.className = 'fw-bold text-dark';
  }

  if (text) {
    text.textContent =
      'Turn on camera to detect your hand landmarks.';
  }

  if (icon) {
    icon.className = 'bi bi-cpu fs-1 text-primary';
  }

  const confidence =
    document.getElementById('practiceConfidenceText');

  const bar =
    document.getElementById('practiceConfidenceBar');

  if (confidence) confidence.textContent = 'Not trained yet';

  if (bar) bar.style.width = '0%';
}
