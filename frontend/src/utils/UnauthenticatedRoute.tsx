import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

const UnauthenticatedRoute: React.FC<{  children: JSX.Element;}> = ({ children }) => {
    const { isSignedIn } = useAuth();
  
    return !isSignedIn ? children : <Navigate to="/" replace />;
  };
  
  export default UnauthenticatedRoute;
  