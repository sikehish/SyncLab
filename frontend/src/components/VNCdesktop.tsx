import { useEffect, useRef, useState } from "react";
import { VncScreen } from "react-vnc";

interface Props {
  websockifyPort: number;
  createdRoomId: string;
  roomId: string;
}

function VNCdesktop({ websockifyPort, createdRoomId, roomId }: Props) {
  console.log("VNC Desktop: ", websockifyPort);

  const vncRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPort, setCurrentPort] = useState(websockifyPort);

  useEffect(() => {
    if (websockifyPort === currentPort && isConnected) {
      console.log("No port change & already connected. Skipping reconnect.");
      return;
    }

    console.log(`Switching to new port: ${websockifyPort}`);
    setCurrentPort(websockifyPort);
    setIsConnected(false);
    setLoading(true);

    let attempts = 0;
    const maxAttempts = 10;
    let reconnectInterval: NodeJS.Timeout | null = null;

    const attemptReconnect = () => {
      if (!vncRef.current || attempts >= maxAttempts) {
        console.log("Max reconnection attempts reached.");
        return;
      }

      console.log(`Attempting VNC reconnect... (${attempts + 1})`);
      vncRef.current?.disconnect();
      vncRef.current?.connect();
      attempts++;
    };

    reconnectInterval = setInterval(() => {
       if (attempts < maxAttempts) {
        attemptReconnect();
      } else {
        console.log("Giving up on reconnecting.");
        clearInterval(reconnectInterval!);
      }
    }, 500);

    return () => {
      if (reconnectInterval) clearInterval(reconnectInterval);
    };
  }, [websockifyPort, currentPort, isConnected]);

  return (
    <div className={`w-full h-full ${loading ? "flex items-center justify-center" : ""}`}>  
      {loading && (
        <div className="absolute flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-black">Connecting to Lab...</p>
        </div>
      )}

      <VncScreen
        ref={vncRef}
        url={`ws://127.0.0.1:${websockifyPort}/websockify`}
        scaleViewport
        background="#000000"
        style={{
          width: "75vw",
          height: "75vh",
          opacity: loading ? 0 : 1,
        }}
        rfbOptions={{
          shared: false,
          credentials: {
            username: "user",
            password: "password",
          },
        }}
        onConnect={() => {
          console.log("VNC Connected!");
          setIsConnected(true);
          setLoading(false);
        }}
        onDisconnect={(e) => {
          console.error("VNC Disconnected:", e);
          setIsConnected(false);
          setLoading(true);
        }}
      />
    </div>
  );
}

export default VNCdesktop;
