import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// index.css MÅSTE importeras före App: den innehåller basen (variabler, reset,
// element- och .card-regler) som komponenternas egna CSS-filer bygger vidare på.
// Vite emitterar CSS i modulernas evalueringsordning, så byter man plats på de
// här två raderna hamnar komponent-CSS:en först och basen skriver över den.
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
