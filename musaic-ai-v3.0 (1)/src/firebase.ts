import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA55gTPTkIx93WlurPF0FjkfbeonST0fjs",
  authDomain: "utility-destiny-389408.firebaseapp.com",
  projectId: "utility-destiny-389408",
  storageBucket: "utility-destiny-389408.firebasestorage.app",
  messagingSenderId: "856315376532",
  appId: "1:856315376532:web:fcfb1c0a6f430fa510d581"
};

// Initialize Firebase safely
let app;
let auth;
let db;
let storage;

try {
  if (getApps().length > 0) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  console.log("🔥 Firebase Initialized Successfully");
} catch (error) {
  console.error("🔥 Firebase Initialization Error:", error);
}

export { auth, db, storage };
export const googleProvider = new GoogleAuthProvider();
export const initFirebase = () => ({ app, auth, db, storage }); // Backward compatibility

