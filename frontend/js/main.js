/**
 * SignConnect AI - Main Core Utilities & API Client
 * College Mini-Project: AI-Powered Sign Language Learning and Real-Time Communication Assistant
 */

// Global Configuration
window.SignConnectConfig = {
  // Configurable Flask Backend Base URL
  API_BASE_URL: localStorage.getItem('signconnect_api_url') || 'http://127.0.0.1:5000/api',
  USE_MOCK_FALLBACK: true, // Automatically fall back to mock service if Flask is offline
  APP_NAME: 'SignConnect AI',
  TAGLINE: 'Breaking Communication Barriers, One Sign at a Time.',
  IS_BACKEND_CONNECTED: false
};

// Global App State & Utilities Namespace
window.SignConnect = {
  // Notification Toast System
  showToast: function (message, type = 'info', title = '') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;

    const iconMap = {
      success: 'bi-check-circle-fill text-success',
      danger: 'bi-x-circle-fill text-danger',
      warning: 'bi-exclamation-triangle-fill text-warning',
      info: 'bi-info-circle-fill text-primary'
    };

    const icon = iconMap[type] || iconMap.info;
    const toastTitle = title || (type.charAt(0).toUpperCase() + type.slice(1));

    toast.innerHTML = `
      <i class="bi ${icon} fs-4"></i>
      <div class="flex-grow-1">
        <h6 class="mb-1 fw-bold fs-6">${toastTitle}</h6>
        <p class="mb-0 text-secondary small">${message}</p>
      </div>
      <button type="button" class="btn-close ms-2" onclick="this.parentElement.remove()"></button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // User Session Management (No raw passwords stored!)
  getUser: function () {
    const raw = localStorage.getItem('signconnect_user');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    }
    // Default dynamic user profile placeholder if none is active
    return {
      id: 'usr_guest',
      name: 'SignConnect Learner',
      email: 'learner@signconnect.ai',
      role: 'Student / ISL Learner',
      avatar: 'SL',
      stats: {
        totalLessons: 48,
        completedLessons: 18,
        quizzesAttempted: 12,
        averageScore: 88,
        hoursPracticed: 6.5,
        currentStreak: 5
      }
    };
  },

  setUser: function (userData) {
    localStorage.setItem('signconnect_user', JSON.stringify(userData));
  },

  logout: function () {
    localStorage.removeItem('signconnect_user');
    this.showToast('You have been logged out successfully.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 800);
  },

  // Unified API Client with Automatic Flask Backend Detection & Mock Fallback
  apiCall: async function (endpoint, method = 'GET', data = null) {
    const url = `${SignConnectConfig.API_BASE_URL}${endpoint}`;

    try {
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      // 3.5s timeout to quickly fallback if Flask is not running
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      options.signal = controller.signal;

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      if (response.ok) {
        SignConnectConfig.IS_BACKEND_CONNECTED = true;
        SignConnect.updateBackendIndicator(true);
        return await response.json();
      } else {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
    } catch (err) {
      console.warn(`[SignConnect AI] Live Flask API at ${url} unavailable (${err.message}). Using client-side mock handler.`);
      SignConnectConfig.IS_BACKEND_CONNECTED = false;
      SignConnect.updateBackendIndicator(false);

      if (SignConnectConfig.USE_MOCK_FALLBACK) {
        return SignConnect.mockApiHandler(endpoint, method, data);
      }
      throw err;
    }
  },

  // Mock API Handlers mirroring Flask endpoints
  mockApiHandler: function (endpoint, method, data) {
    if (endpoint === '/register' && method === 'POST') {
      return {
        success: true,
        message: 'Account registered successfully (Mock API mode)',
        user: {
          id: 'usr_' + Date.now(),
          name: data.fullName || 'Student',
          email: data.email,
          role: 'Student / ISL Learner',
          avatar: (data.fullName || 'U').substring(0, 2).toUpperCase()
        }
      };
    }

    if (endpoint === '/login' && method === 'POST') {
      const email = data ? data.email : '';
      const derivedName = email ? email.split('@')[0].replace(/[._-]/g, ' ') : 'SignConnect Learner';
      const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
      return {
        success: true,
        message: 'Logged in successfully (Mock API mode)',
        token: 'mock_jwt_token_' + Date.now(),
        user: {
          id: 'usr_guest',
          name: formattedName,
          email: email || 'learner@signconnect.ai',
          role: 'Student / ISL Learner',
          avatar: (formattedName.substring(0, 2)).toUpperCase()
        }
      };
    }

    if (endpoint === '/profile') {
      return {
        success: true,
        user: SignConnect.getUser()
      };
    }

    if (endpoint === '/progress') {
      return {
        success: true,
        progress: {
          totalLessons: 48,
          completedLessons: 18,
          quizzesAttempted: 12,
          overallPercentage: 42,
          streakDays: 5,
          weeklyActivity: [4, 6, 8, 3, 7, 10, 5],
          categoryBreakdown: {
            alphabets: 75,
            numbers: 90,
            greetings: 60,
            commonWords: 40
          }
        }
      };
    }

    if (endpoint === '/quiz/submit' && method === 'POST') {
      return {
        success: true,
        message: 'Quiz result recorded in database (Mock API mode)',
        submissionId: 'sub_' + Date.now(),
        score: data ? data.score : 0,
        total: data ? data.total : 0
      };
    }

    if (endpoint === '/predict' && method === 'POST') {
      // Placeholder response matching expected Flask AI model output format:
      // { "prediction": "HELLO", "confidence": 0.95 }
      return {
        success: true,
        prediction: data && data.target ? data.target : "HELLO",
        confidence: 0.96,
        is_mock: true,
        note: "AI Prediction Model placeholder. Ready to integrate with Flask + OpenCV + MediaPipe."
      };
    }

    return { success: true, message: 'Mock response for ' + endpoint };
  },

  // Update backend status pill in topbar
  updateBackendIndicator: function (isConnected) {
    const pill = document.getElementById('backendStatusPill');
    if (!pill) return;

    if (isConnected) {
      pill.className = 'backend-status-pill';
      pill.innerHTML = '<span class="status-dot"></span> Flask API: Connected';
      pill.title = 'Connected to Python Flask Backend at ' + SignConnectConfig.API_BASE_URL;
    } else {
      pill.className = 'backend-status-pill offline';
      pill.innerHTML = '<span class="status-dot"></span> Flask API: Mock Mode';
      pill.title = 'Flask server not detected at ' + SignConnectConfig.API_BASE_URL + '. Running in verified Mock API mode.';
    }
  },

  // Web Speech API Voice Synthesizer
  speakText: function (text, onEndCallback) {
    if (!('speechSynthesis' in window)) {
      this.showToast('Web Speech API is not supported in this browser.', 'warning');
      return;
    }

    window.speechSynthesis.cancel(); // Cancel any existing speech

    if (!text || text.trim() === '') return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-IN'; // Indian English voice preferred for ISL assistant

    // Try finding an English (India) or clear English voice
    const voices = window.speechSynthesis.getVoices();

    const preferredVoice =
      voices.find(v => v.name.includes('Microsoft Neerja Online')) ||
      voices.find(v => v.name.includes('Microsoft Prabhat Online')) ||
      voices.find(v => v.lang.includes('en-IN')) ||
      voices.find(v => v.lang.includes('en-GB')) ||
      voices.find(v => v.lang.includes('en'));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    if (onEndCallback) {
      utterance.onend = onEndCallback;
    }

    window.speechSynthesis.speak(utterance);
  },

  // Initialize Common UI components
  initCommon: function () {
    // Mobile sidebar toggle
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebar = document.getElementById('appSidebar');
    let backdrop = document.querySelector('.sidebar-backdrop');

    if (!backdrop && sidebar) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
    }

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-open');
        backdrop.classList.toggle('active');
      });

      if (backdrop) {
        backdrop.addEventListener('click', () => {
          sidebar.classList.remove('sidebar-open');
          backdrop.classList.remove('active');
        });
      }
    }

    // Populate user pill if elements exist
    const user = this.getUser();
    const userNameEls = document.querySelectorAll('.sidebar-user-name, .topbar-user-name');
    const userRoleEls = document.querySelectorAll('.sidebar-user-role');
    const userAvatarEls = document.querySelectorAll('.sidebar-user-avatar, .topbar-user-avatar');

    if (user) {
      userNameEls.forEach(el => el.textContent = user.name);
      userRoleEls.forEach(el => el.textContent = user.role || 'Student');
      userAvatarEls.forEach(el => el.textContent = user.avatar || user.name.substring(0, 2).toUpperCase());
    }

    // Check backend connection once on load
    this.apiCall('/profile').catch(() => { });
  }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  SignConnect.initCommon();
});
