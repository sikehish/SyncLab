import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
import { ClerkProvider } from "@clerk/clerk-react";

const client = AgoraRTC.createClient({ codec: "vp8", mode: "rtc" });

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      appearance={{
        elements: { unsafe_disableDevelopmentModeWarnings: true },
      }}
    >
      <AgoraRTCProvider client={client}>
        <App />
      </AgoraRTCProvider>
    </ClerkProvider>
  </StrictMode>
);
