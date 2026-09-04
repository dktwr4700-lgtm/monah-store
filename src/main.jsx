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

function PageLoading() {
  return <div dir="rtl" style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Cairo, sans-serif", color: "#4B6152", background: "#FBFAF7" }}>جاري التحميل…</div>;
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
  else if (hash.startsWith("invite/")) page = <InviteActivation token={hash.split("/")[1]} />;
  else if (hash.startsWith("product/")) page = <ProductPage productId={hash.split("/")[1]} />;
  else if (hash.startsWith("bundle/")) page = <BundlePage bundleId={hash.split("/")[1]} />;
  else if (hash === "purchases") page = <Purchases />;
  else if (hash.startsWith("receipt/")) page = <Receipt orderId={hash.split("/")[1]} token={hash.split("/")[2]} />;
  else if (hash.startsWith("deliver/")) page = <Deliver orderId={hash.split("/")[1]} token={hash.split("/")[2]} />;
  else if (hash.startsWith("pay-result/")) page = <PayResult orderId={hash.split("/")[1]} />;
  else if (hash.startsWith("store/")) page = <StorePage sellerId={hash.split("/")[1]} />;
  return <Suspense fallback={<PageLoading />}>{page}</Suspense>;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
