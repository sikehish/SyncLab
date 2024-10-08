import React, { useRef, useState } from 'react';
import { VncScreen } from 'react-vnc';

interface VNCResponse {
  vncPort: string;
}

const App: React.FC = () => {
  const [vncPort, setVncPort] = useState<string | null>(null);
  const ref = useRef();

  // Function to create a new container
  const startContainer = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:5000/api/new-instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to start container');
      }

      const data: VNCResponse = await response.json();
      console.log(data)
      setVncPort(data.vncPort); // Get the VNC port from the backend
    } catch (error) {
      console.error('Error starting container:', error);
    }
  };

  console.log(vncPort)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <button
        onClick={startContainer}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Start Ubuntu Container
      </button>
      
      {vncPort ? (
        <div className="mt-4">
           <VncScreen
      url='ws://localhost:6080/websockify'
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
