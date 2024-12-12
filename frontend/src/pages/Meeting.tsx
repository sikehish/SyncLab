import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VNCdesktop from "../components/VNCdesktop";
import Loader from "../components/Loader";

const Meeting: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { websockifyPort, roomId } = location.state || {};
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleLeaveMeeting = () => {
    navigate("/");
  };

  const handleFileSelectAndUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const formData = new FormData();
      for (const file of files) {
        const relativePath = file.webkitRelativePath || file.name;
        formData.append("files", file);
        formData.append("relativePaths[]", relativePath);
      }

      try {
        setIsUploading(true);
        toast.info("Uploading files, please wait...");
        const response = await fetch(`http://localhost:5000/api/upload/${roomId}`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload files");
        }

        toast.success("Upload successful!");
      } catch (error) {
        toast.error("Error uploading files. Please try again.");
        console.error("Error uploading files:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDownload = async () => {
    try {
      toast.info("Preparing your download...");
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
      toast.success("Download completed!");
    } catch (error) {
      toast.error("Error downloading files. Please try again.");
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
        className="hidden"
        onChange={handleUpload}
      />
      <button
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4 flex items-center justify-center"
        onClick={handleFileSelectAndUpload}
      >
        {isUploading && <Loader />}
        {isUploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
};

export default Meeting;
