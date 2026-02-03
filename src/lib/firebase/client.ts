import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase for SSR (check if apps already initialized)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID
    ? getFirestore(app, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID)
    : getFirestore(app);
export const storage = getStorage(app);

// Connect to Emulators in Development
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    // Prevent multiple connections
    if (!(global as any)._emulatorsConnected) {
        console.log("Connecting to Firebase Emulators...");
        const { connectAuthEmulator } = require("firebase/auth");
        const { connectFirestoreEmulator } = require("firebase/firestore");
        // const { connectStorageEmulator } = require("firebase/storage");

        connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
        connectFirestoreEmulator(db, "127.0.0.1", 8080);
        // connectStorageEmulator(storage, "127.0.0.1", 9199);

        (global as any)._emulatorsConnected = true;
    }
}
