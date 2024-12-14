import { SignIn } from "@clerk/clerk-react";

export default function Login() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">
          Welcome to SyncLab
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Please sign in to continue.
        </p>
        <SignIn routing="path" path="/login" signUpUrl="/signup" />
      </div>
    </div>
  );
}
