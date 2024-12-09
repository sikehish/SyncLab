import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import VNCdesktop from "../components/VNCdesktop";

const Meeting: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { websockifyPort, roomId } = location.state || {};

  const handleLeaveMeeting = () => {
    navigate("/");
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/download/${roomId}`, {
        method: "GET",
      });
  
      if (!response.ok) {
        throw new Error("Failed to download files");
      }
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CodeFiles-${roomId}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading files:", error);
    }
  };

  if (!websockifyPort || !roomId) {
    return <div>Invalid session. Please go back to Home.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-xl font-bold mb-4">Meeting Room: {roomId}</h1>
      <div className="meeting-features">
        <VNCdesktop websockifyPort={websockifyPort} roomId={roomId} />
        <p className="text-gray-700 mt-4">Additional meeting features will appear here.</p>
      </div>
      <button
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4"
        onClick={handleLeaveMeeting}
      >
        Leave Meeting
      </button>

      <button
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
      onClick={handleDownload}
    >
      Download
    </button>
    </div>
  );
};

export default Meeting;
