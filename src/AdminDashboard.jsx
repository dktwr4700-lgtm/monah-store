import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

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
  .seller-top{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; cursor:pointer; }
  .seller-name{ font-weight:800; font-size:15px; }
  .seller-email{ color:#8A8677; font-size:12.5px; margin-top:2px; }
  .seller-meta{ display:flex; gap:14px; margin-top:10px; flex-wrap:wrap; }
  .seller-meta-item{ font-size:12px; color:#3D4A66; }
  .seller-meta-item b{ color:#16233F; }
  .seller-badge{ display:inline-block; font-size:11px; font-weight:700; padding:4px 10px; border-radius:100px; }
  .badge-active{ background:#EAF0EB; color:#4B6152; }
  .badge-disabled{ background:#F6E5E1; color:#B24C3A; }
  .badge-plan{ background:#F3EBDD; color:#B9832F; }
  .badge-expired{ background:#F6E5E1; color:#B24C3A; }
  .expiry-row{ display:flex; align-items:center; gap:8px; margin-top:12px; flex-wrap:wrap; }
  .expiry-row label{ font-size:11.5px; color:#625F55; font-weight:800; white-space:nowrap; }
  .expiry-row input{ border:1px solid #E4E0D3; border-radius:8px; padding:7px 9px; font:12.5px 'Cairo',sans-serif; background:#FBFAF7; color:#16233F; }
  .expiry-row button{ border:0; border-radius:8px; padding:7px 12px; font-size:11.5px; font-weight:700; background:#16233F; color:#fff; cursor:pointer; white-space:nowrap; }
  .expiry-row button:disabled{ opacity:.6; }
  .seller-actions{ display:flex; gap:8px; margin-top:14px; flex-wrap:wrap; }
  .seller-btn{ padding:8px 14px; border-radius:8px; font-size:12.5px; font-weight:700; cursor:pointer; border:1px solid #E4E0D3; background:#fff; color:#16233F; }
  .seller-btn.warn{ border-color:#E7C9C1; color:#B24C3A; }
  .seller-btn.danger{ background:#B24C3A; color:#fff; border:none; }

  .seller-expand-hint{ font-size:11.5px; color:#B9832F; font-weight:700; margin-top:8px; cursor:pointer; }

  .products-box{ margin-top:14px; padding-top:14px; border-top:1px dashed #E4E0D3; }
  .products-loading{ color:#8A8677; font-size:12.5px; padding:8px 0; }
  .product-row{ display:flex; justify-content:space-between; align-items:center; gap:10px; padding:9px 0; border-top:1px dashed #EFEBDE; }
  .product-row:first-child{ border-top:none; }
  .product-info{ flex:1; }
  .product-name{ font-size:13px; font-weight:700; color:#16233F; }
  .product-sub{ font-size:11px; color:#8A8677; margin-top:2px; }
  .product-del{ background:transparent; border:1px solid #E7C9C1; color:#B24C3A; border-radius:7px; padding:6px 11px; font-size:11.5px; font-weight:700; cursor:pointer; white-space:nowrap; }
  .product-del:disabled{ opacity:.6; }
  .products-empty{ color:#8A8677; font-size:12.5px; padding:8px 0; }

  .empty{ text-align:center; color:#8A8677; font-size:13.5px; padding:40px 0; }
  .loading{ text-align:center; color:#8A8677; font-size:13.5px; padding:40px 0; }

  .admin-tabs{ display:flex; gap:8px; margin-bottom:18px; }
  .admin-tab{ padding:9px 16px; border-radius:100px; font-size:12.5px; font-weight:700; border:1px solid #E4E0D3; background:#FFFFFF; color:#3D4A66; cursor:pointer; }
  .admin-tab.active{ background:#16233F; color:#fff; border-color:#16233F; }

  .ap-row{ background:#FFFFFF; border:1px solid #E4E0D3; border-radius:14px; padding:14px 16px; margin-bottom:10px; }
  .ap-top{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
  .ap-name{ font-weight:800; font-size:14px; color:#16233F; }
  .ap-sub{ color:#8A8677; font-size:11.5px; margin-top:3px; }
  .ap-owner{ color:#8A8677; font-size:11.5px; margin-top:6px; }
  .ap-owner b{ color:#3D4A66; }
  .badge-suspended{ background:#F3EBDD; color:#B9832F; }
  .ap-actions{ display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
  .invite-panel{ background:#FFFFFF; border:1px solid #E4E0D3; border-radius:16px; padding:18px; margin-bottom:14px; }
  .invite-title{ font-family:'Almarai',sans-serif; font-weight:800; font-size:15px; margin-bottom:5px; }.invite-sub{ color:#625F55; font-size:11.5px; line-height:1.75; margin-bottom:15px; }
  .invite-field{ margin-bottom:11px; }.invite-field label{ display:block; color:#625F55; font-size:11.5px; font-weight:800; margin-bottom:5px; }.invite-field input,.invite-field select{ width:100%; box-sizing:border-box; padding:11px 12px; border:1px solid #E4E0D3; border-radius:10px; background:#FBFAF7; color:#16233F; font:13px 'Cairo',sans-serif; }
  .invite-create{ width:100%; min-height:42px; border:0; border-radius:100px; background:#16233F; color:#fff; font:700 12.5px 'Cairo',sans-serif; cursor:pointer; }.invite-create:disabled{ opacity:.6; }.invite-message{ margin:0 0 12px; padding:9px 11px; border-radius:10px; font-size:11.5px; line-height:1.7; }.invite-message.error{ background:#F6E9E5; color:#A34839; }.invite-message.success{ background:#EAF0EB; color:#37724B; }
  .invite-link{ display:flex; align-items:center; gap:8px; border:1px solid #D8E5D8; background:#F5F9F4; border-radius:11px; padding:8px 9px; direction:ltr; }.invite-link code{ flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#22372C; font:10px 'JetBrains Mono',monospace; }.invite-copy{ flex-shrink:0; border:0; border-radius:8px; background:#16233F; color:#fff; padding:7px 10px; font:700 10.5px 'Cairo',sans-serif; cursor:pointer; }
  .invite-row{ background:#FFFFFF; border:1px solid #E4E0D3; border-radius:14px; padding:14px 16px; margin-bottom:10px; }.invite-row-top{ display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }.invite-name{ font-weight:800; font-size:14px; }.invite-email{ color:#625F55; font-size:11.5px; margin-top:3px; }.invite-meta{ color:#625F55; font-size:10.5px; margin-top:8px; }.badge-pending{ background:#F3EBDD; color:#8A5B18; }.badge-accepted{ background:#EAF0EB; color:#37724B; }.badge-revoked,.badge-expired{ background:#F6E9E5; color:#A34839; }
  @media (max-width:390px){.admin-wrap{padding:16px 14px 48px}.admin-header{margin-bottom:16px}.admin-tabs{overflow-x:auto;padding-bottom:2px}.admin-tab{white-space:nowrap;padding:8px 12px}.invite-panel,.invite-row{padding:14px}.invite-row-top{gap:8px}.seller-badge{flex-shrink:0}.invite-link{align-items:flex-start}.invite-copy{min-height:34px}}
`;

function planLabel(plan) {
  if (plan === "basic") return "أساسية";
  if (plan === "pro") return "احترافية";
  if (plan === "full") return "متجر متكامل";
  return "بدون باقة";
}

const STORE_TYPES = {
  books: "كتب رقمية",
  videos: "فيديوهات ودورات",
  codes: "أكواد وتراخيص",
  files: "ملفات وقوالب",
};

export default function AdminDashboard() {
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [expiryDrafts, setExpiryDrafts] = useState({});
  const [savingExpiryId, setSavingExpiryId] = useState(null);

  const [expandedId, setExpandedId] = useState(null);
  const [sellerProducts, setSellerProducts] = useState({});
  const [productsLoading, setProductsLoading] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);

  const [view, setView] = useState("sellers");
  const [allProducts, setAllProducts] = useState([]);
  const [allProductsLoading, setAllProductsLoading] = useState(false);
  const [allProductsLoaded, setAllProductsLoaded] = useState(false);
  const [busyProductId, setBusyProductId] = useState(null);
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [inviteStoreName, setInviteStoreName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStoreType, setInviteStoreType] = useState("files");
  const [inviteCreating, setInviteCreating] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [latestInviteUrl, setLatestInviteUrl] = useState("");
  const [revokingInviteId, setRevokingInviteId] = useState("");
  const [deletingInviteId, setDeletingInviteId] = useState("");

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
    loadInvites();
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

  async function inviteRequest(action, payload = {}) {
    const token = await currentUser.getIdToken();
    const response = await fetch("/api/merchant-invites", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "تعذر تنفيذ الدعوة الآن.");
    return data;
  }

  async function loadInvites() {
    setInvitesLoading(true);
    try {
      const data = await inviteRequest("list");
      setInvites(data.invites || []);
    } catch (error) {
      console.error(error);
    }
    setInvitesLoading(false);
  }

  async function createInvite(event) {
    event.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    setLatestInviteUrl("");
    setInviteCreating(true);
    try {
      const data = await inviteRequest("create", { storeName: inviteStoreName, email: inviteEmail, storeType: inviteStoreType });
      const link = `${window.location.origin}${window.location.pathname}#invite/${data.token}`;
      setLatestInviteUrl(link);
      setInviteSuccess("تم إنشاء الرابط. انسخه الآن وأرسله للتاجر؛ ينتهي بعد 3 أيام.");
      setInviteStoreName("");
      setInviteEmail("");
      setInviteStoreType("files");
      loadInvites();
    } catch (error) {
      setInviteError(error.message);
    }
    setInviteCreating(false);
  }

  async function copyInviteLink() {
    if (!latestInviteUrl) return;
    try {
      await navigator.clipboard.writeText(latestInviteUrl);
      setInviteSuccess("تم نسخ رابط الدعوة. أرسله للتاجر على واتساب.");
    } catch {
      setInviteError("تعذر النسخ تلقائيًا. انسخ الرابط يدويًا.");
    }
  }

  async function revokeInvite(invite) {
    if (!window.confirm(`تبي توقف دعوة ${invite.storeName}؟ الرابط لن يفتح بعد الآن.`)) return;
    setRevokingInviteId(invite.id);
    try {
      await inviteRequest("revoke", { inviteId: invite.id });
      setInvites((items) => items.map((item) => item.id === invite.id ? { ...item, status: "revoked" } : item));
    } catch (error) {
      setInviteError(error.message);
    }
    setRevokingInviteId("");
  }

  async function deleteInvite(invite) {
    if (!window.confirm(`تبي تحذف دعوة ${invite.storeName} نهائيًا؟ هذا يحذف سجل الدعوة فقط، ولا يحذف حساب التاجر لو كان فعّلها.`)) return;
    setDeletingInviteId(invite.id);
    try {
      await inviteRequest("delete", { inviteId: invite.id });
      setInvites((items) => items.filter((item) => item.id !== invite.id));
    } catch (error) {
      setInviteError(error.message);
    }
    setDeletingInviteId("");
  }

  function inviteStatusLabel(status) {
    if (status === "accepted") return "مفعّلة";
    if (status === "revoked") return "موقوفة";
    if (status === "expired") return "منتهية";
    return "بانتظار التفعيل";
  }

  function expiryDraftFor(seller) {
    return expiryDrafts[seller.id] ?? seller.subscriptionExpiresAt ?? "";
  }

  function isSubscriptionExpired(seller) {
    return Boolean(seller.subscriptionExpiresAt) && new Date(seller.subscriptionExpiresAt) < new Date();
  }

  async function saveSubscriptionExpiry(seller) {
    const value = expiryDraftFor(seller);
    setSavingExpiryId(seller.id);
    try {
      await updateDoc(doc(db, "sellers", seller.id), { subscriptionExpiresAt: value || null });
      setSellers((prev) =>
        prev.map((s) => (s.id === seller.id ? { ...s, subscriptionExpiresAt: value || null } : s))
      );
    } catch (e) {
      console.error(e);
    }
    setSavingExpiryId(null);
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

  async function toggleExpand(sellerId) {
    if (expandedId === sellerId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sellerId);
    if (sellerProducts[sellerId]) return;
    setProductsLoading(true);
    try {
      const q = query(collection(db, "products"), where("ownerId", "==", sellerId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSellerProducts((prev) => ({ ...prev, [sellerId]: list }));
    } catch (e) {
      console.error(e);
      setSellerProducts((prev) => ({ ...prev, [sellerId]: [] }));
    }
    setProductsLoading(false);
  }

  async function deleteProduct(sellerId, product) {
    const ok = window.confirm(`متأكد تبي تحذف منتج "${product.name}" نهائيًا؟`);
    if (!ok) return;
    setDeletingProductId(product.id);
    try {
      await deleteDoc(doc(db, "products", product.id));
      setSellerProducts((prev) => ({
        ...prev,
        [sellerId]: prev[sellerId].filter((p) => p.id !== product.id),
      }));
    } catch (e) {
      console.error(e);
    }
    setDeletingProductId(null);
  }

  async function loadAllProducts() {
    setAllProductsLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setAllProducts(list);
      setAllProductsLoaded(true);
    } catch (e) {
      console.error(e);
    }
    setAllProductsLoading(false);
  }

  function openProductsView() {
    setView("products");
    if (!allProductsLoaded) loadAllProducts();
  }

  async function toggleSuspendProduct(product) {
    setBusyProductId(product.id);
    try {
      await updateDoc(doc(db, "products", product.id), { suspended: !product.suspended });
      setAllProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, suspended: !p.suspended } : p))
      );
    } catch (e) {
      console.error(e);
    }
    setBusyProductId(null);
  }

  async function deleteAnyProduct(product) {
    const ok = window.confirm(`متأكد تبي تحذف منتج "${product.name}" نهائيًا؟`);
    if (!ok) return;
    setBusyProductId(product.id);
    try {
      await deleteDoc(doc(db, "products", product.id));
      setAllProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (e) {
      console.error(e);
    }
    setBusyProductId(null);
  }

  if (!authChecked) {
    return (
      <div className="admin-page">
        <style>{styles}</style>
        <div className="admin-denied">جاري التحقق...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="admin-page" dir="rtl" lang="ar">
        <style>{styles}</style>
        <div className="admin-denied">
          <div>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
            <b>سجّل دخولك أولًا</b>
            <p>ادخل بحساب مالك مُونة، وبعدها تقدر تدير دعوات التجار.</p>
            <a className="admin-logout" href="#login">تسجيل الدخول</a>
          </div>
        </div>
      </div>
    );
  }

  if (currentUser.email !== ADMIN_EMAIL) {
    return (
      <div className="admin-page" dir="rtl" lang="ar">
        <style>{styles}</style>
        <div className="admin-denied">
          <div>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
            <b>دخلت بحساب غير حساب المالك</b>
            <p>هذه الصفحة خاصة بصاحب مُونة. سجل خروج ثم ادخل بحساب المالك.</p>
            <button className="admin-logout" onClick={() => signOut(auth)}>تسجيل الخروج</button>
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

        <div className="admin-tabs">
          <button className={"admin-tab" + (view === "sellers" ? " active" : "")} onClick={() => setView("sellers")}>
            التجار
          </button>
          <button className={"admin-tab" + (view === "products" ? " active" : "")} onClick={openProductsView}>
            كل المنتجات
          </button>
          <button className={"admin-tab" + (view === "invites" ? " active" : "")} onClick={() => { setView("invites"); loadInvites(); }}>
            دعوات التجار
          </button>
        </div>

        {view === "sellers" && (
        <input
          className="admin-search"
          placeholder="ابحث باسم المتجر أو الإيميل..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        )}

        {view === "sellers" && loading && <div className="loading">جاري تحميل التجار...</div>}

        {view === "sellers" && !loading && filtered.length === 0 && (
          <div className="empty">ما فيه تجار مطابقين</div>
        )}

        {view === "sellers" && !loading &&
          filtered.map((s) => (
            <div className="seller-card" key={s.id}>
              <div className="seller-top" onClick={() => toggleExpand(s.id)}>
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
                {isSubscriptionExpired(s) && (
                  <span className="seller-badge badge-expired">منتهي الاشتراك</span>
                )}
              </div>

              <div className="expiry-row">
                <label htmlFor={`expiry-${s.id}`}>الاشتراك ساري لين:</label>
                <input
                  id={`expiry-${s.id}`}
                  type="date"
                  value={expiryDraftFor(s)}
                  onChange={(e) =>
                    setExpiryDrafts((prev) => ({ ...prev, [s.id]: e.target.value }))
                  }
                />
                <button
                  type="button"
                  disabled={savingExpiryId === s.id}
                  onClick={() => saveSubscriptionExpiry(s)}
                >
                  {savingExpiryId === s.id ? "جاري الحفظ..." : "حفظ التاريخ"}
                </button>
              </div>

              <div className="seller-expand-hint" onClick={() => toggleExpand(s.id)}>
                {expandedId === s.id ? "إخفاء المنتجات ▲" : "عرض المنتجات ▼"}
              </div>

              {expandedId === s.id && (
                <div className="products-box">
                  {productsLoading && !sellerProducts[s.id] && (
                    <div className="products-loading">جاري تحميل المنتجات...</div>
                  )}
                  {sellerProducts[s.id] && sellerProducts[s.id].length === 0 && (
                    <div className="products-empty">ما عنده أي منتج مضاف.</div>
                  )}
                  {sellerProducts[s.id] &&
                    sellerProducts[s.id].map((p) => (
                      <div className="product-row" key={p.id}>
                        <div className="product-info">
                          <div className="product-name">{p.name}</div>
                          <div className="product-sub">
                            {p.price} ر.ع · {p.category || "عام"} · {p.type === "code" ? "كود/ترخيص" : "ملف"}
                          </div>
                        </div>
                        <button
                          className="product-del"
                          disabled={deletingProductId === p.id}
                          onClick={() => deleteProduct(s.id, p)}
                        >
                          {deletingProductId === p.id ? "جاري الحذف..." : "حذف"}
                        </button>
                      </div>
                    ))}
                </div>
              )}

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

        {view === "products" && (
          <>
            {allProductsLoading && <div className="loading">جاري تحميل كل المنتجات...</div>}
            {!allProductsLoading && allProducts.length === 0 && (
              <div className="empty">ما فيه منتجات بالمنصة لسا</div>
            )}
            {!allProductsLoading &&
              allProducts.map((p) => {
                const owner = sellers.find((s) => s.id === p.ownerId);
                return (
                  <div className="ap-row" key={p.id}>
                    <div className="ap-top">
                      <div>
                        <div className="ap-name">{p.name}</div>
                        <div className="ap-sub">
                          {p.price} ر.ع · {p.category || "عام"} · {p.type === "code" ? "كود/ترخيص" : "ملف"}
                        </div>
                        <div className="ap-owner">
                          التاجر: <b>{owner ? (owner.storeName || owner.email) : p.ownerId}</b>
                        </div>
                      </div>
                      {p.suspended && <span className="seller-badge badge-suspended">معلّق</span>}
                    </div>
                    <div className="ap-actions">
                      <button
                        className="seller-btn warn"
                        disabled={busyProductId === p.id}
                        onClick={() => toggleSuspendProduct(p)}
                      >
                        {p.suspended ? "إلغاء التعليق" : "تعليق مؤقت"}
                      </button>
                      <button
                        className="seller-btn danger"
                        disabled={busyProductId === p.id}
                        onClick={() => deleteAnyProduct(p)}
                      >
                        حذف نهائي
                      </button>
                    </div>
                  </div>
                );
              })}
          </>
        )}

        {view === "invites" && (
          <>
            <form className="invite-panel" onSubmit={createInvite}>
              <div className="invite-title">دعوة تاجر جديد</div>
              <div className="invite-sub">اختر نوع متجره ثم أرسل له الرابط. التاجر يحدد كلمة مروره بنفسه، والرابط يستخدم مرة واحدة.</div>
              {inviteError && <div className="invite-message error">{inviteError}</div>}
              {inviteSuccess && <div className="invite-message success">{inviteSuccess}</div>}
              {latestInviteUrl && <div className="invite-link"><code>{latestInviteUrl}</code><button className="invite-copy" type="button" onClick={copyInviteLink}>نسخ الرابط</button></div>}
              <div className="invite-field"><label>اسم المتجر</label><input value={inviteStoreName} onChange={(event) => setInviteStoreName(event.target.value)} placeholder="مثال: متجر هند للتصاميم" required /></div>
              <div className="invite-field"><label>بريد التاجر</label><input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="name@example.com" required /></div>
              <div className="invite-field"><label>ماذا يبيع؟</label><select value={inviteStoreType} onChange={(event) => setInviteStoreType(event.target.value)}>{Object.entries(STORE_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <button className="invite-create" type="submit" disabled={inviteCreating}>{inviteCreating ? "جاري إنشاء الرابط..." : "إنشاء رابط دعوة"}</button>
            </form>

            {invitesLoading && <div className="loading">جاري تحميل الدعوات...</div>}
            {!invitesLoading && invites.length === 0 && <div className="empty">ما فيه دعوات حتى الآن.</div>}
            {!invitesLoading && invites.map((invite) => <div className="invite-row" key={invite.id}>
              <div className="invite-row-top"><div><div className="invite-name">{invite.storeName}</div><div className="invite-email">{invite.email}</div></div><span className={`seller-badge badge-${invite.status}`}>{inviteStatusLabel(invite.status)}</span></div>
              <div className="invite-meta">{STORE_TYPES[invite.storeType] || "منتجات رقمية"} · تنتهي {invite.expiresAt ? new Date(invite.expiresAt).toLocaleDateString("ar") : "—"}</div>
              <div className="seller-actions">
                {invite.status === "pending" && <button className="seller-btn warn" type="button" onClick={() => revokeInvite(invite)} disabled={revokingInviteId === invite.id}>{revokingInviteId === invite.id ? "جاري الإيقاف..." : "إيقاف الدعوة"}</button>}
                <button className="seller-btn danger" type="button" onClick={() => deleteInvite(invite)} disabled={deletingInviteId === invite.id}>{deletingInviteId === invite.id ? "جاري الحذف..." : "حذف الدعوة نهائيًا"}</button>
              </div>
            </div>)}
          </>
        )}
      </div>
    </div>
  );
}
