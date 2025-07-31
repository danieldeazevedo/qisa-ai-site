import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ClientPingService } from "./services/ping-client";

// Start client-side ping service for Vercel keep-alive
const clientPingService = ClientPingService.getInstance();
clientPingService.start();

// Add activity listeners to ping on user interaction
window.addEventListener('click', () => clientPingService.pingOnActivity());
window.addEventListener('keydown', () => clientPingService.pingOnActivity());
window.addEventListener('scroll', () => clientPingService.pingOnActivity());

createRoot(document.getElementById("root")!).render(<App />);
