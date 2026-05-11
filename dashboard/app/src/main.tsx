import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { FilterProvider } from "@/context/FilterContext";
import "./styles/tokens.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <FilterProvider>
        <App />
      </FilterProvider>
    </HashRouter>
  </React.StrictMode>,
);
