// Firebase Admin SDK initialization for Vercel serverless functions
import admin from 'firebase-admin';

// Initialize Firebase Admin (singleton pattern)
if (!admin.apps.length) {
    // For Vercel, use environment variables
    // Using VITE_FIREBASE_PROJECT_ID since it's already set
    const serviceAccount = {
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
