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
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">
          Create Your SyncLab Account
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Sign up to get started with SyncLab and collaborate effortlessly.
        </p>
        <SignUp routing="path" path="/signup" forceRedirectUrl="/registering"  />
      </div>
    </div>
  );
}
