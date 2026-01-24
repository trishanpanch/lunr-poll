import "server-only";
import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin
// On Cloud Run / App Hosting, it auto-detects credentials.
// For local dev, you can set FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string).

if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            initializeApp({
                credential: cert(serviceAccount),
            });
        } catch (error) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", error);
            // Fallback to default, might fail if no other creds
            initializeApp();
        }
    } else {
        // Default credentials (GCP / Firebase Hosting)
        initializeApp();
    }
}

const app = getApp();
export const db = process.env.FIREBASE_DATABASE_ID
    ? getFirestore(app, process.env.FIREBASE_DATABASE_ID)
    : getFirestore(app);
export const auth = getAuth(app);
