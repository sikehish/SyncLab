import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import Meeting from "./pages/Meeting";
import { ToastContainer } from "react-toastify";
import Login from "./pages/Login";
import ConditionalNavbar from "./components/ConditionalNavbar";
import Signup from "./pages/Signup";
import ProtectedRoute from "./utils/ProtectedRoute";
import UnauthenticatedRoute from "./utils/UnauthenticatedRoute";
import TempDashboard from "./pages/TempDashboard";
import Chatbot from "./components/Chatbot";

const App: React.FC = () => {
  return (
    <Router>
      <ToastContainer />
      <ConditionalNavbar />
      <Routes>
  <Route path="/" element={<Home />} />

  <Route
    path="/login"
    element={
      <UnauthenticatedRoute>
        <Login />
      </UnauthenticatedRoute>
    }
  />
   <Route
          path="/registering"
          element={
            <ProtectedRoute>
              <TempDashboard />
            </ProtectedRoute>
          }
        />
  <Route
    path="/signup"
    element={
      <UnauthenticatedRoute>
        <Signup />
      </UnauthenticatedRoute>
    }
  />

  <Route
    path="/create-room"
    element={
      <ProtectedRoute>
        <CreateRoom />
      </ProtectedRoute>
    }
  />
  <Route
    path="/join-room"
    element={
      <ProtectedRoute>
        <JoinRoom />
      </ProtectedRoute>
    }
  />
  <Route
    path="/meeting"
    element={
      <ProtectedRoute>
        <Meeting />
      </ProtectedRoute>
    }
  />
</Routes>
<Chatbot />
    </Router>
  );
};

export default App;
