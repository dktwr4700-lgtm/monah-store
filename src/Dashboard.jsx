import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from "firebase/firestore";

const styles = `
  .dash-page{ min-height:100vh; background:#F7F6F2; font-family:'Cairo', sans-serif; }
  .dash-header{ display:flex; justify-content:space-between; align-items:center; padding:16px 20px; background:#FFFFFF; border-bottom:1px solid #eee; }
  .dash-brand{ font-family:'Almarai', sans-serif; font-weight:800; color:#16233F; font-size:20px; }
  .dash-logout{ background:none; border:1px solid #ddd; padding:8px 14px; border-radius:8px; font-size:13px; cursor:pointer; }
  .dash-wrap{ max-width:640px; margin:0 auto; padding:20px; }
  .dash-card{ background:#FFFFFF; border-radius:14px; padding:20px; margin-bottom:16px; border:1px solid #eee; }
  .dash-title{ font-family:'Almarai', sans-serif; font-weight:800; font-size:17px; color:#16233F; margin-bottom:14px; }
  .dash-field{ margin-bottom:12px; }
  .dash-field label{ display:block; font-size:12.5px; color:#66655C; margin-bottom:6px; }
  .dash-field input{ width:100%; padding:12px 14px; border:1px solid #ddd; border-radius:8px; font-size:14px; box-sizing:border-box; }
  .dash-btn{ width:100%; background:#16233F; color:#fff; border:none; padding:13px; border-radius:8px; font-weight:700; font-size:14px; cursor:pointer; }
  .dash-btn:disabled{ opacity:.6; }
  .dash-error{ background:#F6E9E5; color:#B24C3A; padding:10px 14px; border-radius:8px; font-size:13px; margin-bottom:12px; }
  .product-item{ display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #f0f0f0; }
  .product-item:last-child{ border-bottom:none; }
  .product-name{ font-weight:700; color:#16233F; font-size:14.5px; }
  .product-price{ color:#C7902E; font-weight:700; font-size:14px; }
  .empty-note{ color:#999; font-size:13.5px; text-align:center; padding:20px 0; }
`;

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "products"), where("ownerId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  async function handleAddProduct(e) {
    e.preventDefault();
    setError("");
    if (!name || !price) {
      setError("عبّي اسم المنتج والسعر.");
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "products"), {
        ownerId: user.uid,
        name,
        price: Number(price),
        fileUrl: fileUrl || "",
        createdAt: serverTimestamp(),
      });
      setName("");
      setPrice("");
      setFileUrl("");
    } catch (err) {
      setError("صار خطأ، حاول مرة ثانية.");
    }
    setSaving(false);
  }

  function handleLogout() {
    signOut(auth).then(() => {
      window.location.hash = "login";
    });
  }

  if (checking) return null;

  return (
    <div className="dash-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <div className="dash-header">
        <div className="dash-brand">Monah</div>
        <button className="dash-logout" onClick={handleLogout}>تسجيل خروج</button>
      </div>
      <div className="dash-wrap">
        <div className="dash-card">
          <div className="dash-title">أضف منتج جديد</div>
          {error && <div className="dash-error">{error}</div>}
          <form onSubmit={handleAddProduct}>
            <div className="dash-field">
              <label>اسم المنتج</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="dash-field">
              <label>السعر (ر.ع)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="dash-field">
              <label>رابط الملف (اختياري حاليًا)</label>
              <input type="text" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="رابط تحميل الملف" />
            </div>
            <button className="dash-btn" type="submit" disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ المنتج"}
            </button>
          </form>
        </div>

        <div className="dash-card">
          <div className="dash-title">منتجاتك ({products.length})</div>
          {products.length === 0 && <div className="empty-note">ما أضفت أي منتج بعد.</div>}
          {products.map((p) => (
            <div className="product-item" key={p.id}>
              <span className="product-name">{p.name}</span>
              <span className="product-price">{p.price} ر.ع</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
