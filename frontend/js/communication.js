/**
 * SignConnect AI - Real-Time Communication Module
 * Connects webcam via getUserMedia, accumulates sentences, provides Web Speech API voice output,
 * maintains communication logs, and exposes backend integration points for POST /api/predict.
 */

let commStream = null;
let recognizedSentence = [];
let communicationHistory = [];
let isLiveStreaming = false;
let pollingInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  initCommCamera();
  initCommunicationControls();
  renderHistory();
});

// Webcam initialization
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

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false
        });

        commStream = stream;
        if (video) {
          video.srcObject = stream;
          video.play();
          video.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';

        updateCommCameraBadge('active', 'Live Stream Active (30 FPS)');
        if (stopBtn) stopBtn.disabled = false;
        isLiveStreaming = true;

        SignConnect.showToast('Webcam active. AI recognition stream ready.', 'success');

        // Draw HUD overlay grid on canvas
        drawCommOverlay();

      } catch (err) {
        console.error('Camera error in communication module:', err);
        updateCommCameraBadge('error', 'Camera Blocked');
        startBtn.disabled = false;
        SignConnect.showToast('Camera error: ' + err.message, 'danger');
      }
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      stopCommCamera();
    });
  }
}

function stopCommCamera() {
  if (commStream) {
    commStream.getTracks().forEach(track => track.stop());
    commStream = null;
  }

  const video = document.getElementById('commVideo');
  const placeholder = document.getElementById('commCameraPlaceholder');
  const startBtn = document.getElementById('btnStartCommCamera');
  const stopBtn = document.getElementById('btnStopCommCamera');

  if (video) video.style.display = 'none';
  if (placeholder) placeholder.style.display = 'flex';
  if (startBtn) startBtn.disabled = false;
  if (stopBtn) stopBtn.disabled = true;

  isLiveStreaming = false;
  updateCommCameraBadge('off', 'Camera Inactive');
  clearCommOverlay();
}

function updateCommCameraBadge(state, text) {
  const badge = document.getElementById('commCameraBadge');
  if (!badge) return;

  if (state === 'active') {
    badge.innerHTML = '<span class="camera-live-dot"></span> ' + text;
    badge.className = 'camera-hud-badge bg-success bg-opacity-75';
  } else if (state === 'connecting') {
    badge.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> ' + text;
    badge.className = 'camera-hud-badge bg-warning bg-opacity-75 text-dark';
  } else if (state === 'error') {
    badge.innerHTML = '<i class="bi bi-exclamation-circle me-1"></i> ' + text;
    badge.className = 'camera-hud-badge bg-danger bg-opacity-75';
  } else {
    badge.innerHTML = '<i class="bi bi-camera-video-off me-1"></i> ' + text;
    badge.className = 'camera-hud-badge bg-dark bg-opacity-75';
  }
}

// Canvas HUD overlay
function drawCommOverlay() {
  const canvas = document.getElementById('commCanvasOverlay');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  ctx.strokeStyle = 'rgba(79, 70, 229, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  // Center alignment crosshair
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.beginPath();
  ctx.moveTo(cx - 30, cy);
  ctx.lineTo(cx + 30, cy);
  ctx.moveTo(cx, cy - 30);
  ctx.lineTo(cx, cy + 30);
  ctx.stroke();
}

function clearCommOverlay() {
  const canvas = document.getElementById('commCanvasOverlay');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// Controls: Speak Text, Clear Text, Copy Text, and Demonstration Testing
function initCommunicationControls() {
  const btnSpeak = document.getElementById('btnSpeakSentence');
  const btnClear = document.getElementById('btnClearSentence');
  const btnCopy = document.getElementById('btnCopySentence');
  const btnTestSign = document.getElementById('btnTestSamplePrediction');

  // Text-to-Speech via Web Speech API
  if (btnSpeak) {
    btnSpeak.addEventListener('click', () => {
      const text = getFullSentenceText();
      if (!text) {
        SignConnect.showToast('No recognized text to speak yet.', 'warning');
        return;
      }
      btnSpeak.disabled = true;
      btnSpeak.innerHTML = '<span class="spinner-grow spinner-grow-sm me-2"></span> Speaking...';

      SignConnect.speakText(text, () => {
        btnSpeak.disabled = false;
        btnSpeak.innerHTML = '<i class="bi bi-volume-up-fill me-2"></i> Speak Sentence';
      });
    });
  }

  // Clear Sentence
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      recognizedSentence = [];
      updateSentenceUI();
      SignConnect.showToast('Recognized text cleared.', 'info');
    });
  }

  // Copy Sentence
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const text = getFullSentenceText();
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        SignConnect.showToast('Sentence copied to clipboard!', 'success');
      });
    });
  }

  // Sample Prediction Trigger for presentation and evaluation
  if (btnTestSign) {
    const sampleSigns = ['HELLO', 'THANK YOU', 'HOW ARE YOU', 'PLEASE', 'HELP', 'YES', 'WATER'];
    let idx = 0;
    btnTestSign.addEventListener('click', () => {
      const chosen = sampleSigns[idx % sampleSigns.length];
      idx++;
      const confidence = (0.92 + Math.random() * 0.07).toFixed(2);
      
      // Receive prediction into UI
      handleIncomingPrediction({
        prediction: chosen,
        confidence: parseFloat(confidence)
      });
    });
  }
}

// Get compiled sentence string
function getFullSentenceText() {
  return recognizedSentence.join(' ').trim();
}

// Update Sentence display area
function updateSentenceUI() {
  const outputEl = document.getElementById('commSentenceOutput');
  const wordCountBadge = document.getElementById('commWordCountBadge');
  
  if (outputEl) {
    if (recognizedSentence.length === 0) {
      outputEl.innerHTML = '<span class="text-muted fst-italic">Recognized words will accumulate here into a complete sentence...</span>';
    } else {
      outputEl.textContent = recognizedSentence.join(' ');
    }
  }

  if (wordCountBadge) {
    wordCountBadge.textContent = `${recognizedSentence.length} Words`;
  }
}

/**
 * CORE BACKEND INTEGRATION POINT
 * This function processes prediction payloads received from Flask POST /api/predict
 * Format: { "prediction": "HELLO", "confidence": 0.95 }
 */
window.handleIncomingPrediction = function(predictionData) {
  if (!predictionData || !predictionData.prediction) return;

  const sign = predictionData.prediction.toUpperCase();
  const conf = predictionData.confidence || 0.95;

  // Update Billboard Card
  const signEl = document.getElementById('commRecognizedSign');
  const confBar = document.getElementById('commConfidenceBar');
  const confText = document.getElementById('commConfidenceText');

  if (signEl) signEl.textContent = sign;
  if (confBar) confBar.style.width = `${Math.round(conf * 100)}%`;
  if (confText) confText.textContent = `${Math.round(conf * 100)}%`;

  // Avoid repetitive spam: only append if distinct from last word or after a short pause
  const lastWord = recognizedSentence[recognizedSentence.length - 1];
  if (lastWord !== sign) {
    recognizedSentence.push(sign);
    updateSentenceUI();

    // Log to communication history
    addToHistory(sign, conf);
  }
};

// Add entry to communication history log
function addToHistory(sign, confidence) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  communicationHistory.unshift({
    sign: sign,
    confidence: Math.round(confidence * 100),
    time: timeStr
  });

  if (communicationHistory.length > 20) {
    communicationHistory.pop();
  }

  renderHistory();
}

function renderHistory() {
  const container = document.getElementById('commHistoryContainer');
  if (!container) return;

  if (communicationHistory.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-muted small">
        <i class="bi bi-clock-history fs-3 d-block mb-1 text-secondary"></i>
        No communication logs yet. Gestures detected will be recorded here.
      </div>
    `;
    return;
  }

  container.innerHTML = communicationHistory.map(item => `
    <div class="comm-history-item">
      <div>
        <span class="badge bg-primary me-2">${item.sign}</span>
        <span class="text-secondary small">${item.confidence}% Match</span>
      </div>
      <div class="text-muted small">${item.time}</div>
    </div>
  `).join('');
}
