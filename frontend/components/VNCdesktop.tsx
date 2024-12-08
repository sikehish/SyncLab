import { useRef } from 'react'
import { VncScreen } from 'react-vnc';


interface props{
    websockifyPort: number;
    createdRoomId: string
    roomId: string
}


function VNCdesktop({websockifyPort, createdRoomId, roomId}: props) {
    const ref = useRef();
        return (
          <div className="mt-4">
              <p>{createdRoomId ? `Created Room ID: ${createdRoomId}` :  `Room ID: ${roomId}`} </p>
            <VncScreen
              url={`ws://localhost:${websockifyPort}/websockify`} // Correctly use the string for websockifyPort
              scaleViewport
              background="#000000"
              style={{
                width: "75vw",
                height: "75vh",
              }}
            />
          </div>
        );    
}

export default VNCdesktop