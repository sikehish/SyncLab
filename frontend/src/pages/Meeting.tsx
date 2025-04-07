import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaDownload, FaUpload, FaSignOutAlt } from "react-icons/fa";
import { MdScreenshotMonitor } from "react-icons/md";
import VNCdesktop from "../components/VNCdesktop";
import Loader from "../components/Loader";
import {
  LocalUser,
  RemoteUser,
  useIsConnected,
  useJoin,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useRemoteUsers,
} from "agora-rtc-react";
import { FaMicrophone, FaMicrophoneAltSlash, FaVideo, FaVideoSlash, FaExpand, FaCompress } from "react-icons/fa";
import DefaultImage from "../assets/default_photo.png";
import { useUser } from "@clerk/clerk-react";


const Meeting: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { websockifyPort: initialPort, roomId, token } = location.state || {};
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCapturingSnapshot, setIsCapturingSnapshot] = useState(false);
  const isConnected = useIsConnected();
  const appId = "78687755363a4287800e7b67be774e0f";
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { user } = useUser();
  const username = user?.username || user?.fullName || "Guest";
  const [websockifyPort, setWebsockifyPort] = useState(initialPort);
  const [workspaceId, setWorkspaceId] = useState(1);

  console.log("TOKEN: ", token)

  const [isLeaving, setIsLeaving] = useState(false); // Add this state

  const handleLeaveMeeting = async () => {
    setIsLeaving(true); // Start processing
    
    try {
      const response = await fetch(`http://localhost:5000/api/leave-room/${roomId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clerkId: user?.id }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to leave room");
      }
  
      const data = await response.json();
      if (data.message === "Room deleted") {
        toast.success("You were the last participant. Room has been deleted.");
      } else {
        toast.success("Left the room successfully");
      }
  
      navigate("/");
    } catch (error) {
      toast.error("Error leaving room. Please try again.");
      console.error("Error leaving room:", error);
    } finally {
      setIsLeaving(false); // End processing
    }
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
        const response = await fetch(`http://localhost:5000/api/upload/${roomId}/${workspaceId}`, {
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
      const response = await fetch(`http://localhost:5000/api/download/${roomId}/${workspaceId}`, {
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

  const handleCaptureSnapshot = async () => {
    if (!roomId || !user?.id) {
      toast.error("Invalid room or user. Please try again.");
      return;
    }
  
    try {
      setIsCapturingSnapshot(true);
      toast.info("Capturing snapshot, please wait...");
  
      const response = await fetch(`http://localhost:5000/api/snapshot/${roomId}/${user.id}`, {
        method: "POST",
      });
  
      if (!response.ok) {
        throw new Error("Failed to capture snapshot");
      }
  
      const data = await response.json();
      toast.success("Snapshot captured successfully!");
      console.log("Snapshot data:", data);
    } catch (error) {
      toast.error("Error capturing snapshot. Please try again.");
      console.error("Error capturing snapshot:", error);
    } finally {
      setIsCapturingSnapshot(false);
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };


  const switchWorkspace = async (newWorkspaceId: number) => {
    try {
      const response = await fetch("http://localhost:5000/api/switch-workspace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId, workspaceId: newWorkspaceId }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to switch workspace");
      }
      
      const data = await response.json();
      setWebsockifyPort(data.websockifyPort);
      setWorkspaceId(newWorkspaceId);
    } catch (error) {
      console.error("Error switching workspace:", error);
    }
  };


  useJoin({ appid: appId, channel: roomId, token: token }, true);

  const [micOn, setMic] = useState(true);
  const [cameraOn, setCamera] = useState(true);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  usePublish([localMicrophoneTrack, localCameraTrack]);

  const remoteUsers = useRemoteUsers();
  console.log("REMOTE: ", remoteUsers)

  if (!websockifyPort || !roomId) {
    return <div>Invalid session. Please go back to Home.</div>;
  }
  console.log(user?.fullName, workspaceId, websockifyPort)
  return (
    <div className="relative w-full h-screen flex flex-col">
      {isLeaving && (
        <div className="absolute inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
          <div className="text-white text-xl flex flex-col items-center">
            <Loader size="large" />
            <span className="mt-4">Leaving room...</span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100">
        <div className="text-lg font-semibold text-gray-700">
          Room ID: <span className="font-bold">{roomId}</span>
        </div>
        <div className="flex items-center space-x-4">
  <div className="flex items-center space-x-2">
    <label htmlFor="workspace" className="text-sm font-medium">Switch Workspace:</label>
    <select
      id="workspace"
      value={workspaceId}
      onChange={(e) => switchWorkspace(parseInt(e.target.value))}
      className="p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-300"
    >
      <option value={1}>Default Workspace</option>
      <option value={2}>Workspace 2</option>
    </select>
  </div>

  <button
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={toggleFullScreen}
            title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
          >
            {isFullScreen ? <FaCompress size={20} /> : <FaExpand size={20} />}
          </button>

  {isConnected && (
    <button
      className="p-2 bg-gray-300 rounded-full hover:bg-gray-400 transition"
      onClick={() => setMic((prev) => !prev)}
    >
      {micOn ? <FaMicrophone size={24} /> : <FaMicrophoneAltSlash size={24} />}
    </button>
  )}

  {isConnected && (
    <button
      className="p-2 bg-gray-300 rounded-full hover:bg-gray-400 transition"
      onClick={() => setCamera((prev) => !prev)}
    >
      {cameraOn ? <FaVideo size={24} /> : <FaVideoSlash size={24} />}
    </button>
  )}

  <button
    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-700 transition"
    onClick={handleDownload}
    title="Download Files"
  >
    <FaDownload size={20} />
  </button>

  <button
    className={`p-2 bg-green-500 text-white rounded-full hover:bg-green-700 transition ${
      isUploading ? "opacity-75 cursor-not-allowed" : ""
    }`}
    onClick={handleFileSelectAndUpload}
    disabled={isUploading}
    title="Upload Files"
  >
    {isUploading ? <Loader /> : <FaUpload size={20} />}
  </button>

  <button
    className={`p-2 bg-blue-500 text-white rounded-full hover:bg-blue-700 transition ${
      isCapturingSnapshot ? "opacity-75 cursor-not-allowed" : ""
    }`}
    onClick={handleCaptureSnapshot}
    disabled={isCapturingSnapshot}
    title="Take OS Snapshot"
  >
    {isCapturingSnapshot ? <Loader /> : <MdScreenshotMonitor size={20} />}
  </button>

  <button
        className={`p-2 bg-red-500 text-white rounded-full hover:bg-red-700 transition ${
          isLeaving ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleLeaveMeeting}
        disabled={isLeaving}
        title="Leave Meeting"
      >
        {isLeaving ? <Loader size="small" /> : <FaSignOutAlt size={20} />}
      </button>
</div>

      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`${isFullScreen ? "w-full" : "w-3/4"}`}>
          <VNCdesktop 
            websockifyPort={websockifyPort} 
            roomId={roomId} 
            isFullScreen={isFullScreen} 
          />
        </div>

        {!isFullScreen && (
          <div className="flex flex-col w-1/4 overflow-y-auto">
            <div className="user w-full h-40 md:h-48 relative rounded-lg border-2 border-gray-300 overflow-hidden shadow-lg mb-4">
              <LocalUser
                audioTrack={localMicrophoneTrack}
                cameraOn={cameraOn}
                micOn={micOn}
                videoTrack={localCameraTrack}
                cover={DefaultImage}
              >
                <samp className="user-name text-center text-white absolute bottom-2 left-2 bg-opacity-50 bg-black px-2 py-1 rounded-md">
                  You
                </samp>
              </LocalUser>
            </div>

            <div className="">
              {remoteUsers.map((user) => (
                <div
                  className="user w-full h-40 md:h-48 relative rounded-lg border-2 border-gray-300 overflow-hidden shadow-lg"
                  key={user.uid}
                >
                  <RemoteUser cover={DefaultImage} user={user}>
                    <samp className="user-name text-center text-white absolute bottom-2 left-2 bg-opacity-50 bg-black px-2 py-1 rounded-md">
                      {user.uid}
                    </samp>
                  </RemoteUser>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        webkitdirectory=""
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
};

export default Meeting;
