import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthRoot } from "./lib/auth";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthRoot>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthRoot>
  </StrictMode>
);
