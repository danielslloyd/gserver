# GServer - Multi-Game Browser Platform

A browser-based gaming platform that hosts multiple games via iframes, with user authentication, cloud save management, progress tracking, and Firebase backend.

## Features

- **User Authentication** - Email/password registration and login
- **Game Library** - Browse and launch multiple games
- **Cloud Saves** - 3 save slots per game stored in Firebase
- **Progress Tracking** - Track stats, high scores, and achievements
- **User Profiles** - View gaming stats and account info
- **postMessage API** - Secure communication between shell and games

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Firebase (Auth, Firestore, Storage, Hosting)
- **Communication**: postMessage API for iframe interaction

## Project Structure

```
gserver/
├── public/                  # Frontend files (served by Firebase Hosting)
│   ├── index.html          # Main shell app
│   ├── css/
│   │   └── styles.css      # Application styles
│   └── js/
│       ├── app.js          # Main application logic
│       ├── auth.js         # Authentication module
│       ├── message-handler.js  # postMessage handler
│       └── save-manager.js # Save/load management
├── firebase.json           # Firebase project config
├── .firebaserc             # Firebase project ID
├── firestore.rules         # Firestore security rules
├── storage.rules           # Storage security rules
└── game-platform-spec.md   # Full architecture specification
```

## Setup Instructions

### 1. Prerequisites

- Node.js 14+ and npm
- Firebase account
- Firebase CLI: `npm install -g firebase-tools`

### 2. Firebase Console Setup

1. Go to https://console.firebase.google.com/project/gserver-f273c/overview

2. **Enable Authentication**:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password" provider

3. **Create Firestore Database**:
   - Go to Firestore Database → Create database
   - Start in **test mode** (we'll deploy rules later)
   - Choose a location (e.g., us-central1)

4. **Enable Storage**:
   - Go to Storage → Get started
   - Start in **test mode** (we'll deploy rules later)
   - Use default location

5. **Get Firebase Config**:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Web apps
   - Click "Add app" or use existing web app
   - Copy the `firebaseConfig` object

### 3. Configure Firebase in Code

Edit `public/js/app.js` and replace the Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "gserver-f273c.firebaseapp.com",
  projectId: "gserver-f273c",
  storageBucket: "gserver-f273c.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Deploy to Firebase

```bash
# Login to Firebase
firebase login

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy hosting (the shell app)
firebase deploy --only hosting
```

Your app will be available at: `https://gserver-f273c.web.app`

### 5. Test Locally (Optional)

```bash
# Serve locally
firebase serve

# Or use the Firebase emulators
firebase emulators:start
```

Then open http://localhost:5000

## Adding Games to the Platform

### Step 1: Register Game in Firestore

Go to Firestore Database in Firebase Console and add a document to the `games` collection:

```javascript
{
  gameId: "your-game-id",
  name: "Your Game Name",
  description: "Game description",
  category: "Arcade",
  iframeUrl: "https://your-game-url.com",
  thumbnailUrl: "",
  version: "1.0.0",
  maxSaveSlots: 3,
  isActive: true
}
```

### Step 2: Integrate postMessage in Your Game

Add this code to your game's JavaScript:

```javascript
// Game initialization
class GameSaveManager {
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
          console.log('User info:', payload);
          break;
        case 'REQUEST_SAVE':
          this.saveGame(payload.slotNumber);
          break;
      }
    });
  }

  notifyReady() {
    window.parent.postMessage({
      type: 'GAME_READY',
      payload: {
        gameId: this.gameId,
        version: '1.0.0'
      }
    }, '*');
  }

  saveGame(slotNumber = 1) {
    const gameState = {
      // Your game state here
      level: this.currentLevel,
      score: this.currentScore,
      playerPosition: this.playerPosition,
      // ... etc
    };

    window.parent.postMessage({
      type: 'SAVE_GAME',
      payload: {
        slotNumber,
        saveData: gameState,
        metadata: {
          level: this.currentLevel,
          score: this.currentScore
        }
      }
    }, '*');
  }

  loadGameState(saveData) {
    // Apply the loaded state to your game
    this.currentLevel = saveData.level;
    this.currentScore = saveData.score;
    this.playerPosition = saveData.playerPosition;
    // ... etc
  }
}

// Initialize when your game loads
const saveManager = new GameSaveManager('your-game-id');

// Add save button handler
document.getElementById('save-btn').addEventListener('click', () => {
  saveManager.saveGame(1);
});
```

### Step 3: Deploy Your Game

Deploy your game to any hosting service:
- Firebase Hosting
- Netlify
- Vercel
- GitHub Pages

### Step 4: Add to Allowed Origins

Edit `public/js/message-handler.js` and add your game URL to `allowedOrigins`:

```javascript
this.allowedOrigins = [
  'https://your-game-url.com',
  // ... other game URLs
];
```

Redeploy the shell app: `firebase deploy --only hosting`

## Using the Platform

### For Users

1. **Register**: Create an account with email and password
2. **Browse Games**: View available games in the library
3. **Play**: Click a game card to launch it in the iframe
4. **Save**: Use the "Saves" button to manage save slots
5. **Profile**: View your gaming stats and progress

### Save Slots

- Each game has 3 save slots
- Save from within the game or using the Saves UI
- Load any save slot to restore game state
- Delete saves you no longer need

## Security

### Firestore Rules

- Users can only read/write their own data
- Games collection is read-only for users
- All operations require authentication

### Storage Rules

- Save files are private to each user
- 100KB limit per save file
- 1MB limit for user avatars

### postMessage Security

- Origin verification in production (currently disabled for dev)
- Message validation and error handling
- Sandboxed iframes

## Development Roadmap

See `game-platform-spec.md` for the full specification.

### Phase 1: MVP ✅
- Firebase Authentication
- Game launcher
- Save/load system
- User profiles

### Phase 2: Progress Tracking (Next)
- Google Sign-In
- Achievements system
- Leaderboards
- Enhanced statistics

### Phase 3: Social Features
- Share saves
- Public save library
- Comments and descriptions

### Phase 4: Multiplayer
- Real-time game rooms
- Firebase Realtime Database integration

## Firebase Cost Estimates

**Free Tier (Spark Plan)** supports:
- Unlimited authentication
- 50K reads/day, 20K writes/day (Firestore)
- 5GB storage, 1GB/day downloads
- 10GB/month hosting bandwidth

**Estimated capacity**: 500-1000 daily active users on free tier

## Troubleshooting

### Authentication not working
- Check Firebase config in `app.js`
- Verify Email/Password is enabled in Firebase Console

### Games not loading
- Check `iframeUrl` in games collection
- Verify game is deployed and accessible
- Check browser console for CORS errors

### Saves not working
- Verify Firestore and Storage are enabled
- Check security rules are deployed
- Check browser console for permission errors

### postMessage not working
- Verify game has postMessage integration
- Check origin restrictions in `message-handler.js`
- Check browser console for message logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use for your own projects!

## Support

For issues and questions:
- Check `game-platform-spec.md` for detailed architecture
- Review Firebase documentation
- Check browser console for errors
- Open an issue on the repository

## Credits

Built with Firebase and vanilla JavaScript.
Architecture based on the Multi-Game Browser Platform specification.
