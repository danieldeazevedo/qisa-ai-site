import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Registrar Service Worker simples
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('SW registered'))
      .catch(() => console.log('SW registration failed'));
  });
}

createRoot(document.getElementById("root")!).render(<App />);
