/**
 * SignConnect AI - Real-Time Communication Module
 * Webcam + Flask MediaPipe hand landmark detection.
 * Actual sign classification requires a trained model.
 */

let commStream = null;
let recognizedSentence = [];
let communicationHistory = [];
let isLiveStreaming = false;
let pollingInterval = null;

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

document.addEventListener('DOMContentLoaded', () => {
  initCommCamera();
  initCommunicationControls();
  renderHistory();
});

// --------------------------------------------------
// CAMERA INITIALIZATION
// --------------------------------------------------

function initCommCamera() {
  const startBtn = document.getElementById('btnStartCommCamera');
  const stopBtn = document.getElementById('btnStopCommCamera');

  const video = document.getElementById('commVideo');
  const placeholder = document.getElementById('commCameraPlaceholder');

  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      try {
        startBtn.disabled = true;

        updateCommCameraBadge('connecting', 'Starting stream...');

        commStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: false
        });

        video.srcObject = commStream;
        video.style.display = 'block';

        await video.play();

        if (placeholder) {
          placeholder.style.display = 'none';
        }

        isLiveStreaming = true;

        updateCommCameraBadge('active', 'Live Stream Active');

        if (stopBtn) {
          stopBtn.disabled = false;
        }

        SignConnect.showToast(
          'Webcam started. Connecting AI hand detection...',
          'success'
        );

        drawCommOverlay();
        startCommPredictionLoop();

      } catch (err) {
        console.error('Communication camera error:', err);

        updateCommCameraBadge('error', 'Camera Blocked');

        startBtn.disabled = false;

        SignConnect.showToast(
          'Camera error: ' + err.message,
          'danger'
        );
      }
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', stopCommCamera);
  }
}

// --------------------------------------------------
// STOP CAMERA
// --------------------------------------------------

function stopCommCamera() {
  if (commStream) {
    commStream.getTracks().forEach(track => track.stop());
    commStream = null;
  }

  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }

  const video = document.getElementById('commVideo');
  const placeholder = document.getElementById('commCameraPlaceholder');

  const startBtn = document.getElementById('btnStartCommCamera');
  const stopBtn = document.getElementById('btnStopCommCamera');

  if (video) {
    video.pause();
    video.srcObject = null;
    video.style.display = 'none';
  }

  if (placeholder) {
    placeholder.style.display = 'flex';
  }

  if (startBtn) startBtn.disabled = false;
  if (stopBtn) stopBtn.disabled = true;

  isLiveStreaming = false;

  updateCommCameraBadge('off', 'Camera Inactive');
  clearCommOverlay();
}

// --------------------------------------------------
// CAMERA STATUS
// --------------------------------------------------

function updateCommCameraBadge(state, text) {
  const badge = document.getElementById('commCameraBadge');

  if (!badge) return;

  if (state === 'active') {
    badge.innerHTML =
      '<span class="camera-live-dot"></span> ' + text;

    badge.className =
      'camera-hud-badge bg-success bg-opacity-75';

  } else if (state === 'connecting') {
    badge.textContent = text;
    badge.className =
      'camera-hud-badge bg-warning bg-opacity-75 text-dark';

  } else if (state === 'error') {
    badge.textContent = text;
    badge.className =
      'camera-hud-badge bg-danger bg-opacity-75';

  } else {
    badge.textContent = text;
    badge.className =
      'camera-hud-badge bg-dark bg-opacity-75';
  }
}

// --------------------------------------------------
// CANVAS SETUP
// --------------------------------------------------

function drawCommOverlay() {
  const canvas = document.getElementById('commCanvasOverlay');

  if (!canvas) return;

  resizeCommCanvas();
}

function resizeCommCanvas() {
  const canvas = document.getElementById('commCanvasOverlay');

  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width;
  canvas.height = rect.height;
}

function clearCommOverlay() {
  const canvas = document.getElementById('commCanvasOverlay');

  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// --------------------------------------------------
// DRAW ACTUAL MEDIAPIPE LANDMARKS
// --------------------------------------------------

function drawHandLandmarks(allHands) {
  const canvas = document.getElementById('commCanvasOverlay');

  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  resizeCommCanvas();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!allHands || allHands.length === 0) {
    return;
  }

  allHands.forEach(hand => {
    if (!Array.isArray(hand) || hand.length !== 21) return;

    // Draw connecting lines
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 3;

    HAND_CONNECTIONS.forEach(([start, end]) => {
      const point1 = hand[start];
      const point2 = hand[end];

      ctx.beginPath();

      ctx.moveTo(
        point1.x * canvas.width,
        point1.y * canvas.height
      );

      ctx.lineTo(
        point2.x * canvas.width,
        point2.y * canvas.height
      );

      ctx.stroke();
    });

    // Draw landmark points
    hand.forEach(point => {
      ctx.beginPath();

      ctx.arc(
        point.x * canvas.width,
        point.y * canvas.height,
        5,
        0,
        Math.PI * 2
      );

      ctx.fillStyle = '#FF4081';
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  });
}

// --------------------------------------------------
// SEND WEBCAM FRAMES TO FLASK
// --------------------------------------------------

function startCommPredictionLoop() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  pollingInterval = setInterval(async () => {
    if (!isLiveStreaming) return;

    const video = document.getElementById('commVideo');

    if (!video || !video.videoWidth || !video.videoHeight) {
      return;
    }

    try {
      const captureCanvas = document.createElement('canvas');

      captureCanvas.width = video.videoWidth;
      captureCanvas.height = video.videoHeight;

      const captureContext = captureCanvas.getContext('2d');

      captureContext.drawImage(
        video,
        0,
        0,
        captureCanvas.width,
        captureCanvas.height
      );

      const imageData = captureCanvas.toDataURL('image/jpeg', 0.7);

      const response = await SignConnect.apiCall(
        '/predict',
        'POST',
        {
          image: imageData,
          target: null
        }
      );

      if (!isLiveStreaming) return;

      const result = response.data || response;

      if (result.landmarks_detected && result.landmarks) {
        drawHandLandmarks(result.landmarks);
      } else {
        clearCommOverlay();
      }

    } catch (error) {
      console.error('Hand detection API error:', error);
    }

  }, 350);
}

// --------------------------------------------------
// COMMUNICATION CONTROLS
// --------------------------------------------------

function initCommunicationControls() {
  const btnSpeak = document.getElementById('btnSpeakSentence');
  const btnClear = document.getElementById('btnClearSentence');
  const btnCopy = document.getElementById('btnCopySentence');
  const btnTestSign = document.getElementById('btnTestSamplePrediction');

  if (btnSpeak) {
    btnSpeak.addEventListener('click', () => {
      const text = getFullSentenceText();

      if (!text) {
        SignConnect.showToast(
          'No recognized text to speak yet.',
          'warning'
        );
        return;
      }

      btnSpeak.disabled = true;

      SignConnect.speakText(text, () => {
        btnSpeak.disabled = false;
      });
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      recognizedSentence = [];
      updateSentenceUI();

      SignConnect.showToast(
        'Recognized text cleared.',
        'info'
      );
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const text = getFullSentenceText();

      if (!text) return;

      navigator.clipboard.writeText(text).then(() => {
        SignConnect.showToast(
          'Sentence copied!',
          'success'
        );
      });
    });
  }

  // Demonstration button only - not actual AI recognition
  if (btnTestSign) {
    const sampleSigns = [
      'HELLO',
      'THANK YOU',
      'HOW ARE YOU',
      'PLEASE',
      'HELP',
      'YES',
      'WATER'
    ];

    let index = 0;

    btnTestSign.addEventListener('click', () => {
      const chosen = sampleSigns[index % sampleSigns.length];

      index++;

      handleIncomingPrediction({
        prediction: chosen,
        confidence: 0.95
      });
    });
  }
}

// --------------------------------------------------
// SENTENCE DISPLAY
// --------------------------------------------------

function getFullSentenceText() {
  return recognizedSentence.join(' ').trim();
}

function updateSentenceUI() {
  const outputEl = document.getElementById('commSentenceOutput');
  const wordCountBadge = document.getElementById('commWordCountBadge');

  if (outputEl) {
    outputEl.textContent = recognizedSentence.length
      ? recognizedSentence.join(' ')
      : 'Recognized words will accumulate here into a complete sentence...';
  }

  if (wordCountBadge) {
    wordCountBadge.textContent =
      `${recognizedSentence.length} Words`;
  }
}

// --------------------------------------------------
// DISPLAY PREDICTIONS
// --------------------------------------------------

window.handleIncomingPrediction = function (predictionData) {
  if (!predictionData || !predictionData.prediction) return;

  const sign = predictionData.prediction.toUpperCase();
  const confidence = predictionData.confidence || 0.95;

  const signEl = document.getElementById('commRecognizedSign');
  const confBar = document.getElementById('commConfidenceBar');
  const confText = document.getElementById('commConfidenceText');

  if (signEl) signEl.textContent = sign;

  if (confBar) {
    confBar.style.width =
      `${Math.round(confidence * 100)}%`;
  }

  if (confText) {
    confText.textContent =
      `${Math.round(confidence * 100)}%`;
  }

  const lastWord = recognizedSentence[recognizedSentence.length - 1];

  if (lastWord !== sign) {
    recognizedSentence.push(sign);
    updateSentenceUI();
    addToHistory(sign, confidence);
  }
};

// --------------------------------------------------
// COMMUNICATION HISTORY
// --------------------------------------------------

function addToHistory(sign, confidence) {
  const time = new Date().toLocaleTimeString();

  communicationHistory.unshift({
    sign,
    confidence: Math.round(confidence * 100),
    time
  });

  if (communicationHistory.length > 20) {
    communicationHistory.pop();
  }

  renderHistory();
}

function renderHistory() {
  const container =
    document.getElementById('commHistoryContainer');

  if (!container) return;

  if (communicationHistory.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-muted small">
        No communication logs yet.
      </div>
    `;

    return;
  }

  container.innerHTML = communicationHistory.map(item => `
    <div class="comm-history-item">
      <div>
        <span class="badge bg-primary me-2">${item.sign}</span>
        <span class="text-secondary small">
          ${item.confidence}% Match
        </span>
      </div>

      <div class="text-muted small">
        ${item.time}
      </div>
    </div>
  `).join('');
}