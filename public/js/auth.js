/**
 * Authentication Module - Handles user login, registration, and auth state
 */
class AuthManager {
  constructor() {
    this.auth = firebase.auth();
    this.db = firebase.firestore();
    this.currentUser = null;
  }

  init() {
    // Set up auth state observer
    this.auth.onAuthStateChanged((user) => {
      this.currentUser = user;
      this.handleAuthStateChange(user);
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Tab switching
    document.getElementById('tab-login')?.addEventListener('click', () => {
      this.showTab('login');
    });

    document.getElementById('tab-register')?.addEventListener('click', () => {
      this.showTab('register');
    });

    // Login form
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });

    // Register form
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleRegister();
    });

    // Logout button
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await this.handleLogout();
    });
  }

  showTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginTab = document.getElementById('tab-login');
    const registerTab = document.getElementById('tab-register');

    if (tab === 'login') {
      loginForm?.classList.remove('hidden');
      registerForm?.classList.add('hidden');
      loginTab?.classList.add('active');
      registerTab?.classList.remove('active');
    } else {
      loginForm?.classList.add('hidden');
      registerForm?.classList.remove('hidden');
      loginTab?.classList.remove('active');
      registerTab?.classList.add('active');
    }
  }

  async handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    try {
      showLoading(true);
      errorEl.textContent = '';

      await this.auth.signInWithEmailAndPassword(email, password);

      // Update last login
      const user = this.auth.currentUser;
      if (user) {
        await this.db.collection('users').doc(user.uid).update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      console.log('Login successful');
    } catch (error) {
      console.error('Login error:', error);
      errorEl.textContent = this.getErrorMessage(error);
    } finally {
      showLoading(false);
    }
  }

  async handleRegister() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const errorEl = document.getElementById('register-error');

    try {
      errorEl.textContent = '';

      // Validate
      if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters';
        return;
      }

      if (password !== confirm) {
        errorEl.textContent = 'Passwords do not match';
        return;
      }

      showLoading(true);

      // Create user
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Update profile
      await user.updateProfile({
        displayName: name
      });

      // Create user document in Firestore
      await this.db.collection('users').doc(user.uid).set({
        email: user.email,
        displayName: name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log('Registration successful');
      showNotification('Account created successfully!', 'success');

      // Switch to login tab
      this.showTab('login');
    } catch (error) {
      console.error('Registration error:', error);
      errorEl.textContent = this.getErrorMessage(error);
    } finally {
      showLoading(false);
    }
  }

  async handleLogout() {
    try {
      showLoading(true);
      await this.auth.signOut();
      console.log('Logout successful');
      showNotification('Logged out successfully', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Error logging out', 'error');
    } finally {
      showLoading(false);
    }
  }

  handleAuthStateChange(user) {
    const authScreen = document.getElementById('auth-screen');
    const gamesScreen = document.getElementById('games-screen');
    const mainHeader = document.getElementById('main-header');
    const userInfo = document.getElementById('user-info');
    const userDisplayName = document.getElementById('user-display-name');

    if (user) {
      // User is signed in
      console.log('User authenticated:', user.email);

      authScreen?.classList.add('hidden');
      mainHeader?.classList.remove('hidden');
      gamesScreen?.classList.remove('hidden');
      userInfo?.classList.remove('hidden');

      if (userDisplayName) {
        userDisplayName.textContent = user.displayName || user.email;
      }

      // Initialize app after authentication
      if (window.app) {
        window.app.loadGames();
      }
    } else {
      // User is signed out
      console.log('User not authenticated');

      authScreen?.classList.remove('hidden');
      mainHeader?.classList.add('hidden');
      gamesScreen?.classList.add('hidden');
      userInfo?.classList.add('hidden');

      // Clear forms
      document.getElementById('login-form')?.reset();
      document.getElementById('register-form')?.reset();
      document.getElementById('login-error').textContent = '';
      document.getElementById('register-error').textContent = '';
    }
  }

  getErrorMessage(error) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/operation-not-allowed': 'Operation not allowed',
      'auth/weak-password': 'Password is too weak',
      'auth/user-disabled': 'This account has been disabled',
      'auth/user-not-found': 'Invalid email or password',
      'auth/wrong-password': 'Invalid email or password',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection'
    };

    return errorMessages[error.code] || error.message || 'An error occurred';
  }

  getCurrentUser() {
    return this.currentUser;
  }
}
