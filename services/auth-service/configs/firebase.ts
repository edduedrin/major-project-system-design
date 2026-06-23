import admin from "firebase-admin";
import { FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET } from "./config";

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: FIREBASE_PROJECT_ID,
            clientEmail: FIREBASE_CLIENT_EMAIL,
            privateKey: FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        storageBucket: FIREBASE_STORAGE_BUCKET,
    });
    console.log("Firebase Admin Initialized Successfully");
} catch (error) {
    console.error("Firebase Admin Initialization Failed", error);
}

export default admin;
