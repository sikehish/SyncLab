import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react"; 

const ProtectedRoute: React.FC<{  children: JSX.Element;}> = ({ children }) => {
  const { isSignedIn } = useAuth();

  return isSignedIn ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
