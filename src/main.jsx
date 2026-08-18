import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Register from "./Register.jsx";
import Login from "./Login.jsx";
import Dashboard from "./Dashboard.jsx";
import ProductPage from "./ProductPage.jsx";
import StorePage from "./StorePage.jsx";
import LegalPage from "./LegalPage.jsx";
import AdminDashboard from "./AdminDashboard.jsx";

function Root() {
  const [hash, setHash] = React.useState(window.location.hash.replace("#", ""));

  React.useEffect(() => {
    const onHashChange = () => setHash(window.location.hash.replace("#", ""));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (hash === "register") return <Register />;
  if (hash === "login") return <Login />;
  if (hash === "dashboard") return <Dashboard />;
  if (hash === "privacy") return <LegalPage type="privacy" />;
  if (hash === "terms") return <LegalPage type="terms" />;
  if (hash === "admin") return <AdminDashboard />;
  if (hash.startsWith("product/")) return <ProductPage productId={hash.split("/")[1]} />;
  if (hash.startsWith("store/")) return <StorePage sellerId={hash.split("/")[1]} />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
