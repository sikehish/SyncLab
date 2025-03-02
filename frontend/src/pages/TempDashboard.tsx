import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { registerUser } from "../utils/registerUser";
import { useNavigate } from "react-router-dom";

export default function TempDashboard() {
    const { user, isSignedIn } = useUser();
    const navigate = useNavigate();
    console.log("TEMP HAHAHA", isSignedIn, user)
    useEffect(() => {
      if (isSignedIn && user) {
        registerUser(user).finally(() => {
          navigate("/"); 
        });
      }
    }, [isSignedIn, user, navigate]);
  
    return <div className="text-center p-10">Registering...</div>;
}
