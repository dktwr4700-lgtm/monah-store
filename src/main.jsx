import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

const Register = lazy(() => import("./Register.jsx"));
const Login = lazy(() => import("./Login.jsx"));
const Dashboard = lazy(() => import("./Dashboard.jsx"));
const ProductPage = lazy(() => import("./ProductPage.jsx"));
const Purchases = lazy(() => import("./Purchases.jsx"));
const StorePage = lazy(() => import("./StorePage.jsx"));
const LegalPage = lazy(() => import("./LegalPage.jsx"));
const AdminDashboard = lazy(() => import("./AdminDashboard.jsx"));
const InviteActivation = lazy(() => import("./InviteActivation.jsx"));
const Receipt = lazy(() => import("./Receipt.jsx"));
const BundlePage = lazy(() => import("./BundlePage.jsx"));
const Deliver = lazy(() => import("./Deliver.jsx"));
const PayResult = lazy(() => import("./PayResult.jsx"));
const StartStore = lazy(() => import("./StartStore.jsx"));
const StorePayResult = lazy(() => import("./StorePayResult.jsx"));

const LAZY_PAGE_IMPORTS = [
  () => import("./Register.jsx"),
  () => import("./Login.jsx"),
  () => import("./Dashboard.jsx"),
  () => import("./ProductPage.jsx"),
  () => import("./Purchases.jsx"),
  () => import("./StorePage.jsx"),
  () => import("./LegalPage.jsx"),
  () => import("./AdminDashboard.jsx"),
  () => import("./InviteActivation.jsx"),
  () => import("./Receipt.jsx"),
  () => import("./BundlePage.jsx"),
  () => import("./Deliver.jsx"),
  () => import("./PayResult.jsx"),
  () => import("./StartStore.jsx"),
  () => import("./StorePayResult.jsx"),
];

// كل صفحة غير الرئيسية محمّلة كقطعة منفصلة (code-split)، فأول دخول لها يطلب ملفها
// عبر الشبكة ويعرض شاشة "جاري التحميل" قبل ما تظهر الصفحة الحقيقية — وهذا يحس
// المستخدم إن المحتوى "يقفز" مع كل تنقل. نبدأ بتحميل كل الصفحات بصمت في الخلفية
// بعد ما الصفحة الرئيسية تجهز، عشان لما يضغط أي رابط يكون ملفها جاهز مسبقًا
// والانتقال يصير فوري بدون شاشة تحميل ولا قفزة.
function prefetchLazyPages() {
  const run = () => LAZY_PAGE_IMPORTS.forEach((load) => load().catch(() => {}));
  if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 1200);
}

// بعض بوابات الدفع تضيف query string بعد الرجوع من صفحة الدفع (مثل
// #pay-result/xxx?foo=bar)، وبما إن التوجيه هنا يعتمد على قص الـ hash بالفواصل،
// أي جزء زائد بعد "؟" يصير جزء من المعرّف نفسه ويكسر التحقق. هذي الدالة تتأكد
// كل معرّف نستخرجه من الرابط نظيف من أي شي بعد "?" أو "#" قبل ما نستخدمه.
function hashSegment(hash, index) {
  return (hash.split("/")[index] || "").split(/[?#]/)[0];
}

function PageLoading() {
  return <div dir="rtl" style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Cairo, sans-serif", color: "#4B6152", background: "#FBFAF7" }}>جاري التحميل…</div>;
}

const CHUNK_RELOAD_KEY = "monah-chunk-reload-attempted";

function isChunkLoadError(error) {
  const message = String(error?.message || "");
  return /dynamically imported module|Importing a module script failed|Failed to fetch dynamically imported module|ChunkLoadError/i.test(message);
}

// جهاز الزائر يفتح الموقع قبل نشر تحديث جديد يبقى محمّل بنسخة قديمة من الكود،
// وملفات الصفحات غير الرئيسية (Dashboard، StorePage...) صارت مبنية بأسماء ملفات
// جديدة بعد النشر — أي محاولة تحميل صفحة غير محمّلة أصلًا تفشل بخطأ شبكي بدل ما
// تفتح الصفحة، ومافيه أي شيء يمسك هذا الخطأ فيضل الزائر على شاشة فاضية أو مكسورة
// لين يعرف بنفسه إنه يقفل التطبيق ويفتحه من جديد. نمسك تحديدًا خطأ تحميل الملف
// (مو أي خطأ تطبيق آخر) ونعيد تحميل الصفحة مرة وحدة تلقائيًا؛ الحارس بـ
// sessionStorage يمنع حلقة تحديث لا نهائية لو المشكلة شي ثاني غير تحديث النشر.
class ChunkRecoveryBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { chunkError: false, otherError: null };
  }

  static getDerivedStateFromError(error) {
    if (isChunkLoadError(error)) return { chunkError: true };
    return { otherError: error };
  }

  componentDidCatch(error) {
    if (!isChunkLoadError(error)) return;
    let alreadyTried = false;
    try {
      alreadyTried = sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";
      if (!alreadyTried) sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    } catch {
      // خصوصية المتصفح ممكن تمنع sessionStorage؛ نكمل بدون الحارس بدل ما نكسر الصفحة.
    }
    if (!alreadyTried) window.location.reload();
  }

  render() {
    if (this.state.otherError) throw this.state.otherError;
    if (this.state.chunkError) {
      return (
        <div dir="rtl" style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Cairo, sans-serif", color: "#153A2C", background: "#FBFAF7", padding: 24, textAlign: "center" }}>
          <div>
            <p style={{ marginBottom: 16, fontSize: 14 }}>صدر تحديث جديد للموقع. حدّث الصفحة عشان تفتح آخر نسخة.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{ padding: "12px 24px", borderRadius: 100, border: "none", background: "#153A2C", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
            >
              تحديث الصفحة الآن
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Root() {
  const [hash, setHash] = React.useState(window.location.hash.replace("#", ""));

  React.useEffect(() => {
    const onHashChange = () => setHash(window.location.hash.replace("#", ""));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  let page = <App />;
  if (hash === "register") page = <Register />;
  else if (hash === "login") page = <Login />;
  else if (hash === "dashboard" || hash.startsWith("dashboard/")) page = <Dashboard />;
  else if (hash === "privacy") page = <LegalPage type="privacy" />;
  else if (hash === "terms") page = <LegalPage type="terms" />;
  else if (hash === "admin") page = <AdminDashboard />;
  else if (hash.startsWith("invite/")) page = <InviteActivation token={hashSegment(hash, 1)} />;
  else if (hash.startsWith("product/")) page = <ProductPage productId={hashSegment(hash, 1)} />;
  else if (hash.startsWith("bundle/")) page = <BundlePage bundleId={hashSegment(hash, 1)} />;
  else if (hash === "purchases" || hash.startsWith("purchases/")) page = <Purchases ownerId={hashSegment(hash, 1) || undefined} />;
  else if (hash.startsWith("receipt/")) page = <Receipt orderId={hashSegment(hash, 1)} token={hashSegment(hash, 2)} />;
  else if (hash.startsWith("deliver/")) page = <Deliver orderId={hashSegment(hash, 1)} token={hashSegment(hash, 2)} />;
  else if (hash.startsWith("pay-result/")) page = <PayResult orderId={hashSegment(hash, 1)} />;
  else if (hash === "start-store") page = <StartStore />;
  else if (hash.startsWith("store-pay-result/")) page = <StorePayResult param={hashSegment(hash, 1)} />;
  else if (hash.startsWith("store/")) page = <StorePage sellerId={hashSegment(hash, 1)} />;
  return (
    <ChunkRecoveryBoundary key={hash}>
      <Suspense fallback={<PageLoading />}>{page}</Suspense>
    </ChunkRecoveryBoundary>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

prefetchLazyPages();
