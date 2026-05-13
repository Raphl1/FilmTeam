import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, signInWithRedirect, signInWithPopup, getRedirectResult, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyBrr1BynxNFHz6D3_kTd_18fWyOTiR19ns",
  authDomain: "fraime-3b3ed.firebaseapp.com",
  databaseURL: "https://fraime-3b3ed-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fraime-3b3ed",
  storageBucket: "fraime-3b3ed.firebasestorage.app",
  messagingSenderId: "93215692033",
  appId: "1:93215692033:web:e851785f310ab7f294b700"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Handle redirect result on page load
getRedirectResult(auth).catch(() => {});

export function getCurrentUser() {
  return auth.currentUser;
}

export function onAuth(callback) {
  onAuthStateChanged(auth, callback);
}

export async function loginWithGoogle() {
  try {
    // Try popup first, fall back to redirect
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
      // Fallback to redirect
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    // If unauthorized domain, try redirect anyway
    if (e.code === 'auth/unauthorized-domain') {
      console.error('Domain not authorized. Add this domain to Firebase Auth → Authorized Domains:', window.location.hostname);
      throw new Error('Domain nicht autorisiert. Bitte ' + window.location.hostname + ' in Firebase Console unter Authentication → Einstellungen → Autorisierte Domains hinzufügen.');
    }
    throw e;
  }
}

export async function loginWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (e) {
    if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    }
    throw e;
  }
}

export async function loginWithPhone(phoneNumber, containerEl) {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerEl, { size: 'invisible' });
  }
  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
  return confirmationResult;
}

export async function logout() {
  await signOut(auth);
}

export { app, auth };
