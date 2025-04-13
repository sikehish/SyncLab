import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaDownload, FaUpload, FaSignOutAlt, FaDesktop, FaChalkboard, FaComment, FaPaperPlane, FaTimes } from "react-icons/fa";
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
import Whiteboard from "../components/WhiteBoard";
import io from "socket.io-client";

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
  const [isWhiteBoard, setIsWhiteBoard] = useState(false);
  
  // Chat related states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{sender: string, text: string, timestamp: Date}>>([]);
  const [socket, setSocket] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  console.log("TOKEN: ", token)

  const [isLeaving, setIsLeaving] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io("http://localhost:5000"); // Use your actual socket server URL
    setSocket(newSocket);

    // Join chat room
    if (roomId) {
      newSocket.emit("joinChatRoom", { roomId, username });
    }

    // Listen for incoming messages
    newSocket.on("receiveMessage", (data) => {
      console.log("RECEIVED: " , data)
      setChatMessages((prevMessages) => [...prevMessages, {
        sender: data.sender,
        text: data.text,
        timestamp: new Date(data.timestamp)
      }]);
    });

    // Cleanup on component unmount
    return () => {
      newSocket.disconnect();
    };
  }, [roomId, username]);

  // Auto-scroll to bottom of chat when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && socket) {
      const messageData = {
        roomId,
        sender: username,
        text: message.trim(),
        timestamp: new Date()
      };
      
      socket.emit("sendMessage", messageData);
      
      // Add to local state immediately for responsiveness
      setChatMessages([...chatMessages, messageData]);
      setMessage("");
    }
  };

  const handleLeaveMeeting = async () => {
    setIsLeaving(true);
    
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
      setIsLeaving(false);
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

  const toggleView = () => {
    setIsWhiteBoard(!isWhiteBoard);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
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
  
  // Format timestamp for chat messages
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
          {/* Toggle between Desktop and Whiteboard */}
          <button
            className={`p-2 ${isWhiteBoard ? 'bg-blue-500' : 'bg-gray-500'} text-white rounded-full hover:opacity-80 transition`}
            onClick={toggleView}
            title={isWhiteBoard ? "Switch to Desktop" : "Switch to Whiteboard"}
          >
            {isWhiteBoard ? <FaDesktop size={20} /> : <FaChalkboard size={20} />}
          </button>

          {/* Only show these controls when in Desktop mode */}
          {!isWhiteBoard && (
            <>
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
            </>
          )}

          {/* Always show these controls regardless of mode */}
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
        <div className={`${isFullScreen ? "w-full" : isWhiteBoard ? "w-full" : "w-3/4"}`}>
          {isWhiteBoard ? (
            <div className="w-full h-full flex justify-center">
              <Whiteboard roomId={roomId} />
            </div>
          ) : (
            <VNCdesktop 
              websockifyPort={websockifyPort} 
              roomId={roomId} 
              isFullScreen={isFullScreen} 
            />
          )}
        </div>

        {!isFullScreen && !isWhiteBoard && (
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
                    {/* <samp className="user-name text-center text-white absolute bottom-2 left-2 bg-opacity-50 bg-black px-2 py-1 rounded-md">
                      {user.uid}
                    </samp> */}
                  </RemoteUser>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isFullScreen && isWhiteBoard && (
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
                    {/* <samp className="user-name text-center text-white absolute bottom-2 left-2 bg-opacity-50 bg-black px-2 py-1 rounded-md">
                      {user.uid}
                    </samp> */}
                  </RemoteUser>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat button - fixed at bottom left */}
      <button
        className="fixed bottom-6 left-6 p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg z-20"
        onClick={toggleChat}
        title="Sync Chat"
      >
        <FaComment size={24} />
      </button>

      {/* Chat window */}
      {isChatOpen && (
        <div className="fixed bottom-24 left-6 w-80 h-96 bg-white rounded-lg shadow-xl z-20 flex flex-col overflow-hidden border border-gray-300">
          {/* Chat header */}
          <div className="flex justify-between items-center bg-blue-600 text-white px-4 py-2">
            <h3 className="font-semibold">Sync Chat</h3>
            <button 
              onClick={toggleChat}
              className="hover:bg-blue-700 rounded p-1"
            >
              <FaTimes size={16} />
            </button>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                No messages yet. Start the conversation!
              </div>
            ) : (
              chatMessages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`mb-2 ${msg.sender === username ? 'text-right' : 'text-left'}`}
                >
                  <div 
                    className={`inline-block px-3 py-2 rounded-lg max-w-xs ${
                      msg.sender === username 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-300 text-gray-800'
                    }`}
                  >
                    {msg.sender !== username && (
                      <div className="font-semibold text-xs mb-1">{msg.sender}</div>
                    )}
                    <div>{msg.text}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {formatTime(new Date(msg.timestamp))}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} /> {/* Auto-scroll anchor */}
          </div>
          
          {/* Message input */}
          <form onSubmit={handleSendMessage} className="border-t border-gray-300 p-2 flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700"
              disabled={!message.trim()}
            >
              <FaPaperPlane />
            </button>
          </form>
        </div>
      )}

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