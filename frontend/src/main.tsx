import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import AgoraRTC, { AgoraRTCProvider } from 'agora-rtc-react'

const client =  AgoraRTC.createClient({ codec: "vp8", mode: "rtc" });


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AgoraRTCProvider client={client}>
    <App />
    </AgoraRTCProvider>
  </StrictMode>,
)
