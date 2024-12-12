import React, { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import VNCdesktop from "../components/VNCdesktop";

const Meeting: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { websockifyPort, roomId } = location.state || {};
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLeaveMeeting = () => {
    navigate("/");
  };

  const handleUpload = async () => {
    if (fileInputRef.current && fileInputRef.current.files) {
      const formData = new FormData();
      for (const file of fileInputRef.current.files) {
        const relativePath = file.webkitRelativePath || file.name; // preserve relative paths
        formData.append("files", file);
        formData.append("relativePaths[]", relativePath); 
      }
  
      try {
        const response = await fetch(`http://localhost:5000/api/upload/${roomId}`, {
          method: "POST",
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error("Failed to upload files");
        }
  
        alert("Upload successful!");
      } catch (error) {
        console.error("Error uploading files:", error);
      }
    }
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

      <input
        ref={fileInputRef}
        type="file"
        multiple
        webkitdirectory=""
        className="mt-4"
      />
      <button
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4"
        onClick={handleUpload}
      >
        Upload
      </button>
    </div>
  );
};

export default Meeting;
