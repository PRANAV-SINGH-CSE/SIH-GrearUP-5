import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, get, Database } from 'firebase/database';
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyAc3BfU31U2Ic2c8nzVTNvwmylUjf_ZGvM',
  authDomain: 'syncboard-20e62.firebaseapp.com',
  databaseURL: 'https://syncboard-20e62-default-rtdb.firebaseio.com',
  projectId: 'syncboard-20e62',
  storageBucket: 'syncboard-20e62.firebasestorage.app',
  messagingSenderId: '813161505892',
  appId: '1:813161505892:web:8c013971f93c20de09ab71',
  measurementId: 'G-WY8X35TFC9',
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

function getFirebaseDb(): Database {
  const app = getFirebaseApp();
  return getDatabase(app);
}

let firestoreInstance: Firestore | null = null;
export function getFirebaseFirestore(): Firestore {
  const app = getFirebaseApp();
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(app);
  }
  return firestoreInstance;
}

export interface FirebaseScanRecord {
  id: string;
  scanIdNumber: string;
  productName: string;
  manufacturer: string;
  scannedAt: string;
  timestamp: number;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW';
  statusLabel: string;
  explanation: string;
  userId?: string;
  userEmail?: string;
  summary: {
    passed: number;
    failed: number;
    warning: number;
    notApplicable: number;
  };
  extractedInfo: {
    productName: string;
    manufacturer: string;
    consumerCare: string;
    netQuantity: string;
    mfgDate: string;
    address: string;
    mrp: string;
    unitSalePrice?: string;
    bestBefore: string;
    countryOfOrigin: string;
    batchNo: string;
  };
  ruleChecks: Array<{
    id: string;
    ruleName: string;
    status: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
    statusLabel: string;
    legalSection?: string;
    detail?: string;
  }>;
  ocrText?: string;
  verificationNotes?: string;
  imageUrl?: string;
}

export class FirebaseService {
  /**
   * Save a scan report to Firestore user-wise (under users/{userId}/scans/{scanId})
   * and mirror to Realtime Database
   */
  static async saveUserScan(userId: string, scan: FirebaseScanRecord): Promise<void> {
    if (!userId) return;

    // Strip image so only the report and extracted data are stored in database
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { imageUrl, ...reportData } = scan;

    // 1. Save to Cloud Firestore
    try {
      const db = getFirebaseFirestore();
      const scanDoc = doc(db, 'users', userId, 'scans', scan.id);
      await setDoc(scanDoc, {
        ...reportData,
        userId,
        updatedAt: Date.now(),
      });
    } catch (firestoreErr) {
      console.warn('Firestore save error (may use fallback RTDB):', firestoreErr);
    }

    // 2. Mirror to Realtime Database under users/${userId}/scans/${scan.id}
    try {
      const rtdb = getFirebaseDb();
      const scanRef = ref(rtdb, `users/${userId}/scans/${scan.id}`);
      await set(scanRef, {
        ...reportData,
        userId,
        updatedAt: Date.now(),
      });
    } catch (rtdbErr) {
      console.warn('RTDB user mirror error:', rtdbErr);
    }
  }

  /**
   * Fetch all scans belonging strictly to a specific user (from Firestore with RTDB fallback)
   */
  static async listUserScans(userId: string): Promise<FirebaseScanRecord[]> {
    if (!userId) return [];

    // 1. Query Firestore users/{userId}/scans
    try {
      const db = getFirebaseFirestore();
      const scansCol = collection(db, 'users', userId, 'scans');
      const snapshot = await getDocs(scansCol);
      if (!snapshot.empty) {
        const list: FirebaseScanRecord[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as FirebaseScanRecord);
        });
        return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      }
    } catch (firestoreErr) {
      console.warn('Firestore user fetch failed, checking RTDB fallback:', firestoreErr);
    }

    // 2. Fallback to RTDB user collection
    try {
      const rtdb = getFirebaseDb();
      const userScansRef = ref(rtdb, `users/${userId}/scans`);
      const snapshot = await get(userScansRef);
      if (snapshot.exists()) {
        const val = snapshot.val() as Record<string, FirebaseScanRecord>;
        const list = Object.values(val);
        return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      }
    } catch (rtdbErr) {
      console.warn('RTDB user fetch failed:', rtdbErr);
    }

    return [];
  }

  /**
   * Clear all scans for a specific user
   */
  static async clearUserScans(userId: string): Promise<void> {
    if (!userId) return;

    try {
      const db = getFirebaseFirestore();
      const scansCol = collection(db, 'users', userId, 'scans');
      const snapshot = await getDocs(scansCol);
      const deletes = snapshot.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletes);
    } catch (err) {
      console.warn('Firestore user clear error:', err);
    }

    try {
      const rtdb = getFirebaseDb();
      const userScansRef = ref(rtdb, `users/${userId}/scans`);
      await set(userScansRef, null);
    } catch (err) {
      console.warn('RTDB user clear error:', err);
    }
  }

  /**
   * Save a scan report (routes to user-wise storage if userId is provided)
   */
  static async saveScan(scan: FirebaseScanRecord): Promise<void> {
    if (scan.userId) {
      await this.saveUserScan(scan.userId, scan);
      return;
    }

    try {
      const db = getFirebaseDb();
      const scanRef = ref(db, `compliscan/scans/${scan.id}`);
      await set(scanRef, {
        ...scan,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to persist scan to Firebase:', err);
    }
  }

  /**
   * Fetch all scans (legacy / administrative)
   */
  static async listScans(): Promise<FirebaseScanRecord[]> {
    try {
      const db = getFirebaseDb();
      const scansRef = ref(db, 'compliscan/scans');
      const snapshot = await get(scansRef);

      if (!snapshot.exists()) {
        return [];
      }

      const val = snapshot.val() as Record<string, FirebaseScanRecord>;
      const list = Object.values(val);
      return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (err) {
      console.warn('Failed to load scans from Firebase:', err);
      return [];
    }
  }

  /**
   * Fetch a single scan by ID
   */
  static async getScan(id: string): Promise<FirebaseScanRecord | null> {
    try {
      const db = getFirebaseDb();
      const scanRef = ref(db, `compliscan/scans/${id}`);
      const snapshot = await get(scanRef);
      if (snapshot.exists()) {
        return snapshot.val() as FirebaseScanRecord;
      }
      return null;
    } catch (err) {
      console.warn(`Failed to get scan ${id} from Firebase:`, err);
      return null;
    }
  }

  /**
   * Clear all legacy scans
   */
  static async clearScans(): Promise<void> {
    try {
      const db = getFirebaseDb();
      const scansRef = ref(db, 'compliscan/scans');
      await set(scansRef, null);
    } catch (err) {
      console.warn('Failed to clear scans from Firebase:', err);
    }
  }
}
