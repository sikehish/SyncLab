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
            <VncScreen
              url={`ws://localhost:${websockifyPort}/websockify`} // Correctly use the string for websockifyPort
              scaleViewport
              background="#000000"
              style={{
                width: "75vw",
                height: "75vh",
              }}
            />
        );    
}

export default VNCdesktop