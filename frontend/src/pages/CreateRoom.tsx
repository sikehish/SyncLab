import { useUser } from "@clerk/clerk-react";
import { snapshot } from "node:test";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateRoom: React.FC = () => {
  const [userScript, setUserScript] = useState<string>("");
  const { user } = useUser();
  const navigate = useNavigate();
  const [snapshots, setSnapshots] = useState<{ id: number; snapshotName: string }[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);

  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/snapshots/${user?.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch snapshots");
        }
        const data = await response.json();
        setSnapshots(data);
      } catch (error) {
        console.error("Error fetching snapshots:", error);
      }
    };

    if (user?.id) fetchSnapshots();
  }, [user]);

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
      if (generatedToken)  return generatedToken; 
       else {
        alert("Failed to generate token. Please try again.");
        return null;  
      }
    } else {
      alert("Please enter a channel name.");
      return null; 
    }
  };

  const handleCreateRoom = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/new-instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userScript, clerkId: user?.id, snapshotName: selectedSnapshot }),
      });

      if (!response.ok) {
        throw new Error("Failed to create a new room");
      }

      const data = await response.json();
      const token = await handleJoin(data.roomId);
       navigate("/meeting", { state: { websockifyPort: data.websockifyPort, roomId: data.roomId, token,userId: data.userId } });
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <textarea
        className="border rounded w-1/2 h-32 p-2"
        placeholder="Enter your script here..."
        value={userScript}
        onChange={(e) => setUserScript(e.target.value)}
      />
        <select
        className="border rounded w-1/2 p-2 mt-4"
        value={selectedSnapshot || ""}
        onChange={(e) => setSelectedSnapshot(e.target.value)}
      >
        <option value="">Select a Snapshot</option>
        {snapshots?.map((snapshot) => (
          <option key={snapshot.id} value={snapshot.snapshotName}>
            {snapshot.snapshotName}
          </option>
        ))}
      </select>

      <button
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4"
        onClick={handleCreateRoom}
      >
        Create Room
      </button>
    </div>
  );
};

export default CreateRoom;
