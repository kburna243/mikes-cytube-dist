import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

/* Lokale OFL-Schriften über @fontsource (nur Latin, keine Google Fonts) */
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/space-grotesk/latin-400.css";
import "@fontsource/space-grotesk/latin-500.css";
import "@fontsource/space-grotesk/latin-700.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "@fontsource/fraunces/latin-400.css";
import "@fontsource/fraunces/latin-700.css";
import "@fontsource/playfair-display/latin-400.css";
import "@fontsource/playfair-display/latin-700.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/work-sans/latin-400.css";
import "@fontsource/work-sans/latin-600.css";
import "@fontsource/bebas-neue/latin-400.css";
import "@fontsource/archivo/latin-400.css";
import "@fontsource/archivo/latin-800.css";

import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
