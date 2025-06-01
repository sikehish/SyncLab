import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react"; 
import MainLoader from "../components/MainLoader";

const ProtectedRoute: React.FC<{  children: JSX.Element;}> = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <MainLoader />;
  }

  return isSignedIn ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
