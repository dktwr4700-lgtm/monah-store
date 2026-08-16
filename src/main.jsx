import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Register from "./Register.jsx";
import Login from "./Login.jsx";
import Dashboard from "./Dashboard.jsx";

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
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
