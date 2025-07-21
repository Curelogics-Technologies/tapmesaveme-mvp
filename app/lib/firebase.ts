import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

// Log environment variables for debugging
// console.log("API KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
// console.log("AUTH DOMAIN:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
// console.log("PROJECT ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if we have the minimum required configuration
const hasMinimalConfig = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (hasMinimalConfig) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    //console.log("✅ Firebase initialized successfully");
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
    app = null;
    db = null;
  }
} else {
  console.warn("⚠️ Firebase configuration incomplete. Running without Firebase connection.");
  // console.log("To connect to Firebase, please set these environment variables in .env.local:");
  // console.log("- NEXT_PUBLIC_FIREBASE_API_KEY");
  // console.log("- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  // console.log("- NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  // console.log("- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  // console.log("- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  // console.log("- NEXT_PUBLIC_FIREBASE_APP_ID");
}

// Export a function to check if Firebase is available
export const isFirebaseAvailable = () => !!db;

export { db };
export default app;