import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD9lVe0LluisFTTguY9r6XsRe51UeiKnL0",
  authDomain: "word-34b1c.firebaseapp.com",
  projectId: "word-34b1c",
  storageBucket: "word-34b1c.firebasestorage.app",
  messagingSenderId: "717499686556",
  appId: "1:717499686556:web:4ff9261bd04a8c40e51759",
  measurementId: "G-60E4RX5P7Q"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
