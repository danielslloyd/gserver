/**
 * Main Application - Initializes and coordinates all modules
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAA1iQOUrnJz1Mz88g0KswDraouMfi5Ej4",
  authDomain: "gserver-f273c.firebaseapp.com",
  projectId: "gserver-f273c",
  storageBucket: "gserver-f273c.firebasestorage.app",
  messagingSenderId: "1028255302937",
  appId: "1:1028255302937:web:2ffe4977c527251e157188",
  measurementId: "G-P3L7W7VGD4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Global utility functions
function showLoading(show) {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.toggle('hidden', !show);
  }
}

function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  if (!notification) return;

  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.classList.remove('hidden');

  setTimeout(() => {
    notification.classList.add('hidden');
  }, 3000);
}

// Make utility functions global
window.showLoading = showLoading;
window.showNotification = showNotification;

/**
 * Main App Class
 */
class App {
  constructor() {
    this.messageHandler = new GameMessageHandler();
    this.authManager = new AuthManager();
    this.saveManager = new SaveManager(this.messageHandler);

    this.db = firebase.firestore();
    this.currentScreen = 'games';
    this.games = [];
  }

  async init() {
    console.log('Initializing GServer...');

    // Initialize modules
    this.messageHandler.init();
    this.authManager.init();
    this.saveManager.init();

    // Set up navigation
    this.setupNavigation();

    // Set up game screen
    this.setupGameScreen();

    // Load games registry
    await this.initializeGamesRegistry();

    console.log('GServer initialized');
  }

  setupNavigation() {
    document.getElementById('nav-games')?.addEventListener('click', () => {
      this.showScreen('games');
    });

    document.getElementById('nav-profile')?.addEventListener('click', () => {
      this.showScreen('profile');
    });
  }

  setupGameScreen() {
    document.getElementById('back-to-games')?.addEventListener('click', () => {
      this.closeGame();
    });
  }

  showScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.add('hidden');
    });

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // Show selected screen
    const screen = document.getElementById(`${screenName}-screen`);
    if (screen) {
      screen.classList.remove('hidden');
      this.currentScreen = screenName;
    }

    // Update active nav button
    const navBtn = document.getElementById(`nav-${screenName}`);
    if (navBtn) {
      navBtn.classList.add('active');
    }

    // Load screen-specific data
    if (screenName === 'profile') {
      this.loadProfile();
    } else if (screenName === 'games') {
      this.loadGames();
    }
  }

  async initializeGamesRegistry() {
    // Check if games collection exists and has games
    const gamesSnapshot = await this.db.collection('games').limit(1).get();

    if (gamesSnapshot.empty) {
      // Create sample games for testing
      console.log('No games found, creating sample games...');
      await this.createSampleGames();
    }
  }

  async createSampleGames() {
    const sampleGames = [
      {
        gameId: 'snake',
        name: 'Snake',
        description: 'Classic snake game. Eat food and grow!',
        category: 'Arcade',
        thumbnailUrl: '',
        iframeUrl: 'https://example.com/snake', // Replace with actual game URL
        version: '1.0.0',
        maxSaveSlots: 3,
        isActive: true
      },
      {
        gameId: 'tetris',
        name: 'Tetris',
        description: 'Stack blocks and clear lines!',
        category: 'Puzzle',
        thumbnailUrl: '',
        iframeUrl: 'https://example.com/tetris', // Replace with actual game URL
        version: '1.0.0',
        maxSaveSlots: 3,
        isActive: true
      },
      {
        gameId: 'pong',
        name: 'Pong',
        description: 'Classic arcade pong game',
        category: 'Arcade',
        thumbnailUrl: '',
        iframeUrl: 'https://example.com/pong', // Replace with actual game URL
        version: '1.0.0',
        maxSaveSlots: 3,
        isActive: true
      }
    ];

    for (const game of sampleGames) {
      await this.db.collection('games').doc(game.gameId).set(game);
    }

    console.log('Sample games created');
  }

  async loadGames() {
    const container = document.getElementById('games-grid');
    if (!container) return;

    try {
      showLoading(true);

      const gamesSnapshot = await this.db.collection('games')
        .where('isActive', '==', true)
        .get();

      this.games = gamesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      container.innerHTML = '';

      if (this.games.length === 0) {
        container.innerHTML = '<p>No games available</p>';
        return;
      }

      this.games.forEach(game => {
        container.appendChild(this.createGameCard(game));
      });
    } catch (error) {
      console.error('Error loading games:', error);
      container.innerHTML = '<p class="error-message">Error loading games</p>';
    } finally {
      showLoading(false);
    }
  }

  createGameCard(game) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.onclick = () => this.launchGame(game);

    const thumbnail = document.createElement('div');
    thumbnail.className = 'game-thumbnail';

    if (game.thumbnailUrl) {
      thumbnail.style.backgroundImage = `url(${game.thumbnailUrl})`;
      thumbnail.style.backgroundSize = 'cover';
    } else {
      // Default emoji based on game type
      const emojis = {
        'snake': '🐍',
        'tetris': '🎮',
        'pong': '🏓',
      };
      thumbnail.textContent = emojis[game.gameId] || '🎯';
    }

    card.appendChild(thumbnail);

    const info = document.createElement('div');
    info.className = 'game-info';

    const title = document.createElement('h3');
    title.textContent = game.name;
    info.appendChild(title);

    const description = document.createElement('p');
    description.textContent = game.description;
    info.appendChild(description);

    const meta = document.createElement('div');
    meta.className = 'game-meta';

    const categoryTag = document.createElement('span');
    categoryTag.className = 'game-tag';
    categoryTag.textContent = game.category;
    meta.appendChild(categoryTag);

    const versionTag = document.createElement('span');
    versionTag.className = 'game-tag';
    versionTag.textContent = `v${game.version}`;
    meta.appendChild(versionTag);

    info.appendChild(meta);
    card.appendChild(info);

    return card;
  }

  launchGame(game) {
    console.log('Launching game:', game.name);

    const iframe = document.getElementById('game-iframe');
    const title = document.getElementById('current-game-title');

    if (!iframe || !title) return;

    // Set current game in message handler
    this.messageHandler.setCurrentGame(game.gameId);

    // Update UI
    title.textContent = game.name;
    iframe.src = game.iframeUrl;

    // Show game screen
    this.showScreen('game');

    showNotification(`Loading ${game.name}...`, 'success');
  }

  closeGame() {
    const iframe = document.getElementById('game-iframe');
    if (iframe) {
      iframe.src = 'about:blank';
    }

    this.messageHandler.setCurrentGame(null);
    this.showScreen('games');
  }

  async loadProfile() {
    const user = this.authManager.getCurrentUser();
    if (!user) return;

    try {
      showLoading(true);

      // Load user document
      const userDoc = await this.db.collection('users').doc(user.uid).get();
      const userData = userDoc.data();

      // Update profile info
      document.getElementById('profile-name').textContent = user.displayName || 'N/A';
      document.getElementById('profile-email').textContent = user.email || 'N/A';

      if (userData?.createdAt) {
        const date = userData.createdAt.toDate?.() || new Date(userData.createdAt);
        document.getElementById('profile-created').textContent = date.toLocaleDateString();
      } else {
        document.getElementById('profile-created').textContent = 'Unknown';
      }

      // Load gaming stats
      await this.loadGamingStats(user.uid);
    } catch (error) {
      console.error('Error loading profile:', error);
      showNotification('Error loading profile', 'error');
    } finally {
      showLoading(false);
    }
  }

  async loadGamingStats(userId) {
    const statsContainer = document.getElementById('stats-grid');
    if (!statsContainer) return;

    try {
      // Get all progress documents
      const progressSnapshot = await this.db.collection('users').doc(userId)
        .collection('progress')
        .get();

      let totalPlayTime = 0;
      let totalHighScore = 0;
      let gamesPlayed = progressSnapshot.size;
      let totalAchievements = 0;

      progressSnapshot.docs.forEach(doc => {
        const data = doc.data();
        totalPlayTime += data.totalPlayTime || 0;
        totalHighScore += data.highScore || 0;
        totalAchievements += (data.achievements || []).length;
      });

      // Get total saves
      const savesSnapshot = await this.db.collection('users').doc(userId)
        .collection('saves')
        .get();
      const totalSaves = savesSnapshot.size;

      // Create stat cards
      statsContainer.innerHTML = '';

      const stats = [
        { label: 'Games Played', value: gamesPlayed },
        { label: 'Total Saves', value: totalSaves },
        { label: 'Total Score', value: totalHighScore.toLocaleString() },
        { label: 'Play Time (min)', value: Math.floor(totalPlayTime / 60) },
        { label: 'Achievements', value: totalAchievements },
      ];

      stats.forEach(stat => {
        statsContainer.appendChild(this.createStatCard(stat));
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      statsContainer.innerHTML = '<p class="error-message">Error loading stats</p>';
    }
  }

  createStatCard(stat) {
    const card = document.createElement('div');
    card.className = 'stat-card';

    const value = document.createElement('div');
    value.className = 'stat-value';
    value.textContent = stat.value;
    card.appendChild(value);

    const label = document.createElement('div');
    label.className = 'stat-label';
    label.textContent = stat.label;
    card.appendChild(label);

    return card;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.init();

  // Make saveManager globally accessible
  window.saveManager = window.app.saveManager;
});
