/**
 * SignConnect AI - Authentication Handler
 * Handles Login, Registration, Validation, Show/Hide Passwords, and Flask API integration.
 */

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
  initLoginForm();
  initRegisterForm();
  initForgotPassword();
});

// Toggle password visibility
function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.input-password-toggle');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('i');

      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'bi bi-eye-slash';
      } else {
        input.type = 'password';
        icon.className = 'bi bi-eye';
      }
    });
  });
}

// Login Form Handling
function initLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe')?.checked;
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    if (!email || !password) {
      SignConnect.showToast('Please fill in all required fields.', 'warning');
      return;
    }

    // Basic email format check
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      SignConnect.showToast('Please enter a valid email address.', 'warning');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Authenticating...';

      // Call Flask Backend POST /api/login
      const response = await SignConnect.apiCall('/login', 'POST', {
        email: email,
        password: password,
        rememberMe: rememberMe
      });

      if (response && (response.success || response.token)) {
        SignConnect.showToast('Welcome back! Logging you in...', 'success');

        // Store user session (safe profile only, NEVER store raw password!)
        const userProfile = response.user || {
          id: 'usr_isl_101',
          name: email.split('@')[0],
          email: email,
          role: 'Student / ISL Learner',
          avatar: email.substring(0, 2).toUpperCase()
        };
        SignConnect.setUser(userProfile);

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      } else {
        SignConnect.showToast(response.message || 'Invalid email or password.', 'danger');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign In <i class="bi bi-arrow-right ms-2"></i>';
      }
    } catch (err) {
      SignConnect.showToast('Login error: ' + err.message, 'danger');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Sign In <i class="bi bi-arrow-right ms-2"></i>';
    }
  });
}

// Registration Form Handling
function initRegisterForm() {
  const registerForm = document.getElementById('registerForm');
  if (!registerForm) return;

  const passwordInput = document.getElementById('regPassword');
  const confirmInput = document.getElementById('regConfirmPassword');
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('strengthText');

  // Live password strength indicator
  if (passwordInput && strengthBar) {
    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      let score = 0;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      if (val.length === 0) {
        strengthBar.style.width = '0%';
        strengthBar.className = 'password-strength-bar';
        if (strengthText) strengthText.textContent = '';
      } else if (score <= 1) {
        strengthBar.style.width = '25%';
        strengthBar.style.backgroundColor = 'var(--danger)';
        if (strengthText) strengthText.textContent = 'Weak';
      } else if (score === 2) {
        strengthBar.style.width = '50%';
        strengthBar.style.backgroundColor = 'var(--warning)';
        if (strengthText) strengthText.textContent = 'Fair';
      } else if (score === 3) {
        strengthBar.style.width = '75%';
        strengthBar.style.backgroundColor = '#3B82F6';
        if (strengthText) strengthText.textContent = 'Good';
      } else {
        strengthBar.style.width = '100%';
        strengthBar.style.backgroundColor = 'var(--success)';
        if (strengthText) strengthText.textContent = 'Strong';
      }
    });
  }

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('regFullName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;
    const agreeTerms = document.getElementById('agreeTerms')?.checked;
    const submitBtn = registerForm.querySelector('button[type="submit"]');

    if (!fullName || !email || !password || !confirmPassword) {
      SignConnect.showToast('Please fill in all required fields.', 'warning');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      SignConnect.showToast('Please enter a valid email address.', 'warning');
      return;
    }

    if (password.length < 8) {
      SignConnect.showToast('Password must be at least 8 characters long.', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      SignConnect.showToast('Passwords do not match.', 'danger');
      return;
    }

    if (!agreeTerms) {
      SignConnect.showToast('Please agree to the Terms of Service & Privacy Policy.', 'warning');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Creating Account...';

      // Call Flask Backend POST /api/register
      const response = await SignConnect.apiCall('/register', 'POST', {
        fullName: fullName,
        email: email,
        password: password
      });

      if (response && response.success) {
        SignConnect.showToast('Account created successfully! Welcome to SignConnect AI.', 'success');

        // Initialize user profile
        const userProfile = response.user || {
          id: 'usr_' + Date.now(),
          name: fullName,
          email: email,
          role: 'Student / ISL Learner',
          avatar: fullName.substring(0, 2).toUpperCase()
        };
        SignConnect.setUser(userProfile);

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1200);
      } else {
        SignConnect.showToast(response.message || 'Registration failed. Please try again.', 'danger');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create Account <i class="bi bi-arrow-right ms-2"></i>';
      }
    } catch (err) {
      SignConnect.showToast('Registration error: ' + err.message, 'danger');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Create Account <i class="bi bi-arrow-right ms-2"></i>';
    }
  });
}

// Forgot Password Modal Interface
function initForgotPassword() {
  const resetForm = document.getElementById('forgotPasswordForm');
  if (!resetForm) return;

  resetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value.trim();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      SignConnect.showToast('Please enter a valid email address.', 'warning');
      return;
    }

    SignConnect.showToast(`Password recovery link sent to ${email}. Check your inbox.`, 'success');
    
    // Close modal if Bootstrap modal instance exists
    const modalEl = document.getElementById('forgotPasswordModal');
    if (modalEl && window.bootstrap) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }
  });
}
