/**
 * SignConnect AI - Sign Language Practice Module
 * Features: Target Sign, Webcam Stream (getUserMedia), Landmark Overlay, AI Integration Placeholder & Feedback
 */

let currentPracticeSign = null;
let mediaStream = null;
let isPredicting = false;
let simulationInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  initTargetSign();
  initCameraControls();
  initSimulationControls();
});

// Load target sign from URL param or pick random sign
function initTargetSign() {
  const urlParams = new URLSearchParams(window.location.search);
  const signId = urlParams.get('sign');

  if (window.ISL_DATA) {
    if (signId) {
      currentPracticeSign = window.ISL_DATA.getSign(signId);
    }
    if (!currentPracticeSign) {
      // Pick random sign from curriculum
      const all = [...window.ISL_DATA.alphabets, ...window.ISL_DATA.words];
      currentPracticeSign = all[Math.floor(Math.random() * all.length)];
    }
  }

  updateTargetSignUI();

  // Next Random Sign Button
  const nextBtn = document.getElementById('btnNextRandomSign');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (window.ISL_DATA) {
        const all = [...window.ISL_DATA.alphabets, ...window.ISL_DATA.words];
        currentPracticeSign = all[Math.floor(Math.random() * all.length)];
        updateTargetSignUI();
        resetFeedback();
      }
    });
  }

  // Target sign selector dropdown
  const selector = document.getElementById('practiceSignSelector');
  if (selector && window.ISL_DATA) {
    const all = [...window.ISL_DATA.alphabets, ...window.ISL_DATA.numbers, ...window.ISL_DATA.words];
    selector.innerHTML = all.map(s => `
      <option value="${s.id}" ${currentPracticeSign && currentPracticeSign.id === s.id ? 'selected' : ''}>
        [${s.category}] ${s.title}
      </option>
    `).join('');

    selector.addEventListener('change', (e) => {
      currentPracticeSign = window.ISL_DATA.getSign(e.target.value);
      updateTargetSignUI();
      resetFeedback();
    });
  }
}

// Update Target Sign Card details
function updateTargetSignUI() {
  if (!currentPracticeSign) return;

  document.getElementById('targetSignLabel').textContent = currentPracticeSign.label;
  document.getElementById('targetSignTitle').textContent = `${currentPracticeSign.title} (ISL)`;
  document.getElementById('targetSignCategory').textContent = currentPracticeSign.category;
  document.getElementById('targetSignDescription').textContent = currentPracticeSign.desc;
  
  const imgEl = document.getElementById('targetSignImage');
  if (imgEl) {
    imgEl.src = `assets/images/isl_${currentPracticeSign.id}.svg`;
    imgEl.alt = currentPracticeSign.title;
  }

  const handBadge = document.getElementById('targetSignHandBadge');
  if (handBadge) {
    handBadge.textContent = currentPracticeSign.twoHanded ? '2 Hands Required' : '1 Hand Required';
  }
}

// Webcam Stream Management via getUserMedia
function initCameraControls() {
  const startBtn = document.getElementById('btnStartCamera');
  const stopBtn = document.getElementById('btnStopCamera');
  const videoEl = document.getElementById('practiceVideo');
  const placeholderEl = document.getElementById('cameraPlaceholder');
  const statusBadge = document.getElementById('cameraStatusBadge');

  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      try {
        startBtn.disabled = true;
        updateCameraStatus('requesting', 'Requesting camera access...');

        const constraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: false
        };

        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoEl) {
          videoEl.srcObject = mediaStream;
          videoEl.play();
        }

        if (placeholderEl) placeholderEl.style.display = 'none';
        if (videoEl) videoEl.style.display = 'block';

        updateCameraStatus('active', 'Camera Active (30 FPS)');
        startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;

        SignConnect.showToast('Camera started successfully. Position hands in frame.', 'success');

        // Draw simulated landmark grid on canvas overlay
        startLandmarkOverlay();

      } catch (err) {
        console.error('Camera access error:', err);
        updateCameraStatus('error', 'Camera Permission Denied');
        startBtn.disabled = false;
        SignConnect.showToast('Could not access camera: ' + err.message + '. Please allow camera permissions in your browser.', 'danger');
      }
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      stopCamera();
    });
  }
}

function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  const videoEl = document.getElementById('practiceVideo');
  const placeholderEl = document.getElementById('cameraPlaceholder');
  const startBtn = document.getElementById('btnStartCamera');
  const stopBtn = document.getElementById('btnStopCamera');

  if (videoEl) videoEl.style.display = 'none';
  if (placeholderEl) placeholderEl.style.display = 'flex';
  if (startBtn) startBtn.disabled = false;
  if (stopBtn) stopBtn.disabled = true;

  updateCameraStatus('off', 'Camera Disconnected');
  stopLandmarkOverlay();
  resetFeedback();
}

function updateCameraStatus(state, text) {
  const badge = document.getElementById('cameraStatusBadge');
  if (!badge) return;

  if (state === 'active') {
    badge.innerHTML = '<span class="camera-live-dot"></span> ' + text;
    badge.className = 'camera-hud-badge bg-success bg-opacity-75';
  } else if (state === 'requesting') {
    badge.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> ' + text;
    badge.className = 'camera-hud-badge bg-warning bg-opacity-75 text-dark';
  } else if (state === 'error') {
    badge.innerHTML = '<i class="bi bi-x-circle me-1"></i> ' + text;
    badge.className = 'camera-hud-badge bg-danger bg-opacity-75';
  } else {
    badge.innerHTML = '<i class="bi bi-camera-video-off me-1"></i> ' + text;
    badge.className = 'camera-hud-badge bg-dark bg-opacity-75';
  }
}

// Canvas Landmark Simulation Overlay
let animationFrameId = null;
function startLandmarkOverlay() {
  const canvas = document.getElementById('practiceCanvasOverlay');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function renderFrame() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw visual guide bounding box
    const boxW = Math.min(canvas.width * 0.55, 320);
    const boxH = Math.min(canvas.height * 0.7, 340);
    const startX = (canvas.width - boxW) / 2;
    const startY = (canvas.height - boxH) / 2;

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(startX, startY, boxW, boxH);
    ctx.setLineDash([]);

    // Corner guides
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(startX, startY, 15, 4);
    ctx.fillRect(startX, startY, 4, 15);
    ctx.fillRect(startX + boxW - 15, startY, 15, 4);
    ctx.fillRect(startX + boxW - 4, startY, 4, 15);
    ctx.fillRect(startX, startY + boxH - 4, 15, 4);
    ctx.fillRect(startX, startY + boxH - 15, 4, 15);
    ctx.fillRect(startX + boxW - 15, startY + boxH - 4, 15, 4);
    ctx.fillRect(startX + boxW - 4, startY + boxH - 15, 4, 15);

    animationFrameId = requestAnimationFrame(renderFrame);
  }

  renderFrame();
}

function stopLandmarkOverlay() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  const canvas = document.getElementById('practiceCanvasOverlay');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// AI Classification Integration Placeholder Function
// Ready to receive predictions from Flask Backend: POST /api/predict
async function classifyCurrentFrame(targetExpectedSign) {
  // Capture frame from video element
  const videoEl = document.getElementById('practiceVideo');
  let frameBase64 = null;

  if (videoEl && mediaStream) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 320;
    tempCanvas.height = 240;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(videoEl, 0, 0, 320, 240);
    frameBase64 = tempCanvas.toDataURL('image/jpeg', 0.7);
  }

  // Call Backend API
  const payload = {
    image: frameBase64,
    target: targetExpectedSign ? targetExpectedSign.label : null
  };

  return await SignConnect.apiCall('/predict', 'POST', payload);
}

// Simulation & Demo Controls (Allows instructors and testers to test Correct and Try Again feedback)
function initSimulationControls() {
  const btnCorrect = document.getElementById('btnSimulateCorrect');
  const btnIncorrect = document.getElementById('btnSimulateIncorrect');

  if (btnCorrect) {
    btnCorrect.addEventListener('click', () => {
      displayFeedback(true, currentPracticeSign ? currentPracticeSign.label : 'HELLO', 0.96);
    });
  }

  if (btnIncorrect) {
    btnIncorrect.addEventListener('click', () => {
      displayFeedback(false, 'TRY AGAIN', 0.42);
    });
  }
}

function displayFeedback(isCorrect, predictedSign, confidence) {
  const resultCard = document.getElementById('practiceResultCard');
  const resultIcon = document.getElementById('practiceResultIcon');
  const resultTitle = document.getElementById('practiceResultTitle');
  const resultText = document.getElementById('practiceResultText');
  const confText = document.getElementById('practiceConfidenceText');
  const confBar = document.getElementById('practiceConfidenceBar');

  if (!resultCard) return;

  const confPercent = Math.round(confidence * 100);
  if (confText) confText.textContent = `${confPercent}% Match`;
  if (confBar) {
    confBar.style.width = `${confPercent}%`;
    confBar.style.backgroundColor = isCorrect ? 'var(--success)' : 'var(--danger)';
  }

  if (isCorrect) {
    resultCard.className = 'dash-card border-success bg-soft-success p-3';
    resultIcon.className = 'bi bi-check-circle-fill text-success fs-1';
    resultTitle.textContent = 'Excellent! Match Confirmed!';
    resultTitle.className = 'fw-bold text-success';
    resultText.textContent = `Your gesture matches "${predictedSign}" accurately according to Indian Sign Language.`;
    SignConnect.showToast('Correct sign recognized! Great job!', 'success');
  } else {
    resultCard.className = 'dash-card border-danger bg-soft-danger p-3';
    resultIcon.className = 'bi bi-arrow-repeat text-danger fs-1';
    resultTitle.textContent = 'Keep Trying! Position Adjusted';
    resultTitle.className = 'fw-bold text-danger';
    resultText.textContent = `Sign did not match the target cleanly (Confidence: ${confPercent}%). Re-align fingers according to instructions and hold steady.`;
    SignConnect.showToast('Gesture not recognized cleanly. Try again.', 'warning');
  }
}

function resetFeedback() {
  const resultCard = document.getElementById('practiceResultCard');
  const resultIcon = document.getElementById('practiceResultIcon');
  const resultTitle = document.getElementById('practiceResultTitle');
  const resultText = document.getElementById('practiceResultText');
  const confText = document.getElementById('practiceConfidenceText');
  const confBar = document.getElementById('practiceConfidenceBar');

  if (resultCard) resultCard.className = 'dash-card p-3';
  if (resultIcon) resultIcon.className = 'bi bi-cpu fs-1 text-primary';
  if (resultTitle) {
    resultTitle.textContent = 'Waiting for Live AI Recognition';
    resultTitle.className = 'fw-bold text-dark';
  }
  if (resultText) resultText.textContent = 'Turn on camera and perform the sign shown in the target box above.';
  if (confText) confText.textContent = '0%';
  if (confBar) {
    confBar.style.width = '0%';
    confBar.style.backgroundColor = 'var(--primary)';
  }
}
