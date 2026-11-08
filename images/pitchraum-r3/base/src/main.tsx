import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

/* Website & App: lokale Variable Fonts (OFL-1.1, @fontsource) */
import "@fontsource-variable/anybody/standard.css";
import "@fontsource-variable/instrument-sans/index.css";
import "@fontsource-variable/martian-mono/index.css";

import "./index.css";
import App from "./App";
import { AudioProvider } from "./audio/AudioProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AudioProvider>
      <App />
    </AudioProvider>
  </StrictMode>
);
