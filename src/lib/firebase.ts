import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBZi8bXEfY0EtqKgSghB0-J8xc1rL4gTEI",
  authDomain: "rizwangujjarvip.firebaseapp.com",
  projectId: "rizwangujjarvip",
  storageBucket: "rizwangujjarvip.firebasestorage.app",
  messagingSenderId: "893651877917",
  appId: "1:893651877917:web:37fc6c70b5c912e4cec6f4",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
