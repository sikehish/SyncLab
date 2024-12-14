import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import Meeting from "./pages/Meeting";
import { ToastContainer } from "react-toastify";
// import VideoJoin from "./pages/VideoJoin";
import VideoCall from "./components/video-calling/VideoCall";
import Login from "./pages/Login";
import ConditionalNavbar from "./components/ConditionalNavbar";
import Signup from "./pages/Signup";

const App: React.FC = () => {
  return (
    <Router>
      <ToastContainer />
      <ConditionalNavbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-room" element={<CreateRoom />} />
        <Route path="/join-room" element={<JoinRoom />} />
        <Route path="/meeting" element={<Meeting />} />
        <Route path="/video" element={<VideoCall />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
};

export default App;
