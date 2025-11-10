# GServer Setup Guide

Complete step-by-step guide to get GServer running with your Firebase project.

## Prerequisites

- A Firebase account (free)
- Node.js 14+ installed
- Basic command line knowledge
- A text editor

## Part 1: Firebase Console Setup

### Step 1: Access Your Firebase Project

1. Go to https://console.firebase.google.com/project/gserver-f273c/overview
2. You should see your "gserver-f273c" project dashboard

### Step 2: Enable Authentication

1. Click on **"Authentication"** in the left sidebar (under Build section)
2. Click **"Get started"** if this is your first time
3. Click on the **"Sign-in method"** tab
4. Find **"Email/Password"** in the providers list
5. Click on it, then toggle **"Enable"**
6. Click **"Save"**

✅ Authentication is now enabled!

### Step 3: Create Firestore Database

1. Click on **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll deploy proper rules later)
4. Click **"Next"**
5. Select a location (e.g., `us-central1` or closest to you)
6. Click **"Enable"**
7. Wait for the database to be created (~30 seconds)

✅ Firestore is now ready!

### Step 4: Enable Cloud Storage

1. Click on **"Storage"** in the left sidebar
2. Click **"Get started"**
3. Choose **"Start in test mode"** (we'll deploy proper rules later)
4. Click **"Next"**
5. Keep the default location (should match Firestore)
6. Click **"Done"**

✅ Storage is now ready!

### Step 5: Get Firebase Configuration

1. Click on the **gear icon** ⚙️ next to "Project Overview" in the left sidebar
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. If you don't have a web app yet:
   - Click the **</>** (web) icon
   - Give it a nickname (e.g., "GServer Web")
   - **Don't** check "Set up Firebase Hosting" (we'll do that separately)
   - Click **"Register app"**
5. You should see a `firebaseConfig` object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza....",
  authDomain: "gserver-f273c.firebaseapp.com",
  projectId: "gserver-f273c",
  storageBucket: "gserver-f273c.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123..."
};
```

6. **Copy this entire object** - you'll need it in Part 2!

✅ Firebase Console setup complete!

## Part 2: Local Development Setup

### Step 1: Install Firebase CLI

Open your terminal and run:

```bash
npm install -g firebase-tools
```

Verify installation:

```bash
firebase --version
```

### Step 2: Login to Firebase

```bash
firebase login
```

This will open your browser. Log in with the same Google account you used for Firebase Console.

### Step 3: Configure Your App

1. Open the file `public/js/app.js` in your text editor
2. Find this section near the top:

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

3. **Replace it** with the `firebaseConfig` you copied in Part 1, Step 5
4. Save the file

✅ App is now configured!

## Part 3: Deploy to Firebase

### Step 1: Deploy Security Rules

From your project directory:

```bash
firebase deploy --only firestore:rules,storage:rules
```

This will:
- Deploy the Firestore security rules
- Deploy the Storage security rules

✅ Security rules deployed!

### Step 2: Deploy the App

```bash
firebase deploy --only hosting
```

This will:
- Upload your files to Firebase Hosting
- Give you a live URL

You should see output like:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/gserver-f273c/overview
Hosting URL: https://gserver-f273c.web.app
```

✅ **Your app is now live!**

### Step 3: Test Your App

1. Open the Hosting URL in your browser (e.g., https://gserver-f273c.web.app)
2. You should see the GServer authentication screen
3. Click **"Register"**
4. Create an account with:
   - Display Name: "Test User"
   - Email: your email
   - Password: at least 6 characters
5. Click **"Register"**
6. You should now see the games screen!

✅ App is working!

## Part 4: Add Your First Game

### Option A: Add Sample Games

The app will automatically create 3 sample games (Snake, Tetris, Pong) when you first load it. However, these will have placeholder URLs.

### Option B: Add Real Games Manually

1. Go to Firebase Console → Firestore Database
2. Click **"Start collection"**
3. Collection ID: `games`
4. Click **"Next"**
5. Add a document with Document ID: `snake`
6. Add these fields:

| Field | Type | Value |
|-------|------|-------|
| gameId | string | snake |
| name | string | Snake Game |
| description | string | Classic snake game |
| category | string | Arcade |
| iframeUrl | string | https://your-game-url.com |
| thumbnailUrl | string | (leave empty) |
| version | string | 1.0.0 |
| maxSaveSlots | number | 3 |
| isActive | boolean | true |

7. Click **"Save"**

### Using the Example Game

We've included a complete Snake game example in `examples/snake-game/`:

1. Deploy the example game to any hosting service (Netlify, Vercel, etc.)
2. Use that URL as the `iframeUrl` in Firestore
3. See `examples/snake-game/README.md` for details

✅ Games added!

## Part 5: Testing Features

### Test Authentication

1. Logout (click the Logout button)
2. Try logging in with your credentials
3. Try registering a new account

### Test Game Save/Load

1. Click on a game to launch it
2. Play the game (if it's the example Snake game)
3. Click the **"Saves"** button
4. Click **"Save Here"** on Slot 1
5. The game should request a save
6. Close the game and reopen it
7. Click **"Saves"** → **"Load"** on Slot 1
8. Your game state should be restored!

### Test Profile

1. Click the **"Profile"** button in the top nav
2. You should see your account info and gaming stats

## Troubleshooting

### "Permission denied" errors

**Problem**: Can't read/write to Firestore or Storage

**Solution**:
1. Make sure you deployed the security rules: `firebase deploy --only firestore:rules,storage:rules`
2. Verify you're logged in (check the auth screen)
3. Check the browser console for specific error messages

### Firebase config errors

**Problem**: "Firebase: Error (auth/invalid-api-key)"

**Solution**:
1. Double-check you copied the entire `firebaseConfig` correctly
2. Make sure there are no typos
3. Verify the config is in `public/js/app.js`
4. Redeploy: `firebase deploy --only hosting`

### Games not loading

**Problem**: Game cards show but have placeholder URLs

**Solution**:
1. You need to add real games to Firestore (see Part 4)
2. Or deploy the example game and use its URL

### Can't login after registering

**Problem**: Registration succeeds but login fails

**Solution**:
1. Check Firebase Console → Authentication → Users
2. Verify your user was created
3. Try resetting your password
4. Check browser console for error messages

## Next Steps

Now that your platform is running:

1. **Deploy real games**: See `examples/snake-game/` for integration example
2. **Customize styling**: Edit `public/css/styles.css`
3. **Add more features**: See `game-platform-spec.md` for Phase 2 features
4. **Set up custom domain**: Firebase Hosting supports custom domains

## Useful Commands

```bash
# Test locally before deploying
firebase serve

# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only rules
firebase deploy --only firestore:rules,storage:rules

# View logs
firebase functions:log

# Open Firebase console
firebase open
```

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)

## Getting Help

If you run into issues:

1. Check the browser console (F12) for errors
2. Check Firebase Console → Functions → Logs
3. Review the `game-platform-spec.md` for architecture details
4. Review the example game integration
5. Check Firebase status: https://status.firebase.google.com/

---

**Congratulations!** 🎉 Your GServer platform is now running!
