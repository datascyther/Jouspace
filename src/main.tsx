import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OverlayStackProvider } from "./hooks/useFocusTrap";
import { KeyboardProvider } from "./hooks/useAdaptiveKeyboard";
import { applyTheme, resolveTheme, readTheme } from "./hooks/useTheme";

// Apply persisted theme before first paint to avoid a flash of light mode.
applyTheme(resolveTheme(readTheme()));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <OverlayStackProvider>
        <KeyboardProvider>
          <App />
        </KeyboardProvider>
      </OverlayStackProvider>
    </ErrorBoundary>
  </StrictMode>
);
