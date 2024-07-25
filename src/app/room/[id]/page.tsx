"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import RoomManager from "@/components/RoomManager";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

const CollaborativeEditor = dynamic(
  () => import("@/components/CollaborativeEditor"),
  { ssr: false }
);
const VoiceChat = dynamic(() => import("@/components/VoiceChat"), {
  ssr: false,
});

export default function RoomPage() {
  const { id } = useParams();
  const [currentRoom, setCurrentRoom] = useState<string | null>(id as string);
  const [currentLanguage, setCurrentLanguage] = useState<string>("javascript");
  const { user, loading } = useAuth();

  useEffect(() => {
    if (id) {
      setCurrentRoom(id as string);
    }
  }, [id]);

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {currentRoom && (
              <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                <CollaborativeEditor
                  roomId={currentRoom}
                  initialLanguage={currentLanguage}
                />
              </div>
            )}
          </div>
          <div className="space-y-6">
            <RoomManager
              currentRoom={currentRoom}
              setCurrentRoom={setCurrentRoom}
              setCurrentLanguage={setCurrentLanguage}
            />
            {currentRoom && (
              <>
                <VoiceChat roomId={currentRoom} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
