import React, { useState } from "react";
import VideoCall from "../components/video-calling/VideoCall";

const VideoJoin: React.FC = () => {
  const [inCall, setInCall] = useState<boolean>(false);

  return (
    <div className="flex items-center justify-center h-screen">
      {inCall ? (
        <VideoCall setInCall={setInCall} />
      ) : (
        <button
          className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-all"
          onClick={() => setInCall(true)}
        >
          Join Call
        </button>
      )}
    </div>
  );
};

export default VideoJoin;
