// Polyfill para 'global' en el navegador
if (typeof window.global === "undefined") {
  window.global = window;
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
