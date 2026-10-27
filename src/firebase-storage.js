import { app } from "./firebase-config.js";
import { getStorage } from "firebase/storage";

// ملف منفصل عن firebase.js عمدًا: يستخدمه فقط لوحة التاجر وصفحة الشراء اللي
// تحتاج رفع/تنزيل ملفات، عشان كود Firebase Storage ما يُحمّل على كل صفحات
// الموقع من البداية (يبطّئ أول تحميل/تحديث للصفحة بدون داعٍ لباقي الصفحات).
export const storage = getStorage(app);
