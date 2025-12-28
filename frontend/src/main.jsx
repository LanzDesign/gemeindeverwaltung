import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Version: 2025-11-28-v2
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
