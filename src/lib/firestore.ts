/**
 * Firestore initialization.
 *
 * Returns the Firestore instance for the current Firebase app.
 * Only available when Firebase is configured (VITE_FIREBASE_* env vars present).
 * Does NOT enable offline persistence — localStorage is the single source of
 * truth; Firestore is the background sync mirror.
 */

import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseApp, isFirebaseConfigured } from './firebaseClient';

let _db: Firestore | null = null;

/** Get the Firestore instance, or null if Firebase is not configured. */
export function getFirestoreDB(): Firestore | null {
  if (!isFirebaseConfigured || !firebaseApp) return null;
  if (!_db) {
    _db = getFirestore(firebaseApp);
  }
  return _db;
}

/** Quick check: is Firestore available? */
export function isFirestoreReady(): boolean {
  return getFirestoreDB() !== null;
}
