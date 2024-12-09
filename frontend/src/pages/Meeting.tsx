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
    </div>
  );
};

export default Meeting;
