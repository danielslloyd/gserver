/**
 * Shared Firebase Initialization
 * This file initializes Firebase and can be imported by any page
 */

// Firebase will be auto-initialized by Firebase Hosting
// This file provides utility access to Firebase services

const getFirebaseApp = () => firebase.app();
const getAuth = () => firebase.auth();
const getFirestore = () => firebase.firestore();
const getStorage = () => firebase.storage();

// Export for use in other modules
window.firebaseServices = {
  app: getFirebaseApp,
  auth: getAuth,
  db: getFirestore,
  storage: getStorage
};
