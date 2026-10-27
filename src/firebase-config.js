import { initializeApp, getApps, getApp } from "firebase/app";

// إعداد Firebase في مكان واحد: الصفحات العامة (المتجر والمنتج) تاخذ منه نسخة خفيفة
// من قاعدة البيانات، ولوحة التاجر تاخذ النسخة الكاملة، والكل يشتغل على نفس التطبيق.
export const firebaseConfig = {
  apiKey: "AIzaSyCxpS_TMBc9mpJPjwK-TcRDfge-uCaO2Cc",
  authDomain: "pantry-app-148a7.firebaseapp.com",
  projectId: "pantry-app-148a7",
  storageBucket: "pantry-app-148a7.firebasestorage.app",
  messagingSenderId: "334881660819",
  appId: "1:334881660819:web:a4500ab3eefb7570a11266",
  measurementId: "G-B38FS40YJQ"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
