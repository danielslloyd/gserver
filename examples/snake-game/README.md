# Snake Game - GServer Integration Example

This is a complete example of a game integrated with the GServer platform, demonstrating how to use the postMessage API for cloud saves and progress tracking.

## Features

- Classic Snake gameplay
- Full GServer integration
- Save/load support
- Progress tracking
- Connection status indicator
- Responsive controls (Arrow keys or WASD)

## Files

- `index.html` - Game HTML structure
- `snake-game.js` - Core game logic
- `gserver-integration.js` - GServer postMessage integration

## Integration Points

### 1. Game Ready Notification

```javascript
this.sendToShell({
  type: 'GAME_READY',
  payload: {
    gameId: this.gameId,
    version: '1.0.0'
  }
});
```

### 2. Saving Game State

```javascript
this.sendToShell({
  type: 'SAVE_GAME',
  payload: {
    slotNumber,
    saveData: gameState,
    metadata: {
      level: this.game.level,
      score: this.game.score
    },
    thumbnail: this.captureScreenshot()
  }
});
```

### 3. Loading Game State

```javascript
handleLoadGame(payload) {
  const { saveData, slotNumber } = payload;
  this.game.loadGameState(saveData);
}
```

### 4. Updating Progress

```javascript
this.sendToShell({
  type: 'UPDATE_PROGRESS',
  payload: {
    highScore: this.score,
    playTime: 60
  }
});
```

## Testing Locally

You can test this game standalone without GServer:

```bash
# Serve with any static server
python3 -m http.server 8000
# or
npx serve
```

Then open http://localhost:8000

## Deploying to GServer

### 1. Deploy the Game

Deploy to any static hosting:

**Option A: Firebase Hosting**
```bash
firebase init hosting
firebase deploy
```

**Option B: Netlify**
```bash
# Drag and drop the folder to netlify.com
```

**Option C: Vercel**
```bash
vercel
```

### 2. Register in GServer

Go to Firestore in your Firebase console and add to `games` collection:

```javascript
{
  gameId: "snake",
  name: "Snake Game",
  description: "Classic snake game. Eat food and grow!",
  category: "Arcade",
  iframeUrl: "https://your-deployed-url.com",
  thumbnailUrl: "",
  version: "1.0.0",
  maxSaveSlots: 3,
  isActive: true
}
```

### 3. Add to Allowed Origins

Edit `public/js/message-handler.js` in GServer and add your URL:

```javascript
this.allowedOrigins = [
  'https://your-deployed-url.com',
  // ... other URLs
];
```

### 4. Redeploy GServer

```bash
firebase deploy --only hosting
```

## Game State Structure

The game state that gets saved includes:

```javascript
{
  snake: [{ x: 10, y: 10 }, ...],
  food: { x: 15, y: 15 },
  dx: 1,
  dy: 0,
  score: 100,
  level: 2,
  gameSpeed: 130,
  isRunning: true,
  timestamp: 1699999999999
}
```

## Customization

To adapt this for your own game:

1. Replace `snake-game.js` with your game logic
2. Implement `getGameState()` and `loadGameState()` methods
3. Update the `gameId` in `gserver-integration.js`
4. Customize metadata fields as needed

## Controls

- **Arrow Keys** or **WASD**: Move snake
- **Space**: Pause/Resume
- **Start Button**: Begin game
- **Save Button**: Quick save to slot 1

## Notes

- The game automatically updates progress when game over
- Quick save uses slot 1 by default
- Auto-save can be enabled (see `gserver-integration.js`)
- Connection status is shown in top-right corner
- Works both standalone and within GServer iframe

## License

MIT - Feel free to use as a template for your own games!
