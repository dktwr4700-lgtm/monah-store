import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

const ADMIN_EMAIL = "k1997551@gmail.com";

const styles = `
  .admin-page{ min-height:100vh; background:#F6F3EC; font-family:'Cairo', sans-serif; color:#16233F; }
  .admin-page *{ box-sizing:border-box; }
  .admin-wrap{ max-width:960px; margin:0 auto; padding:24px 20px 60px; }
  .admin-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
  .admin-title{ font-family:'Almarai', sans-serif; font-weight:800; font-size:22px; }
  .admin-logout{ background:transparent; border:1px solid #E4E0D3; border-radius:9px; padding:9px 16px; font-size:13px; font-weight:700; color:#16233F; cursor:pointer; }

  .admin-denied{ display:flex; align-items:center; justify-content:center; min-height:100vh; text-align:center; padding:20px; }
  .admin-denied p{ color:#8A8677; font-size:14px; margin-top:8px; }

  .admin-stats{ display:flex; gap:12px; margin-bottom:24px; flex-wrap:wrap; }
  .admin-stat{ flex:1; min-width:140px; background:#FFFFFF; border:1px solid #E4E0D3; border-radius:14px; padding:16px 18px; }
  .admin-stat b{ display:block; font-family:'Almarai', sans-serif; font-weight:800; font-size:22px; }
  .admin-stat span{ color:#8A8677; font-size:12.5px; }

  .admin-search{ width:100%; padding:12px 14px; border:1px solid #E4E0D3; border-radius:10px; font-size:13.5px; font-family:'Cairo',sans-serif; margin-bottom:16px; background:#fff; color:#16233F; }

  .seller-card{ background:#FFFFFF; border:1px solid #E4E0D3; border-radius:14px; padding:16px 18px; margin-bottom:10px; }
  .seller-top{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
  .seller-name{ font-weight:800; font-size:15px; }
  .seller-email{ color:#8A8677; font-size:12.5px; margin-top:2px; }
  .seller-meta{ display:flex; gap:14px; margin-top:10px; flex-wrap:wrap; }
  .seller-meta-item{ font-size:12px; color:#3D4A66; }
  .seller-meta-item b{ color:#16233F; }
  .seller-badge{ display:inline-block; font-size:11px; font-weight:700; padding:4px 10px; border-radius:100px; }
  .badge-active{ background:#EAF0EB; color:#4B6152; }
  .badge-disabled{ background:#F6E5E1; color:#B24C3A; }
  .badge-plan{ background:#F3EBDD; color:#B9832F; }
  .seller-actions{ display:flex; gap:8px; margin-top:14px; flex-wrap:wrap; }
  .seller-btn{ padding:8px 14px; border-radius:8px; font-size:12.5px; font-weight:700; cursor:pointer; border:1px solid #E4E0D3; background:#fff; color:#16233F; }
  .seller-btn.warn{ border-color:#E7C9C1; color:#B24C3A; }
  .seller-btn.danger{ background:#B24C3A; color:#fff; border:none; }

  .empty{ text-align:center; color:#8A8677; font-size:13.5px; padding:40px 0; }
  .loading{ text-align:center; color:#8A8677; font-size:13.5px; padding:40px 0; }
`;

function planLabel(plan) {
  if (plan === "basic") return "أساسية";
  if (plan === "pro") return "احترافية";
  if (plan === "full") return "متجر متكامل";
  return "بدون باقة";
}

export default function AdminDashboard() {
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authChecked || !currentUser || currentUser.email !== ADMIN_EMAIL) return;
    loadSellers();
  }, [authChecked, currentUser]);

  async function loadSellers() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "sellers"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setSellers(list);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function toggleDisabled(seller) {
    setBusyId(seller.id);
    try {
      await updateDoc(doc(db, "sellers", seller.id), { disabled: !seller.disabled });
      setSellers((prev) =>
        prev.map((s) => (s.id === seller.id ? { ...s, disabled: !s.disabled } : s))
      );
    } catch (e) {
      console.error(e);
    }
    setBusyId(null);
  }

  async function deleteSeller(seller) {
    const ok = window.confirm(
      `متأكد تبي تحذف حساب "${seller.storeName || seller.email}" نهائيًا؟ هذا الإجراء ما يترجع.`
    );
    if (!ok) return;
    setBusyId(seller.id);
    try {
      await deleteDoc(doc(db, "sellers", seller.id));
      setSellers((prev) => prev.filter((s) => s.id !== seller.id));
    } catch (e) {
      console.error(e);
    }
    setBusyId(null);
  }

  if (!authChecked) {
    return (
      <div className="admin-page">
        <style>{styles}</style>
        <div className="admin-denied">جاري التحقق...</div>
      </div>
    );
  }

  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    return (
      <div className="admin-page" dir="rtl" lang="ar">
        <style>{styles}</style>
        <div className="admin-denied">
          <div>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
            <b>ما عندك صلاحية دخول هذي الصفحة</b>
            <p>هذي الصفحة خاصة بصاحب المنصة فقط.</p>
          </div>
        </div>
      </div>
    );
  }

  const filtered = sellers.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.storeName || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q)
    );
  });

  const activeCount = sellers.filter((s) => !s.disabled).length;
  const disabledCount = sellers.filter((s) => s.disabled).length;

  return (
    <div className="admin-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <div className="admin-wrap">
        <div className="admin-header">
          <div className="admin-title">لوحة تحكم الأدمن</div>
          <button className="admin-logout" onClick={() => signOut(auth)}>
            تسجيل الخروج
          </button>
        </div>

        <div className="admin-stats">
          <div className="admin-stat">
            <b>{sellers.length}</b>
            <span>إجمالي التجار</span>
          </div>
          <div className="admin-stat">
            <b>{activeCount}</b>
            <span>حسابات نشطة</span>
          </div>
          <div className="admin-stat">
            <b>{disabledCount}</b>
            <span>حسابات موقوفة</span>
          </div>
        </div>

        <input
          className="admin-search"
          placeholder="ابحث باسم المتجر أو الإيميل..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading && <div className="loading">جاري تحميل التجار...</div>}

        {!loading && filtered.length === 0 && (
          <div className="empty">ما فيه تجار مطابقين</div>
        )}

        {!loading &&
          filtered.map((s) => (
            <div className="seller-card" key={s.id}>
              <div className="seller-top">
                <div>
                  <div className="seller-name">{s.storeName || "بدون اسم"}</div>
                  <div className="seller-email">{s.email}</div>
                </div>
                <span className={"seller-badge " + (s.disabled ? "badge-disabled" : "badge-active")}>
                  {s.disabled ? "موقوف" : "نشط"}
                </span>
              </div>

              <div className="seller-meta">
                <span className="seller-meta-item">
                  الباقة: <b><span className="seller-badge badge-plan">{planLabel(s.plan)}</span></b>
                </span>
                <span className="seller-meta-item">
                  تاريخ التسجيل: <b>{s.createdAt ? new Date(s.createdAt).toLocaleDateString("ar") : "—"}</b>
                </span>
              </div>

              <div className="seller-actions">
                <button
                  className="seller-btn warn"
                  disabled={busyId === s.id}
                  onClick={() => toggleDisabled(s)}
                >
                  {s.disabled ? "إعادة تفعيل الحساب" : "إيقاف الحساب"}
                </button>
                <button
                  className="seller-btn danger"
                  disabled={busyId === s.id}
                  onClick={() => deleteSeller(s)}
                >
                  حذف نهائي
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
