import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const JoinRoom: React.FC = () => {
  const [roomId, setRoomId] = useState<string>("");
  const [websockifyPort, setWebsockifyPort] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchToken = async (roomId: string) => {
    try {
      const response = await fetch("http://localhost:5000/api/generate-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channelName: roomId }),
      });
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error("Error fetching token:", error);
      return null;
    }
  };

  async function handleJoin(roomId: string): Promise<string | null> {
    if (roomId) {
      const generatedToken = await fetchToken(roomId);
      if (generatedToken) return generatedToken;  
      else {
        alert("Failed to generate token. Please try again.");
        return null; 
      }
    } else {
      alert("Please enter a channel name.");
      return null; 
    }
  };
  
  const handleJoinRoom = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });

      if (!response.ok) {
        throw new Error("Failed to join the room");
      }

      const data = await response.json();
      setWebsockifyPort(data.websockifyPort);
      console.log("JOIN DATA: ", data)
      const token = await handleJoin(roomId);

      navigate("/meeting", { state: { websockifyPort: data.websockifyPort, roomId, token } });
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <input
        type="text"
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="mb-4 p-2 border border-gray-300 rounded"
      />
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={handleJoinRoom}
      >
        Join Room
      </button>
    </div>
  );
};

export default JoinRoom;
