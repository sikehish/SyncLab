import { useUser } from "@clerk/clerk-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

type OS = 'ubuntu' | 'debian' | 'kali';

const CreateRoom: React.FC = () => {
  const [userScript, setUserScript] = useState<string>("");
  const [selectedOS, setSelectedOS] = useState<OS>('ubuntu');
  const { user } = useUser();
  const navigate = useNavigate();
  const [snapshots, setSnapshots] = useState<{ id: number; snapshotName: string }[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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
        toast.error("Failed to load snapshots");
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
      if (!response.ok) {
        throw new Error("Token generation failed");
      }
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error("Error fetching token:", error);
      toast.error("Failed to generate access token");
      return null;
    }
  };

  const handleCreateRoom = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to create a room");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("http://localhost:5000/api/new-instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userScript, 
          clerkId: user.id, 
          snapshotName: selectedSnapshot,
          osType: selectedOS
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create room");
      }
      
      const data = await response.json();
      toast.success("Room created successfully!");
      
      const token = await fetchToken(data.roomId);
      if (!token) return;

      navigate("/meeting", { 
        state: { 
          websockifyPort: data.websockifyPort, 
          roomId: data.roomId, 
          token,
          creatorId: data.creatorId,
          osType: data.osType,
          participants: data.participants || []
        } 
      });
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Create New Room</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Startup Script (Optional)
            </label>
            <textarea
              className="border rounded w-full h-32 p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your script here..."
              value={userScript}
              onChange={(e) => setUserScript(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operating System
            </label>
            <select
              className="border rounded w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedOS}
              onChange={(e) => setSelectedOS(e.target.value as OS)}
            >
              <option value="ubuntu">Ubuntu</option>
              <option value="debian">Debian</option>
              <option value="kali">Kali Linux</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Snapshot (Optional)
            </label>
            <select
              className="border rounded w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedSnapshot || ""}
              onChange={(e) => setSelectedSnapshot(e.target.value || null)}
            >
              <option value="">Select a Snapshot</option>
              {snapshots?.map((snapshot) => (
                <option key={snapshot.id} value={snapshot.snapshotName}>
                  {snapshot.snapshotName}
                </option>
              ))}
            </select>
          </div>

          <button
            className={`w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded mt-4 transition ${isCreating ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={handleCreateRoom}
            disabled={isCreating}
          >
            {isCreating ? 'Creating Room...' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;