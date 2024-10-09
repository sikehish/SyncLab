import React, { useRef, useState } from 'react';
import { VncScreen } from 'react-vnc';

interface VNCResponse {
  vncPort: string;
}

const App: React.FC = () => {
  const [vncPort, setVncPort] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const ref = useRef();

  const handleRoomAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/${roomId ? 'join' : 'new-instance'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId }),
      });

      if (!response.ok) {
        throw new Error('Failed to access the container');
      }

      const data: VNCResponse = await response.json();
      console.log(data);
      setVncPort(data.vncPort);

      if (!roomId) {
        setCreatedRoomId(data.roomId); 
      }
    } catch (error) {
      console.error('Error accessing container:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleRoomAction} className="flex flex-col items-center">
        <input
          type="text"
          placeholder="Enter Room ID (Leave empty for new room)"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="mb-4 p-2 border border-gray-300 rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          {roomId ? 'Join Room' : 'Start New Room'}
        </button>
      </form>

      {createdRoomId && (
        <p className="text-green-500">Created Room ID: {createdRoomId}</p>
      )}

      {vncPort ? (
        <div className="mt-4">
          <VncScreen
            url={`ws://localhost:6080/websockify`}
            scaleViewport
            background="#000000"
            style={{
              width: '75vw',
              height: '75vh',
            }}
            ref={ref}
          />
        </div>
      ) : (
        <p className="text-gray-500">No container running.</p>
      )}
    </div>
  );
};

export default App;
