
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import RoomManager from "@/components/RoomManager";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

// Dynamically import components to avoid SSR issues
const CollaborativeEditor = dynamic(
  () => import("@/components/CollaborativeEditor"),
  { ssr: false }
);
const VoiceChat = dynamic(() => import("@/components/VoiceChat"), {
  ssr: false,
});

export default function Home() {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string>("javascript");
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-6">
            Welcome to CollabCode
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-6 text-center">
          Collaborative Code Editor with Voice Chat
        </h1>
        <RoomManager
          currentRoom={currentRoom}
          setCurrentRoom={setCurrentRoom}
          setCurrentLanguage={setCurrentLanguage}
        />
        {currentRoom && (
          <>
            <div className="bg-white rounded-lg shadow-xl overflow-hidden mt-6">
              <CollaborativeEditor
                roomId={currentRoom}
                initialLanguage={currentLanguage}
              />
            </div>
            <div className="mt-6">
              <VoiceChat roomId={currentRoom} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
