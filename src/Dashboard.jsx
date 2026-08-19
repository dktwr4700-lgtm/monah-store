import React, { useState, useEffect } from "react";
import { auth, db, storage } from "./firebase.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection, addDoc, query, where, onSnapshot,
  serverTimestamp, doc, setDoc, getDoc, getDocs, writeBatch,
  deleteDoc, updateDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Orders from "./Orders.jsx";

const COLORS = ["#16233F", "#4B6152", "#8B3A3A", "#5B4A8A", "#B9832F"];
const ADMIN_EMAIL = "k1997551@gmail.com";

const styles = `
  .dh-page{ min-height:100vh; background:#F6F3EC; font-family:'Cairo', sans-serif; }
  .mono{ font-family:'JetBrains Mono', monospace; }
  .dh-header{ display:flex; justify-content:space-between; align-items:center; padding:16px 20px; background:#FFFFFF; border-bottom:1px solid #E4E0D3; }
  .dh-brand{ font-family:'Almarai', sans-serif; font-weight:800; color:#16233F; font-size:16px; }
  .dh-brand span{ color:#8A8677; font-weight:600; font-size:11.5px; margin-right:6px; }
  .dh-logout{ border:1px solid #E4E0D3; padding:7px 13px; border-radius:8px; font-size:11px; color:#3D4A66; background:none; font-family:'Cairo',sans-serif; cursor:pointer; }
  .dh-admin-btn{ border:1px solid #B9832F; padding:7px 13px; border-radius:8px; font-size:11px; color:#B9832F; background:none; font-family:'Cairo',sans-serif; cursor:pointer; font-weight:700; margin-left:8px; }

  .dh-tabs{ display:flex; gap:6px; padding:12px 16px 0; overflow-x:auto; background:#F6F3EC; }
  .dh-tab{ white-space:nowrap; padding:8px 14px; border-radius:100px; font-size:11.5px; font-weight:700; border:1px solid #E4E0D3; background:#FFFFFF; color:#3D4A66; cursor:pointer; }
  .dh-tab.active{ background:#16233F; color:#fff; border-color:#16233F; }

  .dh-wrap{ padding:18px; max-width:560px; margin:0 auto; }

  .dh-stats{ display:flex; gap:1px; background:#E4E0D3; border-radius:12px; overflow:hidden; margin-bottom:16px; }
  .dh-stat{ flex:1; background:#16233F; padding:16px 10px; text-align:center; }
  .dh-stat:nth-child(2){ background:#1C2C4D; }
  .dh-stat:nth-child(3){ background:#22355A; }
  .dh-stat b{ display:block; font-family:'JetBrains Mono',monospace; font-weight:700; color:#fff; font-size:18px; }
  .dh-stat span{ display:block; color:#AAB4C9; font-size:9.5px; margin-top:4px; }

  .dh-store-link{ background:#FFFFFF; border:1px solid #E4E0D3; border-radius:12px; padding:14px 16px; margin-bottom:14px; }
  .dh-store-label{ color:#8A8677; font-size:10.5px; margin-bottom:7px; font-weight:600; }
  .dh-store-row{ display:flex; align-items:center; gap:8px; }
  .dh-store-url{ flex:1; color:#16233F; font-size:11.5px; font-family:'JetBrains Mono',monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .dh-copy{ background:#16233F; color:#fff; border:none; padding:7px 12px; border-radius:6px; font-size:10.5px; font-weight:700; white-space:nowrap; cursor:pointer; }

  .dh-card{ background:#FFFFFF; border-radius:14px; padding:18px; margin-bottom:14px; border:1px solid #E4E0D3; }
  .dh-title-row{ display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
  .dh-title{ font-family:'Almarai', sans-serif; font-weight:800; font-size:14.5px; color:#16233F; }
  .dh-title-count{ font-family:'JetBrains Mono',monospace; color:#8A8677; font-size:11px; }

  .dh-field{ margin-bottom:12px; }
  .dh-field label{ display:block; font-size:11.5px; color:#8A8677; margin-bottom:6px; font-weight:600; }
  .dh-field input, .dh-field textarea, .dh-field select{ width:100%; padding:11px 13px; border:1px solid #E4E0D3; border-radius:8px; font-size:13px; background:#FBFAF7; font-family:'Cairo', sans-serif; box-sizing:border-box; }
  .dh-hint{ color:#8A8677; font-size:10.5px; margin-top:6px; line-height:1.6; }
  .dh-btn{ width:100%; background:#16233F; color:#fff; border:none; padding:13px; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer; }
  .dh-btn:disabled{ opacity:.6; }
  .dh-type-toggle{ display:flex; gap:8px; }
  .dh-type-btn{ flex:1; padding:11px; border:1px solid #E4E0D3; background:#FBFAF7; border-radius:8px; font-size:12.5px; font-weight:700; color:#3D4A66; cursor:pointer; }
  .dh-type-btn.active{ background:#16233F; color:#fff; border-color:#16233F; }
  .dh-item-stock{ color:#8A8677; font-size:11px; margin-bottom:8px; }
  .dh-images-row{ display:flex; gap:10px; }
  .dh-image-thumb-wrap{ position:relative; width:64px; height:64px; }
  .dh-image-thumb{ width:64px; height:64px; border-radius:10px; object-fit:cover; display:block; }
  .dh-image-remove{ position:absolute; top:-6px; left:-6px; width:20px; height:20px; border-radius:50%; background:#B24C3A; color:#fff; border:2px solid #FFFFFF; font-size:10px; line-height:1; cursor:pointer; }
  .dh-image-add{ width:64px; height:64px; border-radius:10px; border:1.5px dashed #E4E0D3; background:#FBFAF7; display:flex; align-items:center; justify-content:center; font-size:22px; color:#8A8677; cursor:pointer; flex-shrink:0; }
  .dh-item-actions{ display:flex; gap:8px; margin-top:8px; }
  .dh-item-action{ flex:1; text-align:center; padding:8px; border-radius:6px; font-size:11px; font-weight:700; border:1px solid #E4E0D3; background:#FBFAF7; color:#3D4A66; cursor:pointer; }
  .dh-item-action.primary{ background:#16233F; color:#fff; border-color:#16233F; }
  .dh-item-action.danger{ color:#B24C3A; border-color:#F0D9D3; }
  .dh-item-action:disabled{ opacity:.6; }
  .dh-edit-form .dh-field{ margin-bottom:10px; }
  .dh-edit-actions{ display:flex; gap:8px; margin-top:4px; }
  .dh-error{ background:#F6E9E5; color:#B24C3A; padding:10px 14px; border-radius:8px; font-size:13px; margin-bottom:12px; }
  .dh-success{ background:#EAF0EB; color:#4B6152; padding:10px 14px; border-radius:8px; font-size:13px; margin-bottom:12px; }

  .dh-item{ padding:12px 0; border-top:1px dashed #E4E0D3; }
  .dh-item:first-child{ border-top:none; }
  .dh-item-top{ display:flex; justify-content:space-between; margin-bottom:8px; }
  .dh-item-name{ font-weight:700; color:#16233F; font-size:13px; }
  .dh-item-price{ color:#B9832F; font-weight:700; font-size:12.5px; font-family:'JetBrains Mono',monospace; }
  .dh-item-link{ display:flex; gap:8px; align-items:center; background:#FBFAF7; border:1px solid #E4E0D3; border-radius:6px; padding:7px 9px; }
  .dh-item-link-text{ flex:1; font-size:10px; color:#8A8677; font-family:'JetBrains Mono',monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .dh-item-link-btn{ background:#16233F; color:#fff; border:none; padding:5px 10px; border-radius:5px; font-size:10px; cursor:pointer; }
  .empty-note{ color:#B0AC9C; font-size:13px; text-align:center; padding:22px 0; }

  .ds-preview{ background:#FFFFFF; border:1px solid #E4E0D3; border-radius:14px; overflow:hidden; margin-bottom:16px; }
  .ds-preview-bar{ padding:10px 14px; background:#F6F3EC; border-bottom:1px solid #E4E0D3; font-size:10px; color:#8A8677; font-weight:700; font-family:'JetBrains Mono',monospace; }
  .ds-preview-body{ padding:22px 18px; text-align:center; }
  .ds-preview-logo{ width:52px; height:52px; border-radius:14px; margin:0 auto 10px; display:flex; align-items:center; justify-content:center; font-family:'Almarai',sans-serif; font-weight:800; color:#fff; font-size:20px; }
  .ds-preview-logo-img{ width:52px; height:52px; border-radius:14px; margin:0 auto 10px; display:block; object-fit:cover; }
  .ds-preview-name{ font-family:'Almarai',sans-serif; font-weight:800; font-size:14px; margin-bottom:4px; }
  .ds-preview-tag{ font-size:11px; color:#8A8677; }
  .dh-logo-row{ display:flex; align-items:center; gap:12px; }
  .dh-logo-thumb{ width:52px; height:52px; border-radius:12px; object-fit:cover; flex-shrink:0; }
  .dh-logo-placeholder{ width:52px; height:52px; border-radius:12px; background:#F6F3EC; border:1.5px dashed #E4E0D3; display:flex; align-items:center; justify-content:center; color:#8A8677; font-family:'Almarai',sans-serif; font-weight:800; flex-shrink:0; }
  .dh-logo-btn{ border:1px solid #E4E0D3; background:#FFFFFF; padding:9px 14px; border-radius:8px; font-size:11.5px; font-weight:700; color:#16233F; cursor:pointer; }
  .ds-swatches{ display:flex; gap:10px; margin-bottom:16px; }
  .ds-swatch{ width:38px; height:38px; border-radius:10px; position:relative; border:2px solid transparent; cursor:pointer; }
  .ds-swatch.selected{ border-color:#16233F; }
  .ds-swatch.selected::after{ content:"✓"; position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#fff; font-size:13px; }

  .ds-cover-preview{ height:80px; position:relative; overflow:hidden; }
  .ds-cover-preview img{ width:100%; height:100%; object-fit:cover; display:block; }
  .ds-preview-body{ position:relative; margin-top:-30px; }
  .ds-cover-row{ display:flex; align-items:center; gap:12px; }
  .ds-cover-thumb{ width:80px; height:44px; border-radius:8px; object-fit:cover; flex-shrink:0; }
  .ds-cover-placeholder{ width:80px; height:44px; border-radius:8px; background:#F6F3EC; border:1.5px dashed #E4E0D3; flex-shrink:0; display:flex; align-items:center; justify-content:center; color:#B0AC9C; font-size:10px; }

  .ds-view-btn{ display:inline-flex; align-items:center; gap:6px; color:#16233F; font-size:11.5px; font-weight:700; text-decoration:none; border:1px solid #E4E0D3; padding:8px 14px; border-radius:8px; background:#FFFFFF; }

  .ds-save-bar{ position:sticky; bottom:0; background:#FFFFFF; border-top:1px solid #E4E0D3; padding:12px 18px; margin:0 -18px; display:flex; align-items:center; gap:12px; }
  .ds-save-status{ flex:1; font-size:11.5px; color:#8A8677; }
  .ds-save-status.unsaved{ color:#B9832F; font-weight:700; }
  .ds-save-btn{ background:#16233F; color:#fff; border:none; padding:11px 22px; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer; white-space:nowrap; }
  .ds-save-btn:disabled{ opacity:.6; }

  .pk-card{ background:#FFFFFF; border:1px solid #E4E0D3; border-radius:14px; padding:18px; margin-bottom:12px; position:relative; }
  .pk-card.current{ border:2px solid #16233F; }
  .pk-badge{ position:absolute; top:-9px; right:16px; background:#B9832F; color:#fff; font-size:10px; font-weight:700; padding:3px 10px; border-radius:100px; }
  .pk-name{ font-family:'Almarai',sans-serif; font-weight:800; color:#16233F; font-size:14px; margin-bottom:4px; }
  .pk-price{ font-family:'JetBrains Mono',monospace; font-weight:700; color:#16233F; font-size:20px; margin-bottom:10px; }
  .pk-price span{ font-size:11px; color:#8A8677; font-family:'Cairo',sans-serif; }
  .pk-features div{ font-size:12px; color:#3D4A66; padding:3px 0; }
  .pk-current-tag{ display:inline-block; margin-top:10px; background:#EAF0EB; color:#4B6152; font-size:11px; font-weight:700; padding:5px 12px; border-radius:100px; }

  .cp-item{ padding:12px 0; border-top:1px dashed #E4E0D3; }
  .cp-item:first-child{ border-top:none; }
  .cp-item-top{ display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
  .cp-code{ font-family:'JetBrains Mono',monospace; font-weight:800; color:#16233F; font-size:14px; letter-spacing:.02em; }
  .cp-percent{ background:#F3EBDD; color:#B9832F; font-size:11px; font-weight:700; padding:4px 10px; border-radius:100px; }
  .cp-scope{ color:#8A8677; font-size:11px; margin-bottom:8px; }
`;

const COMMON_FEATURES = [
  "بدون عمولة على المبيعات",
  "تسليم تلقائي للمنتج بعد الدفع",
  "صفحة متوافقة مع الجوال",
  "رابط خاص لكل منتج",
  "ترقية أو تخفيض الباقة أو الإلغاء في أي وقت",
];

const PACKAGES = [
  {
    id: "basic", name: "أساسية", price: "3",
    desc: "مناسبة لمن يريد البدء ببيع أول منتجاته الرقمية.",
    btn: "ابدأ متجرك",
    features: ["حتى 10 منتجات", "صفحة متجر جاهزة", "بيع ملفات وأكواد/تراخيص"],
  },
  {
    id: "pro", name: "احترافية", price: "6", popular: true,
    desc: "مناسبة لمن يريد تنمية مبيعاته وتخصيص متجره.",
    btn: "نمِّ متجرك",
    features: ["كل مميزات الأساسية", "منتجات غير محدودة", "تخصيص شعار وألوان المتجر", "كوبونات خصم"],
    soon: ["إنشاء باقات من عدة منتجات", "تقارير مبيعات مفصلة", "تصدير الطلبات والبيانات"],
  },
  {
    id: "full", name: "متجر متكامل", price: "12",
    desc: "مناسبة لمن يريد بناء علامة رقمية مستقلة.",
    btn: "ابنِ علامتك",
    features: ["كل مميزات الاحترافية"],
    soon: ["ربط دومينك الخاص", "إزالة شعار Monah من واجهة المتجر", "حماية متقدمة لروابط التحميل", "تحليلات مصادر الزيارات", "دعم أولوية", "مساعدة في إعداد المتجر"],
  },
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("overview");

  // products
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [category, setCategory] = useState("");
  const [productType, setProductType] = useState("file");
  const [sellerPlan, setSellerPlan] = useState("basic");
  const [codesText, setCodesText] = useState("");
  const [productImages, setProductImages] = useState([]);
  const [imagesUploading, setImagesUploading] = useState(false);
  const [imagesError, setImagesError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editFileUrl, setEditFileUrl] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState("");

  // store design
  const [storeName, setStoreName] = useState("");
  const [storeColor, setStoreColor] = useState(COLORS[0]);
  const [tagline, setTagline] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState("");
  const [designSaved, setDesignSaved] = useState(false);
  const [designSaving, setDesignSaving] = useState(false);
  const [designDirty, setDesignDirty] = useState(false);

  // coupons
  const [coupons, setCoupons] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponPercent, setCouponPercent] = useState("");
  const [couponScope, setCouponScope] = useState("all");
  const [couponSaving, setCouponSaving] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [deletingCouponId, setDeletingCouponId] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        window.location.hash = "login";
      } else {
        setUser(u);
      }
      setChecking(false);
    });
    return () => unsub();
  }, []);

  // يتأكد إن ملف التاجر موجود بمجموعة sellers (يستخدمه الأدمن)، وينشئه لو ناقص
  useEffect(() => {
    if (!user) return;
    if (user.email === ADMIN_EMAIL) return;
    async function ensureSellerProfile() {
      try {
        const sellerRef = doc(db, "sellers", user.uid);
        const snap = await getDoc(sellerRef);
        if (!snap.exists()) {
          await setDoc(sellerRef, {
            storeName: user.email.split("@")[0],
            email: user.email,
            createdAt: new Date().toISOString(),
            plan: "basic",
            disabled: false,
          });
        }
      } catch (err) {
        console.error("ensureSellerProfile:", err);
      }
    }
    ensureSellerProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    async function loadSellerPlan() {
      try {
        const snap = await getDoc(doc(db, "sellers", user.uid));
        if (snap.exists()) {
          setSellerPlan(snap.data().plan || "basic");
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSellerPlan();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "products"), where("ownerId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "coupons"), where("ownerId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    async function loadStore() {
      const snap = await getDoc(doc(db, "stores", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setStoreName(data.name || "");
        setStoreColor(data.color || COLORS[0]);
        setTagline(data.tagline || "");
        setWhatsapp(data.whatsapp || "");
        setInstagram(data.instagram || "");
        setSlug(data.slug || "");
        setLogoUrl(data.logoUrl || "");
        setCoverUrl(data.coverUrl || "");
      } else {
        setStoreName(user.email.split("@")[0]);
      }
    }
    loadStore();
  }, [user]);

  async function handleAddProduct(e) {
    e.preventDefault();
    setError("");

    if (productType === "file") {
      if (!name || !price || !fileUrl) {
        setError("عبّي اسم المنتج والسعر ورابط الملف.");
        return;
      }
    } else {
      const codesList = codesText.split("\n").map((c) => c.trim()).filter(Boolean);
      if (!name || !price || codesList.length === 0) {
        setError("عبّي اسم المنتج والسعر، وألصقي الأكواد (كود بكل سطر).");
        return;
      }
    }

    setSaving(true);
    try {
      const codesList = codesText.split("\n").map((c) => c.trim()).filter(Boolean);
      const productRef = await addDoc(collection(db, "products"), {
        ownerId: user.uid,
        name,
        price: Number(price),
        description: description || "",
        category: category || "عام",
        type: productType,
        fileUrl: productType === "file" ? fileUrl : "",
        codesCount: productType === "code" ? codesList.length : 0,
        images: productImages,
        createdAt: serverTimestamp(),
      });

      if (productType === "code" && codesList.length > 0) {
        const batch = writeBatch(db);
        codesList.forEach((code) => {
          const codeRef = doc(collection(db, "products", productRef.id, "codes"));
          batch.set(codeRef, { code, used: false, usedBy: null, usedAt: null });
        });
        await batch.commit();
      }

      setName("");
      setPrice("");
      setDescription("");
      setFileUrl("");
      setCategory("");
      setCodesText("");
      setProductType("file");
      setProductImages([]);
    } catch (err) {
      setError("صار خطأ، حاول مرة ثانية.");
    }
    setSaving(false);
  }

  function startEdit(p) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPrice(String(p.price));
    setEditDescription(p.description || "");
    setEditCategory(p.category || "");
    setEditFileUrl(p.fileUrl || "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(productId) {
    if (!editName || !editPrice) {
      setError("عبّي اسم المنتج والسعر.");
      return;
    }
    setEditSaving(true);
    try {
      await updateDoc(doc(db, "products", productId), {
        name: editName,
        price: Number(editPrice),
        description: editDescription || "",
        category: editCategory || "عام",
        fileUrl: editFileUrl || "",
      });
      setEditingId(null);
    } catch (err) {
      setError("تعذر حفظ التعديل، حاول مرة ثانية.");
    }
    setEditSaving(false);
  }

  async function confirmDelete(productId) {
    setDeletingId(productId);
    try {
      await deleteDoc(doc(db, "products", productId));
      setConfirmDeleteId(null);
    } catch (err) {
      setError("تعذر حذف المنتج، حاول مرة ثانية.");
    }
    setDeletingId(null);
  }

  async function handleProductImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImagesError("");
    if (productImages.length >= 2) {
      setImagesError("حد أقصى صورتين لكل منتج.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImagesError("حجم الصورة أكبر من 5 ميجا، اختاري صورة أصغر.");
      return;
    }
    setImagesUploading(true);
    try {
      const fileRef = ref(storage, `product-images/${user.uid}-${Date.now()}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setProductImages((prev) => [...prev, url]);
    } catch (err) {
      setImagesError("تعذر رفع الصورة، حاول مرة ثانية.");
    }
    setImagesUploading(false);
  }

  function removeProductImage(url) {
    setProductImages((prev) => prev.filter((u) => u !== url));
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogoError("");
    if (file.size > 5 * 1024 * 1024) {
      setLogoError("حجم الصورة أكبر من 5 ميجا، اختاري صورة أصغر.");
      return;
    }
    setLogoUploading(true);
    try {
      const fileRef = ref(storage, `logos/${user.uid}-${Date.now()}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setLogoUrl(url);
    } catch (err) {
      setLogoError("تعذر رفع الصورة، حاول مرة ثانية.");
    }
    setLogoUploading(false);
  }

  async function handleCoverUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCoverError("");
    if (file.size > 5 * 1024 * 1024) {
      setCoverError("حجم الصورة أكبر من 5 ميجا، اختاري صورة أصغر.");
      return;
    }
    setCoverUploading(true);
    try {
      const fileRef = ref(storage, `covers/${user.uid}-${Date.now()}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setCoverUrl(url);
      setDesignDirty(true);
    } catch (err) {
      setCoverError("تعذر رفع الصورة، حاول مرة ثانية.");
    }
    setCoverUploading(false);
  }

  async function handleSaveDesign() {
    setDesignSaving(true);
    setDesignSaved(false);
    setSlugError("");
    try {
      const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (cleanSlug) {
        const q = query(collection(db, "stores"), where("slug", "==", cleanSlug));
        const snap = await getDocs(q);
        const takenByOther = snap.docs.some((d) => d.id !== user.uid);
        if (takenByOther) {
          setSlugError("هذا الرابط مستخدم من متجر ثاني، جربي رابط مختلف.");
          setDesignSaving(false);
          return;
        }
      }
      await setDoc(doc(db, "stores", user.uid), {
        name: storeName,
        color: storeColor,
        tagline: tagline || "",
        whatsapp: whatsapp || "",
        instagram: instagram || "",
        slug: cleanSlug || "",
        logoUrl: logoUrl || "",
        coverUrl: coverUrl || "",
        ownerId: user.uid,
        updatedAt: serverTimestamp(),
      });
      try {
        await setDoc(doc(db, "sellers", user.uid), { storeName }, { merge: true });
      } catch (e) {
        console.error(e);
      }
      setSlug(cleanSlug);
      setDesignSaved(true);
      setDesignDirty(false);
      setTimeout(() => setDesignSaved(false), 2000);
    } catch (err) {
      setError("تعذر حفظ التصميم، حاول مرة ثانية.");
    }
    setDesignSaving(false);
  }

  async function handleAddCoupon(e) {
    e.preventDefault();
    setCouponError("");
    if (sellerPlan === "basic") {
      setCouponError("كوبونات الخصم متاحة من الباقة الاحترافية فأعلى.");
      return;
    }
    const cleanCode = couponCode.trim().toUpperCase().replace(/\s+/g, "");
    const percentNum = Number(couponPercent);

    if (!cleanCode) {
      setCouponError("اكتب كود الخصم.");
      return;
    }
    if (!percentNum || percentNum <= 0 || percentNum > 90) {
      setCouponError("نسبة الخصم لازم تكون بين 1 و 90.");
      return;
    }
    const exists = coupons.some((c) => c.code === cleanCode);
    if (exists) {
      setCouponError("عندك كود بنفس الاسم من قبل، اختر اسم ثاني.");
      return;
    }

    setCouponSaving(true);
    try {
      await addDoc(collection(db, "coupons"), {
        ownerId: user.uid,
        code: cleanCode,
        discountPercent: percentNum,
        productId: couponScope === "all" ? null : couponScope,
        active: true,
        createdAt: serverTimestamp(),
      });
      setCouponCode("");
      setCouponPercent("");
      setCouponScope("all");
    } catch (err) {
      setCouponError("صار خطأ، حاول مرة ثانية.");
    }
    setCouponSaving(false);
  }

  async function deleteCoupon(couponId) {
    setDeletingCouponId(couponId);
    try {
      await deleteDoc(doc(db, "coupons", couponId));
    } catch (err) {
      console.error(err);
    }
    setDeletingCouponId(null);
  }

  function couponScopeLabel(c) {
    if (!c.productId) return "على كل منتجاتك";
    const p = products.find((pr) => pr.id === c.productId);
    return p ? `على منتج: ${p.name}` : "على منتج محذوف";
  }

  function handleLogout() {
    signOut(auth).then(() => {
      window.location.hash = "login";
    });
  }

  function copyLink(id, kind) {
    const url = `${window.location.origin}${window.location.pathname}#${kind}/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(kind + id);
      setTimeout(() => setCopied(""), 1500);
    });
  }

  if (checking) return null;

  const storeUrl = `${window.location.origin}${window.location.pathname}#store/${slug || user.uid}`;
  const initial = (storeName || "م").charAt(0);

  return (
    <div className="dh-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <div className="dh-header">
        <div className="dh-brand">Monah <span>· {storeName || "متجرك"}</span></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {user.email === ADMIN_EMAIL && (
            <a href="#admin" className="dh-admin-btn">لوحة الأدمن</a>
          )}
          <button className="dh-logout" onClick={handleLogout}>تسجيل خروج</button>
        </div>
      </div>

      <div className="dh-tabs">
        <button className={"dh-tab" + (tab === "overview" ? " active" : "")} onClick={() => setTab("overview")}>لوحة التحكم</button>
        <button className={"dh-tab" + (tab === "products" ? " active" : "")} onClick={() => setTab("products")}>المنتجات</button>
        <button className={"dh-tab" + (tab === "coupons" ? " active" : "")} onClick={() => setTab("coupons")}>الخصومات</button>
        <button className={"dh-tab" + (tab === "orders" ? " active" : "")} onClick={() => setTab("orders")}>الطلبات</button>
        <button className={"dh-tab" + (tab === "design" ? " active" : "")} onClick={() => setTab("design")}>تصميم المتجر</button>
        <button className={"dh-tab" + (tab === "subscription" ? " active" : "")} onClick={() => setTab("subscription")}>الاشتراك</button>
      </div>

      <div className="dh-wrap">

        {tab === "overview" && (
          <>
            <div className="dh-stats">
              <div className="dh-stat"><b className="mono">{products.length}</b><span>منتج نشط</span></div>
              <div className="dh-stat"><b className="mono">0</b><span>عملية بيع</span></div>
              <div className="dh-stat"><b className="mono">0.00</b><span>ر.ع إجمالي</span></div>
            </div>
            <div className="dh-store-link">
              <div className="dh-store-label">رابط متجرك العام</div>
              <div className="dh-store-row">
                <span className="dh-store-url">{storeUrl}</span>
                <button className="dh-copy" onClick={() => copyLink(slug || user.uid, "store")}>
                  {copied === "store" + (slug || user.uid) ? "تم" : "نسخ"}
                </button>
              </div>
            </div>
            <div className="dh-card">
              <div className="dh-title">مبيعاتك</div>
              <div className="empty-note">ما فيه عمليات بيع لسا. أول عملية بيع بتظهر لك هنا تلقائيًا.</div>
            </div>
          </>
        )}

        {tab === "products" && (
          <>
            <div className="dh-card">
              <div className="dh-title" style={{ marginBottom: 16 }}>أضف منتج جديد</div>
              {error && <div className="dh-error">{error}</div>}
              <form onSubmit={handleAddProduct}>
                <div className="dh-field">
                  <label>اسم المنتج</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="dh-field">
                  <label>السعر (ر.ع)</label>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div className="dh-field">
                  <label>التصنيف (مثل: قوالب، أيقونات، عروض تقديمية)</label>
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="عام" />
                </div>
                <div className="dh-field">
                  <label>وصف مختصر (اختياري)</label>
                  <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="dh-field">
                  <label>صور المنتج (حتى صورتين، اختياري)</label>
                  <div className="dh-images-row">
                    {productImages.map((url) => (
                      <div className="dh-image-thumb-wrap" key={url}>
                        <img src={url} alt="" className="dh-image-thumb" />
                        <button type="button" className="dh-image-remove" onClick={() => removeProductImage(url)}>✕</button>
                      </div>
                    ))}
                    {productImages.length < 2 && (
                      <label className="dh-image-add">
                        {imagesUploading ? "..." : "+"}
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleProductImageUpload} disabled={imagesUploading} />
                      </label>
                    )}
                  </div>
                  {imagesError && <div className="dh-error" style={{ marginTop: 8, marginBottom: 0 }}>{imagesError}</div>}
                </div>
                <div className="dh-field">
                  <label>نوع المنتج</label>
                  <div className="dh-type-toggle">
                    <button
                      type="button"
                      className={"dh-type-btn" + (productType === "file" ? " active" : "")}
                      onClick={() => setProductType("file")}
                    >
                      ملف
                    </button>
                    <button
                      type="button"
                      className={"dh-type-btn" + (productType === "code" ? " active" : "")}
                      onClick={() => setProductType("code")}
                    >
                      كود / ترخيص
                    </button>
                  </div>
                </div>
                {productType === "file" ? (
                  <div className="dh-field">
                    <label>رابط الملف (من Google Drive مثلًا)</label>
                    <input type="text" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://drive.google.com/..." />
                    <div className="dh-hint">تأكد إن مشاركة الملف مضبوطة على "أي شخص لديه الرابط"</div>
                  </div>
                ) : (
                  <div className="dh-field">
                    <label>الصقي الأكواد (كود بكل سطر)</label>
                    <textarea rows="5" value={codesText} onChange={(e) => setCodesText(e.target.value)} placeholder={"CODE-001\nCODE-002\nCODE-003"} style={{ direction: "ltr", textAlign: "right", fontFamily: "monospace" }} />
                    <div className="dh-hint">كل زبون ياخذ كود مختلف تلقائيًا. عدد الأسطر = عدد الأكواد المتوفرة.</div>
                  </div>
                )}
                <button className="dh-btn" type="submit" disabled={saving}>
                  {saving ? "جاري الحفظ..." : "حفظ المنتج"}
                </button>
              </form>
            </div>

            <div className="dh-card">
              <div className="dh-title-row">
                <div className="dh-title">منتجاتك</div>
                <div className="dh-title-count mono">{products.length} منتج</div>
              </div>
              {products.length === 0 && <div className="empty-note">ما أضفت أي منتج بعد.</div>}
              {products.map((p) => (
                <div className="dh-item" key={p.id}>
                  {editingId === p.id ? (
                    <div className="dh-edit-form">
                      <div className="dh-field">
                        <label>اسم المنتج</label>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                      </div>
                      <div className="dh-field">
                        <label>السعر (ر.ع)</label>
                        <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                      </div>
                      <div className="dh-field">
                        <label>التصنيف</label>
                        <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
                      </div>
                      <div className="dh-field">
                        <label>وصف مختصر</label>
                        <textarea rows="2" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                      </div>
                      {p.type !== "code" && (
                        <div className="dh-field">
                          <label>رابط الملف</label>
                          <input type="text" value={editFileUrl} onChange={(e) => setEditFileUrl(e.target.value)} />
                        </div>
                      )}
                      <div className="dh-edit-actions">
                        <button className="dh-item-action" onClick={cancelEdit} type="button">إلغاء</button>
                        <button className="dh-item-action primary" onClick={() => saveEdit(p.id)} disabled={editSaving} type="button">
                          {editSaving ? "جاري الحفظ..." : "حفظ"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="dh-item-top">
                        <span className="dh-item-name">{p.name}</span>
                        <span className="dh-item-price">{p.price} ر.ع</span>
                      </div>
                      {p.type === "code" && (
                        <div className="dh-item-stock">مخزون: {p.codesCount || 0} كود</div>
                      )}
                      <div className="dh-item-link">
                        <span className="dh-item-link-text">{`#product/${p.id}`}</span>
                        <button className="dh-item-link-btn" onClick={() => copyLink(p.id, "product")}>
                          {copied === "product" + p.id ? "تم" : "نسخ"}
                        </button>
                      </div>
                      <div className="dh-item-actions">
                        <button className="dh-item-action" onClick={() => startEdit(p)} type="button">تعديل</button>
                        {confirmDeleteId === p.id ? (
                          <button className="dh-item-action danger" onClick={() => confirmDelete(p.id)} disabled={deletingId === p.id} type="button">
                            {deletingId === p.id ? "جاري الحذف..." : "تأكيد الحذف؟"}
                          </button>
                        ) : (
                          <button className="dh-item-action danger" onClick={() => setConfirmDeleteId(p.id)} type="button">حذف</button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "coupons" && sellerPlan === "basic" && (
          <div className="dh-card" style={{ textAlign: "center", padding: "34px 20px" }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>🔒</div>
            <div className="dh-title" style={{ marginBottom: 8 }}>كوبونات الخصم متاحة من الباقة الاحترافية</div>
            <div className="dh-hint" style={{ marginBottom: 16 }}>رقّي باقتك عشان تقدر تسوي أكواد خصم لمنتجاتك.</div>
            <button className="dh-btn" onClick={() => setTab("subscription")} type="button" style={{ maxWidth: 220, margin: "0 auto" }}>
              شوف الباقات
            </button>
          </div>
        )}

        {tab === "coupons" && sellerPlan !== "basic" && (
          <>
            <div className="dh-card">
              <div className="dh-title" style={{ marginBottom: 16 }}>أضف كود خصم جديد</div>
              {couponError && <div className="dh-error">{couponError}</div>}
              <form onSubmit={handleAddCoupon}>
                <div className="dh-field">
                  <label>كود الخصم</label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="مثال: EID20"
                    style={{ direction: "ltr", textAlign: "right", fontFamily: "monospace" }}
                  />
                  <div className="dh-hint">أحرف إنجليزية وأرقام، بدون مسافات. العميل يكتب هذا الكود وقت الشراء.</div>
                </div>
                <div className="dh-field">
                  <label>نسبة الخصم (%)</label>
                  <input type="number" value={couponPercent} onChange={(e) => setCouponPercent(e.target.value)} placeholder="20" />
                </div>
                <div className="dh-field">
                  <label>ينطبق على</label>
                  <select value={couponScope} onChange={(e) => setCouponScope(e.target.value)}>
                    <option value="all">كل منتجاتك</option>
                    {products.map((p) => (
                      <option value={p.id} key={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <button className="dh-btn" type="submit" disabled={couponSaving}>
                  {couponSaving ? "جاري الحفظ..." : "إنشاء الكود"}
                </button>
              </form>
            </div>

            <div className="dh-card">
              <div className="dh-title-row">
                <div className="dh-title">أكوادك الحالية</div>
                <div className="dh-title-count mono">{coupons.length}</div>
              </div>
              {coupons.length === 0 && <div className="empty-note">ما أضفت أي كود خصم بعد.</div>}
              {coupons.map((c) => (
                <div className="cp-item" key={c.id}>
                  <div className="cp-item-top">
                    <span className="cp-code">{c.code}</span>
                    <span className="cp-percent">خصم {c.discountPercent}٪</span>
                  </div>
                  <div className="cp-scope">{couponScopeLabel(c)}</div>
                  <div className="dh-item-actions">
                    <button
                      className="dh-item-action danger"
                      disabled={deletingCouponId === c.id}
                      onClick={() => deleteCoupon(c.id)}
                    >
                      {deletingCouponId === c.id ? "جاري الحذف..." : "حذف الكود"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "orders" && <Orders ownerId={user.uid} />}

        {tab === "design" && (
          <>
            <div className="ds-preview">
              <div className="ds-preview-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{`monah-app.com/#store/${slug || user.uid.slice(0, 8) + "..."}`}</span>
                <a className="ds-view-btn" style={{ padding: "4px 10px", fontSize: 10 }} href={`#store/${slug || user.uid}`} target="_blank" rel="noopener noreferrer">
                  عرض المتجر ↗
                </a>
              </div>
              {coverUrl && (
                <div className="ds-cover-preview">
                  <img src={coverUrl} alt="غلاف المتجر" />
                </div>
              )}
              <div className="ds-preview-body">
                {logoUrl
                  ? <img src={logoUrl} alt="شعار المتجر" className="ds-preview-logo-img" />
                  : <div className="ds-preview-logo" style={{ background: storeColor }}>{initial}</div>}
                <div className="ds-preview-name" style={{ color: storeColor }}>{storeName || "اسم متجرك"}</div>
                <div className="ds-preview-tag">{tagline || "منتجات رقمية عبر Monah"}</div>
              </div>
            </div>

            <div className="dh-card">
              {designSaved && <div className="dh-success">تم حفظ تصميم متجرك.</div>}
              {error && <div className="dh-error">{error}</div>}

              <div className="dh-field">
                <label>غلاف المتجر (اختياري)</label>
                <div className="ds-cover-row">
                  {coverUrl
                    ? <img src={coverUrl} alt="" className="ds-cover-thumb" />
                    : <div className="ds-cover-placeholder">بدون غلاف</div>}
                  <label className="dh-logo-btn">
                    {coverUploading ? "جاري الرفع..." : "رفع صورة غلاف"}
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverUpload} disabled={coverUploading} />
                  </label>
                </div>
                <div className="dh-hint">صورة عريضة تظهر أعلى صفحة متجرك، فوق الشعار.</div>
                {coverError && <div className="dh-error" style={{ marginTop: 8, marginBottom: 0 }}>{coverError}</div>}
              </div>

              <div className="dh-field">
                <label>شعار المتجر</label>
                <div className="dh-logo-row">
                  {logoUrl
                    ? <img src={logoUrl} alt="" className="dh-logo-thumb" />
                    : <div className="dh-logo-placeholder">{initial}</div>}
                  <label className="dh-logo-btn">
                    {logoUploading ? "جاري الرفع..." : "رفع شعار جديد"}
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { handleLogoUpload(e); setDesignDirty(true); }} disabled={logoUploading} />
                  </label>
                </div>
                {logoError && <div className="dh-error" style={{ marginTop: 8, marginBottom: 0 }}>{logoError}</div>}
              </div>
              <div className="dh-field">
                <label>اسم المتجر</label>
                <input type="text" value={storeName} onChange={(e) => { setStoreName(e.target.value); setDesignDirty(true); }} />
              </div>
              <div className="dh-field">
                <label>عرّف الزوار بمتجرك في جملة واحدة</label>
                <input type="text" value={tagline} onChange={(e) => { setTagline(e.target.value); setDesignDirty(true); }} placeholder="مثال: قوالب وتصاميم تساعدك تنجز شغلك بشكل أسرع" />
              </div>
              <div className="dh-field">
                <label>اختر رابط متجرك</label>
                <input type="text" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugError(""); setDesignDirty(true); }} placeholder="hind" style={{ direction: "ltr", textAlign: "right" }} />
                {slugError && <div className="dh-error" style={{ marginTop: 8, marginBottom: 0 }}>{slugError}</div>}
                <div className="dh-hint">سيظهر متجرك على: monah-app.com/#store/{slug || "اسمك"}</div>
              </div>
              <div className="dh-field">
                <label>رقم واتساب (اختياري)</label>
                <input type="text" value={whatsapp} onChange={(e) => { setWhatsapp(e.target.value); setDesignDirty(true); }} placeholder="96891234567" style={{ direction: "ltr", textAlign: "right" }} />
              </div>
              <div className="dh-field">
                <label>حساب إنستغرام (اختياري)</label>
                <input type="text" value={instagram} onChange={(e) => { setInstagram(e.target.value); setDesignDirty(true); }} placeholder="username" style={{ direction: "ltr", textAlign: "right" }} />
              </div>
              <div className="dh-field">
                <label>لون المتجر الرئيسي</label>
                <div className="ds-swatches">
                  {COLORS.map((c) => (
                    <div
                      key={c}
                      className={"ds-swatch" + (storeColor === c ? " selected" : "")}
                      style={{ background: c }}
                      onClick={() => { setStoreColor(c); setDesignDirty(true); }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="ds-save-bar">
              <span className={"ds-save-status" + (designDirty ? " unsaved" : "")}>
                {designDirty ? "عندك تغييرات غير محفوظة" : "كل شي محفوظ"}
              </span>
              <button className="ds-save-btn" onClick={handleSaveDesign} disabled={designSaving}>
                {designSaving ? "جاري الحفظ..." : "حفظ ونشر التغييرات"}
              </button>
            </div>
          </>
        )}

        {tab === "subscription" && (
          <>
            <div className="dh-hint" style={{ marginBottom: 14, lineHeight: 1.9 }}>
              كل الباقات تشمل: {COMMON_FEATURES.join(" · ")}
            </div>
            {PACKAGES.map((pkg) => (
              <div className={"pk-card" + (pkg.id === "basic" ? " current" : "")} key={pkg.id}>
                {pkg.popular && <div className="pk-badge">الأكثر طلبًا</div>}
                <div className="pk-name">{pkg.name}</div>
                <div className="dh-hint" style={{ marginBottom: 10 }}>{pkg.desc}</div>
                <div className="pk-price">{pkg.price} <span>ر.ع / شهريًا</span></div>
                <div className="pk-features">
                  {pkg.features.map((f) => <div key={f}>✓ {f}</div>)}
                </div>
                {pkg.soon && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #E4E0D3" }}>
                    <div style={{ color: "#B9832F", fontSize: 10.5, fontWeight: 700, marginBottom: 4 }}>قادم قريبًا:</div>
                    {pkg.soon.map((f) => (
                      <div key={f} style={{ fontSize: 11.5, color: "#B0AC9C" }}>○ {f}</div>
                    ))}
                  </div>
                )}
                {pkg.id === "basic" && <div className="pk-current-tag">باقتك الحالية (تجريبية)</div>}
              </div>
            ))}
          </>
        )}

      </div>
    </div>
  );
}
