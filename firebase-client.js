import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getFirestore, doc, getDoc, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const contentRef = doc(db, 'siteContent', 'main');
export { getDoc, runTransaction, serverTimestamp };
