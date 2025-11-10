/**
 * Simple Snake Game Implementation
 */

class SnakeGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.gridSize = 20;
    this.tileCount = this.canvas.width / this.gridSize;

    // Game state
    this.snake = [{ x: 10, y: 10 }];
    this.food = { x: 15, y: 15 };
    this.dx = 0;
    this.dy = 0;
    this.score = 0;
    this.level = 1;
    this.gameSpeed = 150;
    this.isRunning = false;
    this.isPaused = false;
    this.gameLoop = null;

    this.setupControls();
    this.setupKeyboard();
  }

  setupControls() {
    document.getElementById('start-btn').addEventListener('click', () => {
      this.start();
    });

    document.getElementById('pause-btn').addEventListener('click', () => {
      this.togglePause();
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
      this.restart();
    });

    document.getElementById('save-btn').addEventListener('click', () => {
      if (window.gserverIntegration) {
        window.gserverIntegration.requestSaveSlot();
      }
    });
  }

  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (!this.isRunning || this.isPaused) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (this.dy === 0) {
            this.dx = 0;
            this.dy = -1;
          }
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (this.dy === 0) {
            this.dx = 0;
            this.dy = 1;
          }
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (this.dx === 0) {
            this.dx = -1;
            this.dy = 0;
          }
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (this.dx === 0) {
            this.dx = 1;
            this.dy = 0;
          }
          e.preventDefault();
          break;
        case ' ':
          this.togglePause();
          e.preventDefault();
          break;
      }
    });
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.dx = 1;
    this.dy = 0;

    document.getElementById('start-btn').disabled = true;
    document.getElementById('pause-btn').disabled = false;
    document.getElementById('save-btn').disabled = false;
    document.getElementById('game-over').classList.remove('show');

    this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
  }

  togglePause() {
    if (!this.isRunning) return;

    this.isPaused = !this.isPaused;
    document.getElementById('pause-btn').textContent = this.isPaused ? 'Resume' : 'Pause';
  }

  restart() {
    this.stop();
    this.reset();
    this.start();
  }

  stop() {
    this.isRunning = false;
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
  }

  reset() {
    this.snake = [{ x: 10, y: 10 }];
    this.food = this.generateFood();
    this.dx = 0;
    this.dy = 0;
    this.score = 0;
    this.level = 1;
    this.gameSpeed = 150;
    this.updateUI();

    document.getElementById('start-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
    document.getElementById('save-btn').disabled = true;

    this.draw();
  }

  update() {
    if (!this.isRunning || this.isPaused) return;

    // Move snake
    const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

    // Check wall collision
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
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
      this.food = this.generateFood();

      // Level up every 50 points
      const newLevel = Math.floor(this.score / 50) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        this.gameSpeed = Math.max(50, this.gameSpeed - 10);
        this.stop();
        this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
      }

      this.updateUI();
    } else {
      this.snake.pop();
    }

    this.draw();
  }

  generateFood() {
    let food;
    do {
      food = {
        x: Math.floor(Math.random() * this.tileCount),
        y: Math.floor(Math.random() * this.tileCount)
      };
    } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
    return food;
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid (subtle)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < this.tileCount; i++) {
      for (let j = 0; j < this.tileCount; j++) {
        this.ctx.strokeRect(i * this.gridSize, j * this.gridSize, this.gridSize, this.gridSize);
      }
    }

    // Draw snake
    this.snake.forEach((segment, index) => {
      if (index === 0) {
        // Head
        this.ctx.fillStyle = '#4caf50';
      } else {
        // Body with gradient
        const alpha = 1 - (index / this.snake.length) * 0.5;
        this.ctx.fillStyle = `rgba(76, 175, 80, ${alpha})`;
      }

      this.ctx.fillRect(
        segment.x * this.gridSize + 1,
        segment.y * this.gridSize + 1,
        this.gridSize - 2,
        this.gridSize - 2
      );
    });

    // Draw food
    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.beginPath();
    this.ctx.arc(
      this.food.x * this.gridSize + this.gridSize / 2,
      this.food.y * this.gridSize + this.gridSize / 2,
      this.gridSize / 2 - 2,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // Draw pause overlay
    if (this.isPaused) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = 'white';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  updateUI() {
    document.getElementById('score').textContent = this.score;
    document.getElementById('level').textContent = this.level;
  }

  gameOver() {
    this.stop();
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('game-over').classList.add('show');

    // Update progress in GServer
    if (window.gserverIntegration) {
      window.gserverIntegration.updateProgress({
        highScore: this.score,
        playTime: 60 // Approximate play time
      });
    }
  }

  // State serialization for saves
  getGameState() {
    return {
      snake: this.snake,
      food: this.food,
      dx: this.dx,
      dy: this.dy,
      score: this.score,
      level: this.level,
      gameSpeed: this.gameSpeed,
      isRunning: this.isRunning,
      timestamp: Date.now()
    };
  }

  loadGameState(state) {
    this.stop();

    this.snake = state.snake || [{ x: 10, y: 10 }];
    this.food = state.food || { x: 15, y: 15 };
    this.dx = state.dx || 0;
    this.dy = state.dy || 0;
    this.score = state.score || 0;
    this.level = state.level || 1;
    this.gameSpeed = state.gameSpeed || 150;

    this.updateUI();
    this.draw();

    if (state.isRunning) {
      this.start();
    }

    console.log('Game state loaded successfully');
  }
}

// Initialize game
const game = new SnakeGame();
game.draw();
