# Multi-Game Browser Platform - Architecture & Implementation Spec

## Overview
A browser-based gaming platform that hosts multiple games via iframes, with user authentication, save file management, progress tracking, and future multiplayer capabilities.

## Technology Stack

### Core Services
- **Firebase Authentication**: Email/password (Phase 1), Google OAuth (Phase 2)
- **Firebase Firestore**: User profiles, save metadata, progress tracking
- **Firebase Storage**: Save file storage (.json, .dat, or custom formats)
- **Firebase Hosting**: Static site hosting for shell app
- **Separate Hosting**: Each game deployed independently (Netlify, Vercel, or Firebase)

### Development
- **Shell App**: Vanilla JavaScript or lightweight framework (React/Vue if preferred)
- **Games**: Independent repositories, no framework requirements
- **Communication**: postMessage API for iframe ↔ shell interaction

## Architecture

```
┌─────────────────────────────────────────────┐
│           Shell App (Main Platform)          │
│  - User Authentication                       │
│  - Game Launcher/Selector                    │
│  - Save/Load Management UI                   │
│  - Firebase Integration Layer                │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
    ┌───▼───┐   ┌───▼───┐   ┌───▼───┐
    │ Game1 │   │ Game2 │   │ Game3 │
    │iframe │   │iframe │   │iframe │
    └───────┘   └───────┘   └───────┘
        │           │           │
        └───────────┴───────────┘
                    │
        postMessage Communication
                    │
            ┌───────▼────────┐
            │    Firebase     │
            ├─────────────────┤
            │ • Auth          │
            │ • Firestore     │
            │ • Storage       │
            └─────────────────┘
```

## Data Schema

### Firestore Structure

```
/users/{userId}
  - email: string
  - displayName: string
  - createdAt: timestamp
  - lastLogin: timestamp

/users/{userId}/saves/{saveId}
  - gameId: string                    // "snake", "tetris", etc.
  - slotNumber: number                // 1, 2, 3 (for multiple slots)
  - fileName: string                  // "snake_slot1_20241110.json"
  - storagePath: string               // "saves/{userId}/{gameId}/{fileName}"
  - createdAt: timestamp
  - lastModified: timestamp
  - metadata: {                       // Game-specific, searchable
      level: number (optional)
      score: number (optional)
      playTime: number (optional)
      customData: object (optional)
    }
  - thumbnail: string (optional)      // Base64 or Storage URL for preview

/users/{userId}/progress/{gameId}
  - totalPlayTime: number
  - highScore: number
  - achievements: array
  - lastPlayed: timestamp
  - gamesCompleted: number
  - customStats: object

/games/{gameId}                       // Registry of available games
  - name: string
  - description: string
  - thumbnailUrl: string
  - iframeUrl: string
  - version: string
  - maxSaveSlots: number
  - category: string
  - isActive: boolean
```

### Firebase Storage Structure

```
/saves/{userId}/{gameId}/
  - slot1_20241110_143022.json
  - slot2_20241109_091544.json
  - slot3_20241108_201233.json

/game-thumbnails/{gameId}/
  - cover.png
  - screenshot1.png

/user-avatars/{userId}/
  - avatar.png
```

## postMessage Communication Protocol

### Shell → Game Messages

```javascript
// Load a saved game
{
  type: 'LOAD_GAME',
  payload: {
    saveData: {...},      // Parsed save file content
    slotNumber: 1
  }
}

// User info for display
{
  type: 'USER_INFO',
  payload: {
    userId: 'abc123',
    displayName: 'Player1',
    email: 'user@example.com'
  }
}

// Request to save (optional trigger)
{
  type: 'REQUEST_SAVE'
}
```

### Game → Shell Messages

```javascript
// Save game state
{
  type: 'SAVE_GAME',
  payload: {
    slotNumber: 1,
    saveData: {...},           // Serializable game state
    metadata: {
      level: 5,
      score: 1000,
      playTime: 3600
    },
    thumbnail: 'data:image/png;base64,...' (optional)
  }
}

// Update progress/stats
{
  type: 'UPDATE_PROGRESS',
  payload: {
    highScore: 1500,
    achievements: ['first_win', 'speed_demon'],
    playTime: 3600
  }
}

// Game ready
{
  type: 'GAME_READY',
  payload: {
    gameId: 'snake',
    version: '1.0.0'
  }
}

// Request available saves
{
  type: 'REQUEST_SAVES'
}

// Error occurred
{
  type: 'ERROR',
  payload: {
    message: 'Failed to save game',
    code: 'SAVE_ERROR'
  }
}
```

## Implementation Phases

### Phase 1: MVP (Basic Platform)

**Goal**: Users can log in, play games, and save/load progress

**Shell App Features**:
- [ ] Firebase Authentication (email/password)
- [ ] Simple game launcher UI (grid of game cards)
- [ ] Firebase Firestore & Storage integration
- [ ] postMessage handler for save/load
- [ ] Save slot management UI (3 slots per game)
- [ ] Basic user profile page

**Game Integration**:
- [ ] Add postMessage send/receive to each game
- [ ] Implement save state serialization
- [ ] Implement load state deserialization
- [ ] Deploy each game to separate URL

**Firebase Setup**:
- [ ] Create Firebase project
- [ ] Enable Authentication (email/password)
- [ ] Create Firestore database (start in test mode, then add security rules)
- [ ] Enable Storage bucket
- [ ] Deploy shell app to Firebase Hosting

**Estimated Effort**: 2-3 weeks

---

### Phase 2: Progress Tracking

**Goal**: Track statistics and achievements across sessions

**Features**:
- [ ] Add Google Sign-In option
- [ ] Global progress dashboard
- [ ] Per-game statistics page
- [ ] Achievement system framework
- [ ] Play time tracking
- [ ] High score leaderboard (per-user, view others later)

**Estimated Effort**: 1 week

---

### Phase 3: Sharing & Social

**Goal**: Users can share game states with each other

**Features**:
- [ ] Generate shareable save links
- [ ] "Clone save" functionality (copy someone else's save)
- [ ] Public vs private saves
- [ ] Save comments/descriptions
- [ ] Simple discovery feed ("Recent saves from community")

**New postMessage Types**:
```javascript
{
  type: 'SHARE_SAVE',
  payload: {
    slotNumber: 1,
    isPublic: true,
    description: 'Tough level completed!'
  }
}
```

**Firestore Additions**:
```
/shared-saves/{shareId}
  - userId: string
  - gameId: string
  - saveId: string
  - storagePath: string
  - description: string
  - createdAt: timestamp
  - viewCount: number
  - cloneCount: number
```

**Estimated Effort**: 1-2 weeks

---

### Phase 4: Real-Time Multiplayer

**Goal**: Players can compete or cooperate in real-time

**Approach**:
- Use **Firebase Realtime Database** for low-latency sync
- Games send position/action updates via postMessage
- Shell relays to Firebase Realtime DB
- Shell broadcasts to opponent's iframe

**Architecture**:
```
Game A iframe ──postMessage──> Shell ──Firebase─→ Shell ──postMessage──> Game B iframe
```

**New Collections**:
```
/game-rooms/{roomId}
  - gameId: string
  - players: [userId1, userId2]
  - status: 'waiting' | 'active' | 'completed'
  - createdAt: timestamp

/game-rooms/{roomId}/state
  - {Dynamic game state synced in real-time}
```

**Estimated Effort**: 2-3 weeks (varies by game complexity)

## Code Examples

### Shell App: postMessage Handler

```javascript
// shell-app/message-handler.js

class GameMessageHandler {
  constructor(firebaseApp) {
    this.auth = firebase.auth(firebaseApp);
    this.db = firebase.firestore(firebaseApp);
    this.storage = firebase.storage(firebaseApp);
    this.activeGameFrame = null;
  }

  init() {
    window.addEventListener('message', (event) => {
      // Verify origin (security)
      const allowedOrigins = [
        'https://snake.yourdomain.com',
        'https://tetris.yourdomain.com',
        // Add all game URLs
      ];
      
      if (!allowedOrigins.includes(event.origin)) {
        console.warn('Message from unauthorized origin:', event.origin);
        return;
      }

      this.handleMessage(event.data, event.source);
    });
  }

  async handleMessage(message, source) {
    const { type, payload } = message;

    switch (type) {
      case 'GAME_READY':
        this.activeGameFrame = source;
        await this.sendUserInfo(source);
        break;

      case 'SAVE_GAME':
        await this.saveGame(payload);
        break;

      case 'REQUEST_SAVES':
        await this.sendSaves(source, payload.gameId);
        break;

      case 'UPDATE_PROGRESS':
        await this.updateProgress(payload);
        break;

      case 'ERROR':
        console.error('Game error:', payload);
        this.showErrorToUser(payload.message);
        break;
    }
  }

  async saveGame({ slotNumber, saveData, metadata, thumbnail }) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const gameId = this.getCurrentGameId();
    const fileName = `slot${slotNumber}_${Date.now()}.json`;
    const storagePath = `saves/${user.uid}/${gameId}/${fileName}`;

    // Upload save file to Storage
    const storageRef = this.storage.ref(storagePath);
    await storageRef.putString(JSON.stringify(saveData));

    // Save metadata to Firestore
    const saveRef = this.db.collection('users').doc(user.uid)
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

    this.showSuccessMessage('Game saved!');
  }

  async loadSave(saveId) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Get metadata
    const saveDoc = await this.db.collection('users').doc(user.uid)
                                 .collection('saves').doc(saveId).get();
    
    if (!saveDoc.exists) throw new Error('Save not found');

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
        slotNumber: saveData.slotNumber
      }
    });
  }

  sendToGame(message) {
    if (this.activeGameFrame) {
      this.activeGameFrame.postMessage(message, '*');
    }
  }

  getCurrentGameId() {
    // Extract from URL or state management
    return this.currentGameId;
  }
}
```

### Game: postMessage Integration

```javascript
// game/save-manager.js

class SaveManager {
  constructor(gameId) {
    this.gameId = gameId;
    this.setupMessageListener();
    this.notifyReady();
  }

  setupMessageListener() {
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'LOAD_GAME':
          this.loadGameState(payload.saveData);
          break;

        case 'USER_INFO':
          this.setUserInfo(payload);
          break;

        case 'REQUEST_SAVE':
          this.saveGame();
          break;
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
  }

  saveGame(slotNumber = 1) {
    const gameState = this.serializeGameState();
    const metadata = {
      level: this.currentLevel,
      score: this.currentScore,
      playTime: this.totalPlayTime
    };

    this.sendToShell({
      type: 'SAVE_GAME',
      payload: {
        slotNumber,
        saveData: gameState,
        metadata,
        thumbnail: this.captureScreenshot() // optional
      }
    });
  }

  loadGameState(saveData) {
    // Deserialize and apply to game
    this.currentLevel = saveData.level;
    this.currentScore = saveData.score;
    this.playerPosition = saveData.playerPosition;
    // ... restore full game state
    
    this.resumeGame();
  }

  serializeGameState() {
    return {
      level: this.currentLevel,
      score: this.currentScore,
      playerPosition: this.playerPosition,
      inventory: this.inventory,
      // ... all game state
    };
  }

  sendToShell(message) {
    window.parent.postMessage(message, '*');
  }

  captureScreenshot() {
    // Optional: Use canvas.toDataURL() or html2canvas
    const canvas = document.querySelector('canvas');
    return canvas ? canvas.toDataURL('image/png') : null;
  }
}

// Initialize when game loads
const saveManager = new SaveManager('snake');

// Hook into game events
document.getElementById('save-button').addEventListener('click', () => {
  saveManager.saveGame(1); // Save to slot 1
});
```

## Firebase Configuration

### Security Rules - Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
      
      // User's saves
      match /saves/{saveId} {
        allow read: if request.auth.uid == userId;
        allow write: if request.auth.uid == userId;
      }
      
      // User's progress
      match /progress/{gameId} {
        allow read: if request.auth.uid == userId;
        allow write: if request.auth.uid == userId;
      }
    }
    
    // Game registry (read-only for users)
    match /games/{gameId} {
      allow read: if request.auth != null;
      allow write: if false; // Admin only
    }
    
    // Shared saves (Phase 3)
    match /shared-saves/{shareId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.userId;
    }
  }
}
```

### Security Rules - Storage

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // User save files
    match /saves/{userId}/{gameId}/{fileName} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId
                   && request.resource.size < 100 * 1024; // 100KB limit
    }
    
    // User avatars
    match /user-avatars/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId
                   && request.resource.size < 1 * 1024 * 1024; // 1MB limit
    }
    
    // Game thumbnails (read-only for users)
    match /game-thumbnails/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if false; // Admin only
    }
  }
}
```

## Deployment Checklist

### Initial Setup
- [ ] Create Firebase project at console.firebase.google.com
- [ ] Install Firebase CLI: `npm install -g firebase-tools`
- [ ] Login: `firebase login`
- [ ] Initialize project: `firebase init`

### Firebase Console Configuration
- [ ] Enable Authentication methods (Email/Password)
- [ ] Create Firestore database (start in test mode)
- [ ] Enable Storage bucket
- [ ] Deploy security rules (after testing)
- [ ] Add authorized domains for OAuth

### Shell App Deployment
- [ ] Build shell app
- [ ] Deploy to Firebase Hosting: `firebase deploy --only hosting`
- [ ] Configure custom domain (optional)

### Game Deployments
- [ ] Deploy each game to separate hosting (Netlify/Vercel/Firebase)
- [ ] Add game URLs to allowed origins in postMessage handler
- [ ] Update Firestore `/games` collection with game metadata

### Testing
- [ ] Test authentication flow
- [ ] Test save/load in each game
- [ ] Test cross-origin postMessage (check browser console)
- [ ] Test on mobile devices
- [ ] Load test with Firebase emulator

## Cost Estimates (Free Tier Limits)

**Firebase Free Tier (Spark Plan)**:
- Authentication: Unlimited
- Firestore: 50K reads/day, 20K writes/day, 1GB storage
- Storage: 5GB total, 1GB/day downloads, 50K operations/day
- Hosting: 10GB/month bandwidth

**With 100KB saves and 100 daily active users**:
- Storage used: ~300KB per user × 100 = 30MB (well within limits)
- Daily writes: ~500 saves/day (well within 20K limit)
- Daily reads: ~1000 loads/day (well within 50K limit)

**You'll stay free tier until ~500-1000 daily active users.**

## Next Steps

1. Set up Firebase project
2. Create shell app repository
3. Build basic authentication UI
4. Integrate one game as proof-of-concept
5. Test save/load flow end-to-end
6. Add remaining games
7. Deploy to production

## Notes

- **CORS**: Games must set proper CORS headers if loading assets
- **Security**: Always validate postMessage origins
- **Versioning**: Consider save file version compatibility as games update
- **Offline**: Consider service workers for offline play (future enhancement)
- **Mobile**: Test touch controls and responsive iframe sizing
