import React, { useState } from 'react';
import { Link, NavLink } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
      isActive
        ? "text-blue-400"
        : "text-gray-300 hover:text-blue-400"
    }`;

  const navLinkUnderline = {
    initial: { width: 0 },
    animate: { width: '100%' },
    transition: { duration: 0.3 }
  };

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold">
              <motion.span
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                SyncLab
              </motion.span>
            </Link>
          </div>

          <div className="hidden md:flex space-x-4">
            <NavLink to="/" className={navLinkClass}>
              {({ isActive }) => (
                <span className="relative">
                  Home
                  {isActive && (
                    <motion.span
                      className="absolute bottom-0 left-0 h-0.5 bg-blue-400"
                      initial="initial"
                      animate="animate"
                      variants={navLinkUnderline}
                    />
                  )}
                </span>
              )}
            </NavLink>

            <SignedIn>
              <NavLink to="/create-room" className={navLinkClass}>
                {({ isActive }) => (
                  <span className="relative">
                    Create Room
                    {isActive && (
                      <motion.span
                        className="absolute bottom-0 left-0 h-0.5 bg-blue-400"
                        initial="initial"
                        animate="animate"
                        variants={navLinkUnderline}
                      />
                    )}
                  </span>
                )}
              </NavLink>
              <NavLink to="/join-room" className={navLinkClass}>
                {({ isActive }) => (
                  <span className="relative">
                    Join Room
                    {isActive && (
                      <motion.span
                        className="absolute bottom-0 left-0 h-0.5 bg-blue-400"
                        initial="initial"
                        animate="animate"
                        variants={navLinkUnderline}
                      />
                    )}
                  </span>
                )}
              </NavLink>
            </SignedIn>
          </div>

          <div className="flex items-center space-x-4">
            <SignedOut>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-md transition duration-200 shadow-md hover:shadow-lg"
                >
                  Login
                </Link>
              </motion.div>
            </SignedOut>

            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    rootBox:
                      "rounded-full border-2 border-blue-400 shadow-md hover:shadow-lg transition duration-200",
                    avatarBox: "w-10 h-10",
                  },
                }}
              />
            </SignedIn>

            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="text-gray-300 hover:text-white focus:outline-none focus:text-white"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <motion.div
          className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLink to="/" className={navLinkClass} onClick={toggleMenu}>
              Home
            </NavLink>
            <SignedIn>
              <NavLink to="/create-room" className={navLinkClass} onClick={toggleMenu}>
                Create Room
              </NavLink>
              <NavLink to="/join-room" className={navLinkClass} onClick={toggleMenu}>
                Join Room
              </NavLink>
            </SignedIn>
          </div>
        </motion.div>
      </div>
    </nav>
  );
};

export default Navbar;

