/**
 * SaveManager - Manages save slots UI and operations
 */
class SaveManager {
  constructor(messageHandler) {
    this.messageHandler = messageHandler;
    this.auth = firebase.auth();
    this.db = firebase.firestore();
    this.maxSlots = 3; // Default max save slots per game
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Show saves button
    document.getElementById('show-saves-btn')?.addEventListener('click', () => {
      this.showSavesModal();
    });

    // Close modal
    document.getElementById('close-saves-modal')?.addEventListener('click', () => {
      this.hideSavesModal();
    });

    // Close modal on outside click
    document.getElementById('save-slots-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'save-slots-modal') {
        this.hideSavesModal();
      }
    });
  }

  async showSavesModal() {
    const modal = document.getElementById('save-slots-modal');
    modal?.classList.remove('hidden');

    await this.loadSaveSlots();
  }

  hideSavesModal() {
    const modal = document.getElementById('save-slots-modal');
    modal?.classList.add('hidden');
  }

  async loadSaveSlots() {
    const container = document.getElementById('save-slots-container');
    if (!container) return;

    const user = this.auth.currentUser;
    const gameId = this.messageHandler.getCurrentGameId();

    if (!user || !gameId) {
      container.innerHTML = '<p>No game loaded</p>';
      return;
    }

    try {
      // Get all saves for current game
      const savesQuery = await this.db.collection('users').doc(user.uid)
        .collection('saves')
        .where('gameId', '==', gameId)
        .orderBy('slotNumber')
        .get();

      const saves = {};
      savesQuery.docs.forEach(doc => {
        const data = doc.data();
        saves[data.slotNumber] = {
          id: doc.id,
          ...data
        };
      });

      // Render all slots
      container.innerHTML = '';
      for (let i = 1; i <= this.maxSlots; i++) {
        const save = saves[i];
        container.appendChild(this.createSaveSlotElement(i, save));
      }
    } catch (error) {
      console.error('Error loading save slots:', error);
      container.innerHTML = '<p class="error-message">Error loading saves</p>';
    }
  }

  createSaveSlotElement(slotNumber, saveData) {
    const slot = document.createElement('div');
    slot.className = saveData ? 'save-slot' : 'save-slot empty';

    const info = document.createElement('div');
    info.className = 'save-info';

    if (saveData) {
      const title = document.createElement('h4');
      title.textContent = `Slot ${slotNumber}`;
      info.appendChild(title);

      // Format metadata
      const metaLines = [];
      if (saveData.metadata?.level) {
        metaLines.push(`Level: ${saveData.metadata.level}`);
      }
      if (saveData.metadata?.score) {
        metaLines.push(`Score: ${saveData.metadata.score}`);
      }
      if (saveData.lastModified) {
        const date = saveData.lastModified.toDate?.() || new Date(saveData.lastModified);
        metaLines.push(`Saved: ${this.formatDate(date)}`);
      }

      const meta = document.createElement('p');
      meta.textContent = metaLines.join(' • ') || 'No metadata';
      info.appendChild(meta);
    } else {
      const title = document.createElement('h4');
      title.textContent = `Slot ${slotNumber}`;
      info.appendChild(title);

      const meta = document.createElement('p');
      meta.textContent = 'Empty slot';
      info.appendChild(meta);
    }

    slot.appendChild(info);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'save-actions';

    if (saveData) {
      // Load button
      const loadBtn = document.createElement('button');
      loadBtn.textContent = 'Load';
      loadBtn.className = 'btn-primary';
      loadBtn.onclick = () => this.handleLoad(saveData.id);
      actions.appendChild(loadBtn);

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'btn-secondary';
      deleteBtn.onclick = () => this.handleDelete(saveData.id, slotNumber);
      actions.appendChild(deleteBtn);
    } else {
      // Save to slot button
      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save Here';
      saveBtn.className = 'btn-primary';
      saveBtn.onclick = () => this.handleRequestSave(slotNumber);
      actions.appendChild(saveBtn);
    }

    slot.appendChild(actions);

    return slot;
  }

  async handleLoad(saveId) {
    try {
      showLoading(true);
      await this.messageHandler.loadSave(saveId);
      this.hideSavesModal();
    } catch (error) {
      console.error('Error loading save:', error);
      showNotification('Error loading save: ' + error.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  async handleDelete(saveId, slotNumber) {
    if (!confirm(`Delete save from Slot ${slotNumber}?`)) {
      return;
    }

    try {
      showLoading(true);
      await this.messageHandler.deleteSave(saveId);
      await this.loadSaveSlots(); // Refresh the list
    } catch (error) {
      console.error('Error deleting save:', error);
      showNotification('Error deleting save: ' + error.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  handleRequestSave(slotNumber) {
    // Send message to game to save to this slot
    this.messageHandler.sendToGame({
      type: 'REQUEST_SAVE',
      payload: { slotNumber }
    });

    showNotification(`Requesting save to Slot ${slotNumber}...`, 'success');
    this.hideSavesModal();
  }

  async refreshSaveSlots() {
    // Refresh the save slots if modal is open
    const modal = document.getElementById('save-slots-modal');
    if (modal && !modal.classList.contains('hidden')) {
      await this.loadSaveSlots();
    }
  }

  formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString();
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }
}
