import { useRef } from 'react';
import { VncScreen } from 'react-vnc';


interface Props {
  websockifyPort: number;
  createdRoomId: string;
  roomId: string;
}

function VNCdesktop({ websockifyPort, createdRoomId, roomId }: Props) {
  const ref = useRef();

  return (
    <VncScreen
      url={`ws://localhost:${websockifyPort}/websockify`} // Dynamically set the WebSocket URL
      scaleViewport
      background="#000000"
      style={{
        width: "75vw",
        height: "75vh",
      }}
      rfbOptions={{
        shared: true,
        credentials: {
          username: "user",
          password: "password",
        },
      }}
    />
  );
}

export default VNCdesktop;
