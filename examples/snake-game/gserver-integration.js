/**
 * GServer Integration Module
 * This file demonstrates how to integrate a game with the GServer platform
 */

class GServerIntegration {
  constructor(gameId, game) {
    this.gameId = gameId;
    this.game = game;
    this.isConnected = false;
    this.userInfo = null;

    this.init();
  }

  init() {
    // Set up message listener
    this.setupMessageListener();

    // Notify shell that game is ready
    this.notifyReady();

    console.log('GServer integration initialized for:', this.gameId);
  }

  setupMessageListener() {
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data;

      console.log('Received message from GServer:', type, payload);

      switch (type) {
        case 'USER_INFO':
          this.handleUserInfo(payload);
          break;

        case 'LOAD_GAME':
          this.handleLoadGame(payload);
          break;

        case 'REQUEST_SAVE':
          this.handleRequestSave(payload);
          break;

        case 'SAVES_LIST':
          this.handleSavesList(payload);
          break;

        default:
          console.log('Unknown message type:', type);
      }
    });
  }

  notifyReady() {
    this.sendToShell({
      type: 'GAME_READY',
      payload: {
        gameId: this.gameId,
        version: '1.0.0'
      }
    });

    console.log('Sent GAME_READY message');
  }

  handleUserInfo(userInfo) {
    this.userInfo = userInfo;
    this.isConnected = true;

    console.log('User info received:', userInfo);

    // Update UI
    this.updateConnectionStatus(true);

    // Show welcome message
    console.log(`Welcome, ${userInfo.displayName}!`);
  }

  handleLoadGame(payload) {
    const { saveData, slotNumber } = payload;

    console.log(`Loading save from slot ${slotNumber}`);

    // Load the game state
    if (this.game && this.game.loadGameState) {
      this.game.loadGameState(saveData);
      console.log('Game state loaded successfully');
    }
  }

  handleRequestSave(payload) {
    const slotNumber = payload.slotNumber || 1;
    this.saveGame(slotNumber);
  }

  handleSavesList(payload) {
    console.log('Available saves:', payload.saves);
    // You could implement a custom load UI here
  }

  saveGame(slotNumber = 1) {
    if (!this.game || !this.game.getGameState) {
      console.error('Game does not support saving');
      return;
    }

    const gameState = this.game.getGameState();

    const metadata = {
      level: this.game.level,
      score: this.game.score,
      playTime: 0 // You could track this
    };

    console.log(`Saving game to slot ${slotNumber}`);

    this.sendToShell({
      type: 'SAVE_GAME',
      payload: {
        slotNumber,
        saveData: gameState,
        metadata,
        thumbnail: this.captureScreenshot()
      }
    });
  }

  updateProgress(progressData) {
    console.log('Updating progress:', progressData);

    this.sendToShell({
      type: 'UPDATE_PROGRESS',
      payload: {
        highScore: progressData.highScore || 0,
        achievements: progressData.achievements || [],
        playTime: progressData.playTime || 0,
        customStats: progressData.customStats || {}
      }
    });
  }

  requestSaves() {
    this.sendToShell({
      type: 'REQUEST_SAVES',
      payload: {
        gameId: this.gameId
      }
    });
  }

  requestSaveSlot() {
    // This will trigger the shell's save slot UI
    // The shell will then send a REQUEST_SAVE message with the selected slot
    this.saveGame(1); // Default to slot 1 for quick save
  }

  sendToShell(message) {
    // Send to parent window (the shell)
    window.parent.postMessage(message, '*');

    console.log('Sent to shell:', message.type);
  }

  sendError(errorMessage) {
    this.sendToShell({
      type: 'ERROR',
      payload: {
        message: errorMessage,
        code: 'GAME_ERROR'
      }
    });
  }

  captureScreenshot() {
    // Optional: Capture canvas as base64 image
    try {
      const canvas = document.getElementById('gameCanvas');
      if (canvas) {
        return canvas.toDataURL('image/png');
      }
    } catch (error) {
      console.warn('Could not capture screenshot:', error);
    }
    return null;
  }

  updateConnectionStatus(connected) {
    const indicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');

    if (indicator && statusText) {
      if (connected) {
        indicator.classList.remove('disconnected');
        indicator.classList.add('connected');
        statusText.textContent = 'Connected to GServer';
      } else {
        indicator.classList.remove('connected');
        indicator.classList.add('disconnected');
        statusText.textContent = 'Not connected to GServer';
      }
    }
  }

  // Auto-save functionality
  enableAutoSave(intervalMinutes = 5) {
    setInterval(() => {
      if (this.game && this.game.isRunning && !this.game.isPaused) {
        console.log('Auto-saving game...');
        this.saveGame(1); // Auto-save to slot 1
      }
    }, intervalMinutes * 60 * 1000);
  }
}

// Initialize GServer integration when the page loads
window.addEventListener('load', () => {
  // Create integration instance
  window.gserverIntegration = new GServerIntegration('snake', window.game || game);

  // Optional: Enable auto-save every 5 minutes
  // window.gserverIntegration.enableAutoSave(5);

  console.log('Game loaded and integrated with GServer');
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GServerIntegration;
}
