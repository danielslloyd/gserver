/**
 * GameMessageHandler - Manages postMessage communication between shell and game iframes
 */
class GameMessageHandler {
  constructor(firebaseApp) {
    this.auth = firebase.auth();
    this.db = firebase.firestore();
    this.storage = firebase.storage();
    this.activeGameFrame = null;
    this.currentGameId = null;
    this.allowedOrigins = [
      // Add game URLs here when deploying
      'http://localhost:8080',
      'http://localhost:3000',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:3000',
    ];
  }

  init() {
    window.addEventListener('message', (event) => {
      // For development, allow all origins
      // In production, uncomment the security check below:
      /*
      if (!this.allowedOrigins.includes(event.origin)) {
        console.warn('Message from unauthorized origin:', event.origin);
        return;
      }
      */

      this.handleMessage(event.data, event.source);
    });

    console.log('GameMessageHandler initialized');
  }

  async handleMessage(message, source) {
    if (!message || !message.type) return;

    const { type, payload } = message;
    console.log('Received message:', type, payload);

    try {
      switch (type) {
        case 'GAME_READY':
          this.activeGameFrame = source;
          this.currentGameId = payload.gameId;
          await this.sendUserInfo(source);
          console.log(`Game ready: ${payload.gameId} v${payload.version}`);
          break;

        case 'SAVE_GAME':
          await this.saveGame(payload);
          break;

        case 'REQUEST_SAVES':
          await this.sendSaves(source, payload.gameId || this.currentGameId);
          break;

        case 'UPDATE_PROGRESS':
          await this.updateProgress(payload);
          break;

        case 'ERROR':
          console.error('Game error:', payload);
          this.showNotification(payload.message, 'error');
          break;

        default:
          console.warn('Unknown message type:', type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.showNotification('An error occurred: ' + error.message, 'error');
    }
  }

  async sendUserInfo(target) {
    const user = this.auth.currentUser;
    if (!user) {
      console.warn('No user authenticated');
      return;
    }

    const message = {
      type: 'USER_INFO',
      payload: {
        userId: user.uid,
        displayName: user.displayName || 'Player',
        email: user.email
      }
    };

    this.sendToGame(message, target);
  }

  async saveGame({ slotNumber, saveData, metadata, thumbnail }) {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!this.currentGameId) {
      throw new Error('No game currently loaded');
    }

    const gameId = this.currentGameId;
    const timestamp = Date.now();
    const fileName = `slot${slotNumber}_${timestamp}.json`;
    const storagePath = `saves/${user.uid}/${gameId}/${fileName}`;

    console.log('Saving game:', { gameId, slotNumber, storagePath });

    // Upload save file to Storage
    const storageRef = this.storage.ref(storagePath);
    await storageRef.putString(JSON.stringify(saveData));

    // Check if a save already exists for this slot
    const existingSaves = await this.db.collection('users').doc(user.uid)
      .collection('saves')
      .where('gameId', '==', gameId)
      .where('slotNumber', '==', slotNumber)
      .get();

    let saveRef;
    if (!existingSaves.empty) {
      // Update existing save
      saveRef = existingSaves.docs[0].ref;
      await saveRef.update({
        fileName,
        storagePath,
        lastModified: firebase.firestore.FieldValue.serverTimestamp(),
        metadata: metadata || {},
        thumbnail: thumbnail || null
      });
    } else {
      // Create new save
      saveRef = this.db.collection('users').doc(user.uid)
        .collection('saves').doc();

      await saveRef.set({
        gameId,
        slotNumber,
        fileName,
        storagePath,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastModified: firebase.firestore.FieldValue.serverTimestamp(),
        metadata: metadata || {},
        thumbnail: thumbnail || null
      });
    }

    console.log('Game saved successfully');
    this.showNotification('Game saved successfully!', 'success');

    // Trigger save slots refresh if modal is open
    if (window.saveManager) {
      window.saveManager.refreshSaveSlots();
    }
  }

  async loadSave(saveId) {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Loading save:', saveId);

    // Get metadata
    const saveDoc = await this.db.collection('users').doc(user.uid)
      .collection('saves').doc(saveId).get();

    if (!saveDoc.exists) {
      throw new Error('Save not found');
    }

    const saveData = saveDoc.data();

    // Download save file
    const storageRef = this.storage.ref(saveData.storagePath);
    const downloadUrl = await storageRef.getDownloadURL();
    const response = await fetch(downloadUrl);
    const saveFileContent = await response.json();

    // Send to game
    this.sendToGame({
      type: 'LOAD_GAME',
      payload: {
        saveData: saveFileContent,
        slotNumber: saveData.slotNumber,
        metadata: saveData.metadata
      }
    });

    console.log('Save loaded successfully');
    this.showNotification('Game loaded!', 'success');
  }

  async deleteSave(saveId) {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Deleting save:', saveId);

    // Get save data
    const saveDoc = await this.db.collection('users').doc(user.uid)
      .collection('saves').doc(saveId).get();

    if (!saveDoc.exists) {
      throw new Error('Save not found');
    }

    const saveData = saveDoc.data();

    // Delete from Storage
    try {
      const storageRef = this.storage.ref(saveData.storagePath);
      await storageRef.delete();
    } catch (error) {
      console.warn('Error deleting storage file:', error);
    }

    // Delete from Firestore
    await saveDoc.ref.delete();

    console.log('Save deleted successfully');
    this.showNotification('Save deleted', 'success');
  }

  async sendSaves(target, gameId) {
    const user = this.auth.currentUser;
    if (!user) return;

    const savesQuery = await this.db.collection('users').doc(user.uid)
      .collection('saves')
      .where('gameId', '==', gameId)
      .orderBy('slotNumber')
      .get();

    const saves = savesQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    this.sendToGame({
      type: 'SAVES_LIST',
      payload: { saves }
    }, target);
  }

  async updateProgress(progressData) {
    const user = this.auth.currentUser;
    if (!user || !this.currentGameId) return;

    const progressRef = this.db.collection('users').doc(user.uid)
      .collection('progress').doc(this.currentGameId);

    const existingProgress = await progressRef.get();

    if (existingProgress.exists) {
      // Update existing progress
      const current = existingProgress.data();
      await progressRef.update({
        totalPlayTime: (current.totalPlayTime || 0) + (progressData.playTime || 0),
        highScore: Math.max(current.highScore || 0, progressData.highScore || 0),
        achievements: firebase.firestore.FieldValue.arrayUnion(...(progressData.achievements || [])),
        lastPlayed: firebase.firestore.FieldValue.serverTimestamp(),
        customStats: { ...current.customStats, ...progressData.customStats }
      });
    } else {
      // Create new progress
      await progressRef.set({
        totalPlayTime: progressData.playTime || 0,
        highScore: progressData.highScore || 0,
        achievements: progressData.achievements || [],
        lastPlayed: firebase.firestore.FieldValue.serverTimestamp(),
        gamesCompleted: progressData.gamesCompleted || 0,
        customStats: progressData.customStats || {}
      });
    }

    console.log('Progress updated');
  }

  sendToGame(message, target = null) {
    const frame = target || this.activeGameFrame;
    if (frame) {
      frame.postMessage(message, '*');
    } else {
      console.warn('No active game frame to send message to');
    }
  }

  showNotification(message, type = 'success') {
    if (window.showNotification) {
      window.showNotification(message, type);
    } else {
      console.log(`[${type}] ${message}`);
    }
  }

  setCurrentGame(gameId) {
    this.currentGameId = gameId;
  }

  getCurrentGameId() {
    return this.currentGameId;
  }
}
