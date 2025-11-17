# DrillSword Multi-Site Architecture

## Overview

DrillSword is a multi-game and multi-tool platform hosted at **drillsword.com**. Instead of using iframes, each game and tool is hosted as a completely separate site with its own HTML page. The only commonality is a single login system powered by Firebase Authentication that allows users to access their saves across all games and tools.

## Site Structure

```
drillsword.com/
├── / (redirects to /main)
├── /main                 - Main landing page (login optional)
├── /games                - Games listing page
│   ├── /games/snake      - Snake game (standalone)
│   ├── /games/puzzle     - 15 Puzzle game (standalone)
│   └── /games/memory     - Memory game (standalone)
├── /tools                - Tools listing page
│   ├── /tools/notepad    - Notepad with cloud sync (standalone)
│   ├── /tools/calculator - Calculator (standalone)
│   └── /tools/timer      - Timer/Stopwatch (standalone)
└── /settings             - Settings and save games viewer
```

## Key Features

### 1. Independent Sites
Each game and tool is completely standalone with its own:
- HTML page
- Game/tool logic
- UI and styling
- No iframe sandboxing required

### 2. Shared Authentication
- Single Firebase Authentication system
- Login once, access everything
- Auth state synced across all pages
- Automatic redirection for protected content

### 3. Centralized Save System
- All saves stored in Firebase Firestore
- Access saves from any game/tool
- View all saves in one place at `/settings`
- Cloud sync enabled by default

## Technical Architecture

### Directory Structure

```
public/
├── index.html                    - Root redirect to /main
├── css/
│   └── styles.css                - Shared styles
├── js/
│   └── shared/                   - Shared modules
│       ├── firebase-init.js      - Firebase initialization
│       ├── auth-utils.js         - Authentication utilities
│       ├── save-utils.js         - Save system utilities
│       └── ui-utils.js           - UI helper functions
├── main/
│   └── index.html                - Landing page
├── games/
│   ├── index.html                - Games listing
│   ├── snake/
│   │   ├── index.html
│   │   └── snake-game.js
│   └── puzzle/
│       └── index.html
├── tools/
│   ├── index.html                - Tools listing
│   └── notepad/
│       └── index.html
└── settings/
    └── index.html                - Settings & saves viewer
```

### Shared Modules

#### 1. firebase-init.js
Provides centralized Firebase service access:
```javascript
window.firebaseServices = {
  app: getFirebaseApp,
  auth: getAuth,
  db: getFirestore,
  storage: getStorage
};
```

#### 2. auth-utils.js
Authentication utilities available on all pages:
```javascript
window.sharedAuth = new SharedAuth();
sharedAuth.init();
sharedAuth.login(email, password);
sharedAuth.register(email, password, displayName);
sharedAuth.logout();
sharedAuth.getCurrentUser();
sharedAuth.onAuthStateChanged(callback);
```

#### 3. save-utils.js
Centralized save system:
```javascript
window.sharedSaveSystem = new SharedSaveSystem();
sharedSaveSystem.saveGame(gameId, slotId, saveData, saveName);
sharedSaveSystem.loadGame(gameId, slotId);
sharedSaveSystem.getGameSaves(gameId);
sharedSaveSystem.getAllSaves();
sharedSaveSystem.deleteSave(gameId, slotId);
```

#### 4. ui-utils.js
Common UI functions:
```javascript
showLoading(show);
showNotification(message, type, duration);
updateUserDisplay(user);
formatDate(timestamp);
formatDuration(seconds);
```

## Data Model

### Firestore Collections

#### users/{userId}
```javascript
{
  email: string,
  displayName: string,
  createdAt: timestamp,
  lastLogin: timestamp
}
```

#### users/{userId}/saves/{saveId}
```javascript
{
  gameId: string,          // e.g., 'snake', 'puzzle', 'notepad'
  slotId: number,          // Save slot number
  name: string,            // Display name for the save
  data: object,            // Game-specific save data
  timestamp: timestamp,
  userId: string
}
```

#### users/{userId}/progress/{gameId}
```javascript
{
  highScore: number,
  totalPlayTime: number,
  achievements: array,
  lastPlayed: timestamp,
  // Game-specific progress data
}
```

## Adding New Games/Tools

### 1. Create Directory Structure
```bash
public/games/mygame/
└── index.html
```

### 2. Include Required Scripts
```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>

<!-- Shared Scripts -->
<script src="/js/shared/firebase-init.js"></script>
<script src="/js/shared/ui-utils.js"></script>
<script src="/js/shared/auth-utils.js"></script>
<script src="/js/shared/save-utils.js"></script>
```

### 3. Initialize Auth
```javascript
const GAME_ID = 'mygame';

sharedAuth.init();
sharedAuth.onAuthStateChanged((user) => {
  if (user) {
    // User is logged in
    updateUserDisplay(user);
  } else {
    // User is not logged in
  }
});
```

### 4. Implement Save/Load
```javascript
// Save game
await sharedSaveSystem.saveGame(GAME_ID, slotId, gameData, 'My Save');

// Load game
const result = await sharedSaveSystem.loadGame(GAME_ID, slotId);
if (result.success) {
  const gameData = result.data.data;
  // Restore game state
}
```

### 5. Update Listing Page
Add your game to the appropriate listing page (`/games/index.html` or `/tools/index.html`).

## Navigation

All pages include a consistent header with navigation:
- Home → `/main`
- Games → `/games`
- Tools → `/tools`
- Settings → `/settings`
- Login/Logout button

## Authentication Flow

1. User visits any page
2. Firebase Auth checks login status
3. If not logged in:
   - Public pages show login button
   - Private features are hidden
4. If logged in:
   - User info displayed in header
   - Save/load features enabled
   - Settings page accessible

## Benefits of This Architecture

1. **Simplicity**: No iframe complexity or message passing
2. **Security**: Each page runs in the same origin, no CORS issues
3. **Performance**: No iframe overhead, direct Firebase access
4. **Maintainability**: Each game/tool is independent
5. **Scalability**: Easy to add new games and tools
6. **User Experience**: Seamless navigation, shared auth state

## Development

### Local Testing
```bash
firebase serve
```

### Deployment
```bash
firebase deploy --only hosting
```

## Future Enhancements

- [ ] Add more games (Tetris, Pong, etc.)
- [ ] Add more tools (Calculator, Timer, etc.)
- [ ] Implement achievements system
- [ ] Add social features (leaderboards, sharing)
- [ ] Implement PWA features (offline support)
- [ ] Add profile customization
