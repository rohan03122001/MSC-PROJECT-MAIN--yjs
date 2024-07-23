"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import RoomManager from "@/components/RoomManager";

const CollaborativeEditor = dynamic(
  () => import("@/components/CollaborativeEditor"),
  { ssr: false }
);
const VoiceChat = dynamic(() => import("@/components/VoiceChat"), {
  ssr: false,
});

export default function Home() {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-6 text-center">
          Collaborative Code Editor with Voice Chat
        </h1>
        <RoomManager
          currentRoom={currentRoom}
          setCurrentRoom={setCurrentRoom}
        />
        {currentRoom && (
          <>
            <div className="bg-white rounded-lg shadow-xl overflow-hidden mt-6">
              <CollaborativeEditor roomId={currentRoom} />
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
