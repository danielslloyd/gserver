/**
 * Shared Authentication Utilities
 * Provides common auth functions that work across all pages
 */

class SharedAuth {
  constructor() {
    this.auth = firebase.auth();
    this.db = firebase.firestore();
    this.currentUser = null;
    this.authStateCallbacks = [];
  }

  /**
   * Initialize auth state listener
   */
  init() {
    this.auth.onAuthStateChanged((user) => {
      this.currentUser = user;
      this.authStateCallbacks.forEach(callback => callback(user));
    });
  }

  /**
   * Register a callback for auth state changes
   */
  onAuthStateChanged(callback) {
    this.authStateCallbacks.push(callback);
    // If user is already loaded, call immediately
    if (this.currentUser !== null) {
      callback(this.currentUser);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Login with email and password
   */
  async login(email, password) {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);

      // Update last login
      if (userCredential.user) {
        await this.db.collection('users').doc(userCredential.user.uid).update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  /**
   * Register new user
   */
  async register(email, password, displayName) {
    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Update profile
      await user.updateProfile({ displayName });

      // Create user document
      await this.db.collection('users').doc(user.uid).set({
        email: user.email,
        displayName: displayName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, user };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  /**
   * Logout current user
   */
  async logout() {
    try {
      await this.auth.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.currentUser !== null;
  }

  /**
   * Redirect to login if not authenticated
   */
  requireAuth(redirectUrl = '/main') {
    if (!this.isAuthenticated() && this.currentUser !== undefined) {
      window.location.href = redirectUrl;
    }
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/operation-not-allowed': 'Operation not allowed',
      'auth/weak-password': 'Password is too weak (minimum 6 characters)',
      'auth/user-disabled': 'This account has been disabled',
      'auth/user-not-found': 'Invalid email or password',
      'auth/wrong-password': 'Invalid email or password',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection'
    };

    return errorMessages[error.code] || error.message || 'An error occurred';
  }
}

// Create global instance
window.sharedAuth = new SharedAuth();
