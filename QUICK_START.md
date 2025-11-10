# GServer - Quick Start

Get your gaming platform running in 10 minutes!

## Prerequisites

```bash
npm install -g firebase-tools
firebase login
```

## Step 1: Configure Firebase

1. Get your Firebase config from: https://console.firebase.google.com/project/gserver-f273c/settings/general
2. Replace the config in `public/js/app.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "gserver-f273c.firebaseapp.com",
  projectId: "gserver-f273c",
  storageBucket: "gserver-f273c.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 2: Enable Firebase Services

Go to https://console.firebase.google.com/project/gserver-f273c/overview

1. **Authentication** → Enable "Email/Password"
2. **Firestore Database** → Create database (test mode)
3. **Storage** → Get started (test mode)

## Step 3: Deploy

```bash
# Deploy security rules
npm run deploy:rules

# Deploy the app
npm run deploy:hosting
```

## Step 4: Test

1. Open https://gserver-f273c.web.app
2. Register a new account
3. Browse the game library

## Adding Games

Add to Firestore `games` collection:

```javascript
{
  gameId: "my-game",
  name: "My Game",
  description: "An awesome game",
  category: "Arcade",
  iframeUrl: "https://my-game-url.com",
  version: "1.0.0",
  maxSaveSlots: 3,
  isActive: true
}
```

## Local Development

```bash
npm run serve
# Open http://localhost:5000
```

## Need Help?

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions.

## Integrating Your Game

See [examples/snake-game/README.md](examples/snake-game/README.md) for a complete example.

Key steps:
1. Add postMessage listener
2. Send GAME_READY on load
3. Implement save/load handlers
4. Deploy and register in Firestore

---

**That's it!** Your gaming platform is ready 🎮
