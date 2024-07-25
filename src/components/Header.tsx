"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { signOut } from "@/lib/supabaseClient";
import { useRouter, usePathname } from "next/navigation";

const Header: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const parts = pathname.split("/");
    if (parts[1] === "room" && parts[2]) {
      setRoomCode(parts[2]);
    } else {
      setRoomCode(null);
    }
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleLeaveRoom = () => {
    router.push("/");
  };

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h2 className="text-2xl font-bold">CollabCode</h2>

        <div className="flex items-center space-x-4">
          {roomCode && (
            <>
              <div className="relative">
                <button
                  onClick={copyRoomCode}
                  className="bg-white text-indigo-600 px-3 py-1 rounded-md hover:bg-indigo-100 transition-colors duration-300 flex items-center"
                >
                  <span className="mr-2">{roomCode}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
                {copied && (
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded-md text-sm animate-fade-in-out">
                    Copied!
                  </span>
                )}
              </div>
              <button
                onClick={handleLeaveRoom}
                className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors duration-300"
              >
                Leave Room
              </button>
            </>
          )}
          {user && (
            <>
              <span className="hidden md:inline">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="bg-indigo-700 text-white px-3 py-1 rounded-md hover:bg-indigo-800 transition-colors duration-300"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
