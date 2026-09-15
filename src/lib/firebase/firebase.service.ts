import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, get, Database } from 'firebase/database';

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
   * Save a scan report to Firebase Realtime Database
   */
  static async saveScan(scan: FirebaseScanRecord): Promise<void> {
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
   * Fetch all scans from Firebase Realtime Database
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
   * Clear all scans
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
