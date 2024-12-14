// !!NOTE: THIS ISNT BEING USED; WAS JUST TO TEST OUT THE FUNCTIONALITY

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
import { useState } from "react";
import { FaMicrophone, FaMicrophoneAltSlash, FaVideo, FaVideoSlash, FaPhoneAlt, FaPhone } from "react-icons/fa";
import DefaultImage from "../../assets/default_photo.png";

export const VideoCall = () => {
  const fetchToken = async (channelName: string) => {
    try {
      const response = await fetch("http://localhost:5000/api/generate-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channelName }),
      });
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error("Error fetching token:", error);
      return null;
    }
  };

  const [calling, setCalling] = useState(false);
  const [channelName, setChannelName] = useState(""); 
  const [token, setToken] = useState(null); 
  const isConnected = useIsConnected();
  const appId = "78687755363a4287800e7b67be774e0f";

  const handleJoin = async () => {
    if (channelName) {
      const generatedToken = await fetchToken(channelName);
      if (generatedToken) {
        setToken(generatedToken);
        setCalling(true); 
      } else {
        alert("Failed to generate token. Please try again.");
      }
    } else {
      alert("Please enter a channel name.");
    }
  };

  useJoin({ appid: appId, channel: channelName, token: token }, calling);

  const [micOn, setMic] = useState(true);
  const [cameraOn, setCamera] = useState(true);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  usePublish([localMicrophoneTrack, localCameraTrack]);

  const remoteUsers = useRemoteUsers();

  return (
    <>
      <div className="room p-4">
        {isConnected ? (
          <div className="user-list grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="user w-full h-40 md:h-48 relative rounded-lg border-2 border-gray-300 overflow-hidden shadow-lg">
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

            {remoteUsers.map((user) => (
              <div className="user w-full h-40 md:h-48 relative rounded-lg border-2 border-gray-300 overflow-hidden shadow-lg" key={user.uid}>
                <RemoteUser cover={DefaultImage} user={user}>
                  <samp className="user-name text-center text-white absolute bottom-2 left-2 bg-opacity-50 bg-black px-2 py-1 rounded-md">
                    {user.uid}
                  </samp>
                </RemoteUser>
              </div>
            ))}
          </div>
        ) : (
          <div className="join-room flex flex-col items-center space-y-4">
            <input
              type="text"
              placeholder="Enter Channel Name"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              className="channel-input p-2 rounded-md border-2 border-gray-300 mb-4 w-60"
            />
            <button
              className={`join-channel p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600`}
              onClick={handleJoin}
            >
              <span>Join Channel</span>
            </button>
          </div>
        )}
      </div>

      {isConnected && (
        <div className="control mt-4 flex justify-between items-center px-4">
          <div className="left-control flex space-x-6">
            <button
              className="btn p-2 bg-gray-300 rounded-full hover:bg-gray-400"
              onClick={() => setMic((prev) => !prev)}
            >
              {micOn ? <FaMicrophone size={24} /> : <FaMicrophoneAltSlash size={24} />}
            </button>
            <button
              className="btn p-2 bg-gray-300 rounded-full hover:bg-gray-400"
              onClick={() => setCamera((prev) => !prev)}
            >
              {cameraOn ? <FaVideo size={24} /> : <FaVideoSlash size={24} />}
            </button>
          </div>
          <button
            className={`btn btn-phone p-4 rounded-full ${calling ? "bg-red-500" : "bg-green-500"} hover:scale-110 transition-transform`}
            onClick={() => setCalling((prev) => !prev)}
          >
            {calling ? <FaPhoneAlt size={24} /> : <FaPhone size={24} />}
          </button>
        </div>
      )}
    </>
  );
};

export default VideoCall;
