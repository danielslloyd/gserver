/**
 * Snake Game
 * A classic snake game with cloud save support
 */

const GAME_ID = 'snake';
const GRID_SIZE = 20;
const CELL_SIZE = 20;

class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.highScore = 0;
        this.level = 1;
        this.snake = [];
        this.food = null;
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.gameLoop = null;
    }

    init() {
        // Set up auth handler
        sharedAuth.init();
        sharedAuth.onAuthStateChanged((user) => {
            this.handleAuthChange(user);
        });

        // Set up controls
        document.getElementById('start-btn').onclick = () => this.startGame();
        document.getElementById('pause-btn').onclick = () => this.togglePause();

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Load high score and progress
        this.loadProgress();
    }

    handleAuthChange(user) {
        const authBtn = document.getElementById('auth-btn');
        const saveSection = document.getElementById('save-section');

        if (user) {
            authBtn.textContent = 'Logout';
            authBtn.onclick = this.handleLogout.bind(this);
            updateUserDisplay(user);
            saveSection.style.display = 'block';
            this.loadSaveSlots();
            this.loadProgress();
        } else {
            authBtn.textContent = 'Login';
            authBtn.onclick = () => window.location.href = '/main';
            updateUserDisplay(null);
            saveSection.style.display = 'none';
        }
    }

    async handleLogout() {
        showLoading(true);
        const result = await sharedAuth.logout();
        showLoading(false);

        if (result.success) {
            showNotification('Logged out successfully', 'success');
            window.location.href = '/main';
        }
    }

    async loadProgress() {
        if (!sharedAuth.isAuthenticated()) return;

        const result = await sharedSaveSystem.getProgress(GAME_ID);
        if (result.success && result.progress) {
            this.highScore = result.progress.highScore || 0;
            document.getElementById('high-score').textContent = this.highScore;
        }
    }

    async updateProgress() {
        if (!sharedAuth.isAuthenticated()) return;

        const progressData = {
            highScore: this.highScore,
            totalPlayTime: Date.now(),
            lastPlayed: firebase.firestore.FieldValue.serverTimestamp()
        };

        await sharedSaveSystem.updateProgress(GAME_ID, progressData);
    }

    async loadSaveSlots() {
        const slotsContainer = document.getElementById('save-slots');
        slotsContainer.innerHTML = '';

        const result = await sharedSaveSystem.getGameSaves(GAME_ID);

        // Create 3 save slots
        for (let i = 0; i < 3; i++) {
            const saveData = result.success ? result.saves.find(s => s.slotId === i) : null;
            slotsContainer.appendChild(this.createSaveSlot(i, saveData));
        }
    }

    createSaveSlot(slotId, saveData) {
        const slot = document.createElement('div');
        slot.className = 'save-slot';

        const info = document.createElement('div');
        info.className = 'save-slot-info';

        if (saveData) {
            const name = document.createElement('div');
            name.textContent = saveData.name || `Slot ${slotId + 1}`;
            name.style.fontWeight = 'bold';
            info.appendChild(name);

            const details = document.createElement('div');
            details.style.fontSize = '0.875rem';
            details.style.color = 'var(--text-secondary)';
            details.textContent = `Score: ${saveData.data.score} | Level: ${saveData.data.level}`;
            info.appendChild(details);
        } else {
            info.className += ' save-slot-empty';
            info.textContent = `Empty Slot ${slotId + 1}`;
        }

        slot.appendChild(info);

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '0.5rem';

        if (saveData) {
            const loadBtn = document.createElement('button');
            loadBtn.className = 'btn-secondary';
            loadBtn.textContent = 'Load';
            loadBtn.style.padding = '0.5rem 1rem';
            loadBtn.style.fontSize = '0.875rem';
            loadBtn.onclick = () => this.loadGame(slotId);
            actions.appendChild(loadBtn);
        }

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-primary';
        saveBtn.textContent = 'Save';
        saveBtn.style.padding = '0.5rem 1rem';
        saveBtn.style.fontSize = '0.875rem';
        saveBtn.onclick = () => this.saveGame(slotId);
        actions.appendChild(saveBtn);

        slot.appendChild(actions);

        return slot;
    }

    async saveGame(slotId) {
        if (!this.isRunning && this.score === 0) {
            showNotification('Start a game first!', 'error');
            return;
        }

        const saveData = {
            score: this.score,
            level: this.level,
            snake: this.snake,
            direction: this.direction,
            food: this.food
        };

        showLoading(true);
        const result = await sharedSaveSystem.saveGame(
            GAME_ID,
            slotId,
            saveData,
            `Score: ${this.score}`
        );
        showLoading(false);

        if (result.success) {
            showNotification('Game saved!', 'success');
            this.loadSaveSlots();
        } else {
            showNotification(`Failed to save: ${result.error}`, 'error');
        }
    }

    async loadGame(slotId) {
        showLoading(true);
        const result = await sharedSaveSystem.loadGame(GAME_ID, slotId);
        showLoading(false);

        if (result.success) {
            const data = result.data.data;
            this.score = data.score;
            this.level = data.level;
            this.snake = data.snake;
            this.direction = data.direction;
            this.food = data.food;

            this.updateUI();
            this.draw();
            showNotification('Game loaded!', 'success');
        } else {
            showNotification(`Failed to load: ${result.error}`, 'error');
        }
    }

    startGame() {
        this.isRunning = true;
        this.isPaused = false;
        this.score = 0;
        this.level = 1;
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };

        // Initialize snake in the middle
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];

        this.spawnFood();
        this.updateUI();

        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = false;

        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }

        this.gameLoop = setInterval(() => this.update(), 150 - (this.level * 10));
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pause-btn').textContent = this.isPaused ? 'Resume' : 'Pause';
    }

    handleKeyPress(e) {
        if (!this.isRunning || this.isPaused) return;

        const key = e.key.toLowerCase();
        const dir = this.direction;

        switch (key) {
            case 'arrowup':
            case 'w':
                if (dir.y === 0) this.nextDirection = { x: 0, y: -1 };
                break;
            case 'arrowdown':
            case 's':
                if (dir.y === 0) this.nextDirection = { x: 0, y: 1 };
                break;
            case 'arrowleft':
            case 'a':
                if (dir.x === 0) this.nextDirection = { x: -1, y: 0 };
                break;
            case 'arrowright':
            case 'd':
                if (dir.x === 0) this.nextDirection = { x: 1, y: 0 };
                break;
        }

        e.preventDefault();
    }

    update() {
        if (this.isPaused) return;

        this.direction = this.nextDirection;

        // Move snake
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;

        // Check wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            this.gameOver();
            return;
        }

        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateUI();
            this.spawnFood();

            // Level up every 50 points
            if (this.score % 50 === 0 && this.score > 0) {
                this.level++;
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => this.update(), 150 - (this.level * 10));
            }
        } else {
            this.snake.pop();
        }

        this.draw();
    }

    spawnFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
        } while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y));
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#334155';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= GRID_SIZE; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * CELL_SIZE, 0);
            this.ctx.lineTo(i * CELL_SIZE, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * CELL_SIZE);
            this.ctx.lineTo(this.canvas.width, i * CELL_SIZE);
            this.ctx.stroke();
        }

        // Draw snake
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#10b981' : '#6366f1';
            this.ctx.fillRect(
                segment.x * CELL_SIZE + 1,
                segment.y * CELL_SIZE + 1,
                CELL_SIZE - 2,
                CELL_SIZE - 2
            );
        });

        // Draw food
        if (this.food) {
            this.ctx.fillStyle = '#ef4444';
            this.ctx.fillRect(
                this.food.x * CELL_SIZE + 1,
                this.food.y * CELL_SIZE + 1,
                CELL_SIZE - 2,
                CELL_SIZE - 2
            );
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            document.getElementById('high-score').textContent = this.highScore;
            this.updateProgress();
        }
    }

    gameOver() {
        this.isRunning = false;
        clearInterval(this.gameLoop);

        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;

        showNotification(`Game Over! Final Score: ${this.score}`, 'error');

        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.updateProgress();
        }
    }
}

// Initialize game
const game = new SnakeGame();
game.init();
