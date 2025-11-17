/**
 * Shared Save System Utilities
 * Provides centralized save game functionality across all games and tools
 */

class SharedSaveSystem {
  constructor() {
    this.db = firebase.firestore();
  }

  /**
   * Save game data
   * @param {string} gameId - Unique identifier for the game/tool
   * @param {number} slotId - Save slot number (0-based)
   * @param {object} saveData - Data to save
   * @param {string} saveName - Optional name for the save
   */
  async saveGame(gameId, slotId, saveData, saveName = null) {
    const user = window.sharedAuth.getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const saveDoc = {
        gameId,
        slotId,
        data: saveData,
        name: saveName || `Save ${slotId + 1}`,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userId: user.uid
      };

      const saveRef = this.db.collection('users')
        .doc(user.uid)
        .collection('saves')
        .doc(`${gameId}_slot_${slotId}`);

      await saveRef.set(saveDoc);

      return { success: true, saveId: saveRef.id };
    } catch (error) {
      console.error('Error saving game:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load game data from a slot
   */
  async loadGame(gameId, slotId) {
    const user = window.sharedAuth.getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const saveRef = this.db.collection('users')
        .doc(user.uid)
        .collection('saves')
        .doc(`${gameId}_slot_${slotId}`);

      const doc = await saveRef.get();

      if (!doc.exists) {
        return { success: false, error: 'Save not found' };
      }

      return { success: true, data: doc.data() };
    } catch (error) {
      console.error('Error loading game:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all saves for a specific game
   */
  async getGameSaves(gameId) {
    const user = window.sharedAuth.getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const savesSnapshot = await this.db.collection('users')
        .doc(user.uid)
        .collection('saves')
        .where('gameId', '==', gameId)
        .orderBy('timestamp', 'desc')
        .get();

      const saves = savesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, saves };
    } catch (error) {
      console.error('Error getting saves:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all saves across all games
   */
  async getAllSaves() {
    const user = window.sharedAuth.getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const savesSnapshot = await this.db.collection('users')
        .doc(user.uid)
        .collection('saves')
        .orderBy('timestamp', 'desc')
        .get();

      const saves = savesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, saves };
    } catch (error) {
      console.error('Error getting all saves:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a save
   */
  async deleteSave(gameId, slotId) {
    const user = window.sharedAuth.getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      await this.db.collection('users')
        .doc(user.uid)
        .collection('saves')
        .doc(`${gameId}_slot_${slotId}`)
        .delete();

      return { success: true };
    } catch (error) {
      console.error('Error deleting save:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update game progress/stats
   */
  async updateProgress(gameId, progressData) {
    const user = window.sharedAuth.getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const progressRef = this.db.collection('users')
        .doc(user.uid)
        .collection('progress')
        .doc(gameId);

      await progressRef.set(progressData, { merge: true });

      return { success: true };
    } catch (error) {
      console.error('Error updating progress:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get progress for a game
   */
  async getProgress(gameId) {
    const user = window.sharedAuth.getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const progressDoc = await this.db.collection('users')
        .doc(user.uid)
        .collection('progress')
        .doc(gameId)
        .get();

      if (!progressDoc.exists) {
        return { success: true, progress: null };
      }

      return { success: true, progress: progressDoc.data() };
    } catch (error) {
      console.error('Error getting progress:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create global instance
window.sharedSaveSystem = new SharedSaveSystem();
