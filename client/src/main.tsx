import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializePWA } from "./lib/pwa";

// Inicializar PWA
initializePWA().catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);
