import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection, addDoc, query, where, onSnapshot,
  serverTimestamp, doc, setDoc, getDoc
} from "firebase/firestore";

const COLORS = ["#16233F", "#4B6152", "#8B3A3A", "#5B4A8A", "#B9832F"];

const styles = `
  .dh-page{ min-height:100vh; background:#F6F3EC; font-family:'Cairo', sans-serif; }
  .mono{ font-family:'JetBrains Mono', monospace; }
  .dh-header{ display:flex; justify-content:space-between; align-items:center; padding:16px 20px; background:#FFFFFF; border-bottom:1px solid #E4E0D3; }
  .dh-brand{ font-family:'Almarai', sans-serif; font-weight:800; color:#16233F; font-size:16px; }
  .dh-brand span{ color:#8A8677; font-weight:600; font-size:11.5px; margin-right:6px; }
  .dh-logout{ border:1px solid #E4E0D3; padding:7px 13px; border-radius:8px; font-size:11px; color:#3D4A66; background:none; font-family:'Cairo',sans-serif; cursor:pointer; }

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
  .dh-field input, .dh-field textarea{ width:100%; padding:11px 13px; border:1px solid #E4E0D3; border-radius:8px; font-size:13px; background:#FBFAF7; font-family:'Cairo', sans-serif; box-sizing:border-box; }
  .dh-hint{ color:#8A8677; font-size:10.5px; margin-top:6px; line-height:1.6; }
  .dh-btn{ width:100%; background:#16233F; color:#fff; border:none; padding:13px; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer; }
  .dh-btn:disabled{ opacity:.6; }
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
  .ds-preview-name{ font-family:'Almarai',sans-serif; font-weight:800; font-size:14px; margin-bottom:4px; }
  .ds-preview-tag{ font-size:11px; color:#8A8677; }
  .ds-swatches{ display:flex; gap:10px; margin-bottom:16px; }
  .ds-swatch{ width:38px; height:38px; border-radius:10px; position:relative; border:2px solid transparent; cursor:pointer; }
  .ds-swatch.selected{ border-color:#16233F; }
  .ds-swatch.selected::after{ content:"✓"; position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#fff; font-size:13px; }

  .pk-card{ background:#FFFFFF; border:1px solid #E4E0D3; border-radius:14px; padding:18px; margin-bottom:12px; position:relative; }
  .pk-card.current{ border:2px solid #16233F; }
  .pk-badge{ position:absolute; top:-9px; right:16px; background:#B9832F; color:#fff; font-size:10px; font-weight:700; padding:3px 10px; border-radius:100px; }
  .pk-name{ font-family:'Almarai',sans-serif; font-weight:800; color:#16233F; font-size:14px; margin-bottom:4px; }
  .pk-price{ font-family:'JetBrains Mono',monospace; font-weight:700; color:#16233F; font-size:20px; margin-bottom:10px; }
  .pk-price span{ font-size:11px; color:#8A8677; font-family:'Cairo',sans-serif; }
  .pk-features div{ font-size:12px; color:#3D4A66; padding:3px 0; }
  .pk-current-tag{ display:inline-block; margin-top:10px; background:#EAF0EB; color:#4B6152; font-size:11px; font-weight:700; padding:5px 12px; border-radius:100px; }
`;

const PACKAGES = [
  { id: "basic", name: "أساسية", price: "3", features: ["حتى 10 منتجات", "رابط خاص لكل منتج", "تسليم تلقائي"] },
  { id: "pro", name: "احترافية", price: "6", popular: true, features: ["منتجات غير محدودة", "تخصيص شعار وألوان المتجر", "تقارير مبيعات مفصّلة"] },
  { id: "full", name: "متجر متكامل", price: "12", features: ["كل مميزات الاحترافية", "ربط دومينك الخاص", "دعم أولوية"] },
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
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState("");

  // store design
  const [storeName, setStoreName] = useState("");
  const [storeColor, setStoreColor] = useState(COLORS[0]);
  const [designSaved, setDesignSaved] = useState(false);
  const [designSaving, setDesignSaving] = useState(false);

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

  useEffect(() => {
    if (!user) return;
    async function loadStore() {
      const snap = await getDoc(doc(db, "stores", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setStoreName(data.name || "");
        setStoreColor(data.color || COLORS[0]);
      } else {
        setStoreName(user.email.split("@")[0]);
      }
    }
    loadStore();
  }, [user]);

  async function handleAddProduct(e) {
    e.preventDefault();
    setError("");
    if (!name || !price || !fileUrl) {
      setError("عبّي اسم المنتج والسعر ورابط الملف.");
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "products"), {
        ownerId: user.uid,
        name,
        price: Number(price),
        description: description || "",
        fileUrl,
        createdAt: serverTimestamp(),
      });
      setName("");
      setPrice("");
      setDescription("");
      setFileUrl("");
    } catch (err) {
      setError("صار خطأ، حاول مرة ثانية.");
    }
    setSaving(false);
  }

  async function handleSaveDesign() {
    setDesignSaving(true);
    setDesignSaved(false);
    try {
      await setDoc(doc(db, "stores", user.uid), {
        name: storeName,
        color: storeColor,
        ownerId: user.uid,
        updatedAt: serverTimestamp(),
      });
      setDesignSaved(true);
      setTimeout(() => setDesignSaved(false), 2000);
    } catch (err) {
      setError("تعذر حفظ التصميم، حاول مرة ثانية.");
    }
    setDesignSaving(false);
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

  const storeUrl = `${window.location.origin}${window.location.pathname}#store/${user.uid}`;
  const initial = (storeName || "م").charAt(0);

  return (
    <div className="dh-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <div className="dh-header">
        <div className="dh-brand">Monah <span>· {storeName || "متجرك"}</span></div>
        <button className="dh-logout" onClick={handleLogout}>تسجيل خروج</button>
      </div>

      <div className="dh-tabs">
        <button className={"dh-tab" + (tab === "overview" ? " active" : "")} onClick={() => setTab("overview")}>لوحة التحكم</button>
        <button className={"dh-tab" + (tab === "products" ? " active" : "")} onClick={() => setTab("products")}>المنتجات</button>
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
                <button className="dh-copy" onClick={() => copyLink(user.uid, "store")}>
                  {copied === "store" + user.uid ? "تم" : "نسخ"}
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
                  <label>وصف مختصر (اختياري)</label>
                  <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="dh-field">
                  <label>رابط الملف (من Google Drive مثلًا)</label>
                  <input type="text" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://drive.google.com/..." />
                  <div className="dh-hint">تأكد إن مشاركة الملف مضبوطة على "أي شخص لديه الرابط"</div>
                </div>
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
                  <div className="dh-item-top">
                    <span className="dh-item-name">{p.name}</span>
                    <span className="dh-item-price">{p.price} ر.ع</span>
                  </div>
                  <div className="dh-item-link">
                    <span className="dh-item-link-text">{`#product/${p.id}`}</span>
                    <button className="dh-item-link-btn" onClick={() => copyLink(p.id, "product")}>
                      {copied === "product" + p.id ? "تم" : "نسخ"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "design" && (
          <>
            <div className="ds-preview">
              <div className="ds-preview-bar">{`monah-app.com/#store/${user.uid.slice(0, 8)}...`}</div>
              <div className="ds-preview-body">
                <div className="ds-preview-logo" style={{ background: storeColor }}>{initial}</div>
                <div className="ds-preview-name" style={{ color: storeColor }}>{storeName || "اسم متجرك"}</div>
                <div className="ds-preview-tag">منتجات رقمية عبر Monah</div>
              </div>
            </div>

            <div className="dh-card">
              {designSaved && <div className="dh-success">تم حفظ تصميم متجرك.</div>}
              {error && <div className="dh-error">{error}</div>}
              <div className="dh-field">
                <label>اسم المتجر</label>
                <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
              </div>
              <div className="dh-field">
                <label>لون المتجر الرئيسي</label>
                <div className="ds-swatches">
                  {COLORS.map((c) => (
                    <div
                      key={c}
                      className={"ds-swatch" + (storeColor === c ? " selected" : "")}
                      style={{ background: c }}
                      onClick={() => setStoreColor(c)}
                    />
                  ))}
                </div>
              </div>
              <button className="dh-btn" onClick={handleSaveDesign} disabled={designSaving}>
                {designSaving ? "جاري الحفظ..." : "حفظ التصميم"}
              </button>
            </div>
          </>
        )}

        {tab === "subscription" && (
          <>
            {PACKAGES.map((pkg) => (
              <div className={"pk-card" + (pkg.id === "basic" ? " current" : "")} key={pkg.id}>
                {pkg.popular && <div className="pk-badge">الأكثر طلبًا</div>}
                <div className="pk-name">{pkg.name}</div>
                <div className="pk-price">{pkg.price} <span>ر.ع / شهريًا</span></div>
                <div className="pk-features">
                  {pkg.features.map((f) => <div key={f}>✓ {f}</div>)}
                </div>
                {pkg.id === "basic" && <div className="pk-current-tag">باقتك الحالية (تجريبية)</div>}
              </div>
            ))}
          </>
        )}

      </div>
    </div>
  );
                }
