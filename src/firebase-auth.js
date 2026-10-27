import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { app } from "./firebase-config.js";

export const auth = getAuth(app);

// يضمن وجود جلسة دخول (حتى لو مجهولة) قبل أي عملية تحتاج صلاحية
// يُستخدم في صفحة المنتج قبل إصدار تصريح تحميل الملف
export function ensureAnonymousAuth() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsub();
        resolve(user.uid);
      } else {
        signInAnonymously(auth).catch((err) => {
          unsub();
          reject(err);
        });
      }
    });
  });
}
