import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

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
const provider = new GoogleAuthProvider();

export function getCurrentUser() {
  return auth.currentUser;
}

export function onAuth(callback) {
  onAuthStateChanged(auth, callback);
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (e) {
    console.error('Login failed:', e);
    return null;
  }
}

export async function logout() {
  await signOut(auth);
}
