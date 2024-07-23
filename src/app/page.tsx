"use client";

import dynamic from "next/dynamic";

const CollaborativeEditor = dynamic(
  () => import("@/components/CollaborativeEditor"),
  { ssr: false }
);

const VoiceChat = dynamic(() => import("@/components/VoiceChat"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-6 text-center">
          Collaborative Code Editor with Voice Chat
        </h1>
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <CollaborativeEditor />
        </div>
        <div className="mt-6">
          <VoiceChat />
        </div>
      </main>
    </div>
  );
}
