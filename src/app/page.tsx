"use client";

import { useState } from "react";
import RoomManager from "@/components/RoomManager";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

export default function Home() {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string>("javascript");
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-6">
            Welcome to DisCoder
          </h1>
          <Link
            href="/auth"
            className="bg-white text-indigo-600 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-100 transition duration-300"
          >
            Sign In or Sign Up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
      <div className="container mx-auto">
        <RoomManager
          currentRoom={currentRoom}
          setCurrentRoom={setCurrentRoom}
          setCurrentLanguage={setCurrentLanguage}
        />
      </div>
    </div>
  );
}
