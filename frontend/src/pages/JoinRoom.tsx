import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useUser } from "@clerk/clerk-react";

const JoinRoom: React.FC = () => {
  const [roomId, setRoomId] = useState<string>("");
  const navigate = useNavigate();
  const { user } = useUser();

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
      toast.error("Failed to generate token");
      return null;
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId) {
      toast.error("Please enter a room ID");
      return;
    }

    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          roomId, 
          clerkId: user.id 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // User already in meeting
          toast.warning("You're already in this meeting");
        } else {
          throw new Error(data.error || "Failed to join the room");
        }
        return;
      }

      const token = await fetchToken(roomId);
      if (!token) return;

      toast.success("Successfully joined room!");
      
      navigate("/meeting", { 
        state: { 
          websockifyPort: data.websockifyPort, 
          roomId,
          token,
          osType: data.osType,
          creator: data.creator,
          participants: data.participants
        } 
      });
    } catch (error) {
      console.error("Error joining room:", error);
      toast.error(error instanceof Error ? error.message : "Failed to join room");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Join Room</h1>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="mb-4 p-3 w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded transition duration-200"
          onClick={handleJoinRoom}
        >
          Join Room
        </button>
      </div>
    </div>
  );
};

export default JoinRoom;