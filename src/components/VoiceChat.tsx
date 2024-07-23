import React, { useEffect, useState, useRef, useCallback } from "react";
import IonSfuClient from "@/lib/ionSfuClient";
import { LocalStream, RemoteStream } from "ion-sdk-js";

interface VoiceChatProps {
  roomId: string;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ roomId }) => {
  const [client, setClient] = useState<IonSfuClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState<LocalStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const localUidRef = useRef<string>("");

  const isLocalStream = useCallback(
    (streamId: string) => {
      return (
        streamId === localUidRef.current ||
        (localStream && streamId === localStream.id)
      );
    },
    [localStream]
  );

  useEffect(() => {
    const initializeClient = async () => {
      const newClient = new IonSfuClient("ws://localhost:7000/ws");
      setClient(newClient);

      const uid = `user-${Math.random().toString(36).substr(2, 9)}`;
      localUidRef.current = uid;

      try {
        await newClient.connect(roomId, uid);
        setIsConnected(true);
      } catch (error) {
        console.error("Error connecting to room:", error);
      }

      newClient.onTrack((track, stream) => {
        if (!isLocalStream(stream.id)) {
          setRemoteStreams((prev) => {
            const existingStreamIndex = prev.findIndex(
              (s) => s.id === stream.id
            );
            if (existingStreamIndex >= 0) {
              const newStreams = [...prev];
              newStreams[existingStreamIndex] = stream;
              return newStreams;
            } else {
              return [...prev, stream];
            }
          });
        }
      });
    };

    initializeClient();

    return () => {
      if (client) {
        client.close();
      }
    };
  }, [roomId, isLocalStream]);

  useEffect(() => {
    Object.keys(audioRefs.current).forEach((streamId) => {
      if (!remoteStreams.some((stream) => stream.id === streamId)) {
        audioRefs.current[streamId]?.remove();
        delete audioRefs.current[streamId];
      }
    });

    remoteStreams.forEach((stream) => {
      if (!isLocalStream(stream.id)) {
        if (audioRefs.current[stream.id]) {
          audioRefs.current[stream.id]!.srcObject = stream;
        } else {
          const audio = new Audio();
          audio.srcObject = stream;
          audio.autoplay = true;
          audioRefs.current[stream.id] = audio;
        }
      }
    });
  }, [remoteStreams, isLocalStream]);

  const startAudio = async () => {
    try {
      if (client) {
        if (localStream) {
          await client.publishStream(localStream);
        } else {
          const stream = await client.publishStream({
            audio: true,
            video: false,
          });
          setLocalStream(stream);
        }
      }
    } catch (error) {
      console.error("Error publishing audio:", error);
    }
  };

  const stopAudio = async () => {
    if (localStream && client) {
      try {
        await client.cleanupStream(localStream);
        setLocalStream(null);
      } catch (error) {
        console.error("Error unpublishing audio:", error);
      }
    }
  };

  const toggleMute = (stream: RemoteStream) => {
    const audioElement = audioRefs.current[stream.id];
    if (audioElement) {
      audioElement.muted = !audioElement.muted;
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Voice Chat</h2>
      {isConnected ? (
        <div>
          <p className="mb-2">Connected to room</p>
          {localStream ? (
            <button
              onClick={stopAudio}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Stop Audio
            </button>
          ) : (
            <button
              onClick={startAudio}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Start Audio
            </button>
          )}
          <div className="mt-4">
            <h3 className="text-xl font-semibold">Remote Streams:</h3>
            {remoteStreams
              .filter((stream) => !isLocalStream(stream.id))
              .map((stream) => (
                <div key={stream.id} className="mt-2">
                  Remote Stream: {stream.id.slice(0, 6)}...
                  <button
                    onClick={() => toggleMute(stream)}
                    className="ml-2 bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    Toggle Mute
                  </button>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <p>Connecting...</p>
      )}
    </div>
  );
};

export default VoiceChat;
