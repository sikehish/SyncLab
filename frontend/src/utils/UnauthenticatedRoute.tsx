import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import MainLoader from "../components/MainLoader";

const UnauthenticatedRoute: React.FC<{  children: JSX.Element;}> = ({ children }) => {
    const { isSignedIn, isLoaded } = useAuth();
  
    if (!isLoaded) {
      return <MainLoader />;
    }
  
    return !isSignedIn ? children : <Navigate to="/registering" replace />;
  };
  
  export default UnauthenticatedRoute;
  