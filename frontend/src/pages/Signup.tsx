import { SignUp, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { registerUser } from "../utils/registerUser";

export default function Signup() {

  const { user, isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn && user) {
      registerUser(user);
    }
  }, [isSignedIn, user]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className=" bg-white rounded-lg shadow-md">
        <SignUp routing="path" path="/signup" forceRedirectUrl="/registering" signInUrl="/login" />
      </div>
    </div>
  );
}
