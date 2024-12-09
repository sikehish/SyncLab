import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateRoom: React.FC = () => {
  const [websockifyPort, setWebsockifyPort] = useState<string | null>(null);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/new-instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to create a new room");
      }

      const data = await response.json();
      setWebsockifyPort(data.websockifyPort);
      setCreatedRoomId(data.roomId);

      navigate("/meeting", { state: { websockifyPort: data.websockifyPort, roomId: data.roomId } });
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <button
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        onClick={handleCreateRoom}
      >
        Create Room
      </button>
    </div>
  );
};

export default CreateRoom;
