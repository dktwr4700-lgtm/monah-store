import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCxpS_TMBc9mpJPjwK-TcRDfge-uCaO2Cc",
  authDomain: "pantry-app-148a7.firebaseapp.com",
  projectId: "pantry-app-148a7",
  storageBucket: "pantry-app-148a7.firebasestorage.app",
  messagingSenderId: "334881660819",
  appId: "1:334881660819:web:a4500ab3eefb7570a11266",
  measurementId: "G-B38FS40YJQ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
