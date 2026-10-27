import { getFirestore } from "firebase/firestore";
import { app } from "./firebase-config.js";

// النسخة الكاملة من قاعدة البيانات (التحديث المباشر وغيره) للوحة التاجر والصفحات اللي تحتاجها
export const db = getFirestore(app);
export { auth, ensureAnonymousAuth } from "./firebase-auth.js";
