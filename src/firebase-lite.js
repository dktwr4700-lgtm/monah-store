import { getFirestore } from "firebase/firestore/lite";
import { app } from "./firebase-config.js";

// النسخة الخفيفة من قاعدة البيانات للصفحات العامة (المتجر والمنتج والحزمة):
// أصغر بواجد وتقرا بطلب عادي بدل الاتصال المفتوح، فتفتح أسرع وما تعلق على الشبكات الضعيفة.
export const db = getFirestore(app);
