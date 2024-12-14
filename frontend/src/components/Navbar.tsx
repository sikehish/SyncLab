import { Link, NavLink } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

const Navbar: React.FC = () => {
  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-500">
              SyncLab
            </Link>
          </div>

          <div className="hidden md:flex space-x-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? "text-blue-400 font-medium"
                  : "text-gray-300 hover:text-blue-400"
              }
            >
              Home
            </NavLink>

            <SignedIn>
              <NavLink
                to="/create-room"
                className={({ isActive }) =>
                  isActive
                    ? "text-blue-400 font-medium"
                    : "text-gray-300 hover:text-blue-400"
                }
              >
                Create Room
              </NavLink>
              <NavLink
                to="/join-room"
                className={({ isActive }) =>
                  isActive
                    ? "text-blue-400 font-medium"
                    : "text-gray-300 hover:text-blue-400"
                }
              >
                Join Room
              </NavLink>
            </SignedIn>
          </div>

          <div className="flex items-center space-x-4">
            <SignedOut>
              <Link
                to="/login"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-200"
              >
                Login
              </Link>
            </SignedOut>

            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    rootBox:
                      "rounded-full border border-gray-300 shadow-sm hover:shadow-md transition duration-200",
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
