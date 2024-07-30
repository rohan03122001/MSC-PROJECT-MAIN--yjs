import React, { useEffect, useState, useRef, useCallback } from "react";
import IonSfuClient from "@/lib/ionSfuClient";

const VoiceChat = ({ roomId }) => {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Initializing");
  const [connectionError, setConnectionError] = useState(null);
  const audioRefs = useRef({});
  const localUidRef = useRef("");

  const isLocalStream = useCallback(
    (streamId) => {
      return (
        streamId === localUidRef.current ||
        (localStream && streamId === localStream.id)
      );
    },
    [localStream]
  );

  useEffect(() => {
    let ionClient = null;
    let isMounted = true;
    let isConnecting = false;

    const initializeClient = async () => {
      console.log("VoiceChat: Initializing client...");
      setConnectionStatus("Initializing");
      try {
        const wsUrl = `ws://${process.env.NEXT_PUBLIC_VM_IP}:7000/ws`;
        console.log(`VoiceChat: Using WebSocket URL: ${wsUrl}`);
        ionClient = new IonSfuClient(wsUrl);
        if (isMounted) setClient(ionClient);

        const uid = `user-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`VoiceChat: Generated UID: ${uid}`);
        localUidRef.current = uid;

        console.log(`VoiceChat: Attempting to connect to room ${roomId}...`);
        setConnectionStatus("Connecting");
        isConnecting = true;

        const connectionPromise = ionClient.connect(roomId, uid);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Connection timeout")), 10000)
        );
        await Promise.race([connectionPromise, timeoutPromise]);

        if (isMounted) {
          console.log(`VoiceChat: Connected successfully to room ${roomId}`);
          setIsConnected(true);
          setConnectionStatus("Connected");
          setConnectionError(null);
        }

        ionClient.onTrack((track, stream) => {
          console.log(
            `VoiceChat: Received track ${track.kind} for stream ${stream.id}`
          );
          setRemoteStreams((prevStreams) => {
            if (!prevStreams.some((s) => s.id === stream.id)) {
              console.log(`VoiceChat: Adding new remote stream ${stream.id}`);
              return [...prevStreams, stream];
            }
            return prevStreams;
          });
        });
      } catch (error) {
        console.error(`VoiceChat: Error connecting to room ${roomId}:`, error);
        if (isMounted) {
          setConnectionStatus("Connection failed");
          setConnectionError(error.message || "Unknown error occurred");
        }
      } finally {
        isConnecting = false;
      }
    };

    initializeClient();

    return () => {
      isMounted = false;
      if (ionClient && !isConnecting) {
        console.log("VoiceChat: Closing client connection");
        ionClient.close();
      }
    };
  }, [roomId]);

  useEffect(() => {
    console.log("VoiceChat: Remote streams updated:", remoteStreams);
    Object.keys(audioRefs.current).forEach((streamId) => {
      if (!remoteStreams.some((stream) => stream.id === streamId)) {
        console.log(
          `VoiceChat: Removing audio element for stream: ${streamId}`
        );
        audioRefs.current[streamId]?.remove();
        delete audioRefs.current[streamId];
      }
    });

    remoteStreams.forEach((stream) => {
      if (!isLocalStream(stream.id)) {
        if (audioRefs.current[stream.id]) {
          console.log(
            `VoiceChat: Updating existing audio element for stream: ${stream.id}`
          );
          audioRefs.current[stream.id].srcObject = stream;
        } else {
          console.log(
            `VoiceChat: Creating new audio element for stream: ${stream.id}`
          );
          const audio = new Audio();
          audio.srcObject = stream;
          audio.autoplay = true;
          audioRefs.current[stream.id] = audio;
        }
      }
    });
  }, [remoteStreams, isLocalStream]);

  const startAudio = async () => {
    console.log("VoiceChat: Starting audio");
    try {
      if (client) {
        if (localStream) {
          console.log(
            `VoiceChat: Publishing existing local stream ${localStream.id}`
          );
          await client.publishStream(localStream);
        } else {
          console.log("VoiceChat: Creating and publishing new local stream");
          const stream = await client.publishStream({
            audio: true,
            video: false,
          });
          console.log(`VoiceChat: Local stream created with ID ${stream.id}`);
          setLocalStream(stream);
        }
      }
    } catch (error) {
      console.error("VoiceChat: Error publishing audio:", error);
    }
  };

  const stopAudio = async () => {
    console.log("VoiceChat: Stopping audio");
    if (localStream && client) {
      try {
        console.log(`VoiceChat: Cleaning up local stream ${localStream.id}`);
        await client.cleanupStream(localStream);
        setLocalStream(null);
      } catch (error) {
        console.error(
          `VoiceChat: Error unpublishing audio for stream ${localStream.id}:`,
          error
        );
      }
    }
  };

  const toggleMute = (stream) => {
    console.log(`VoiceChat: Toggling mute for stream: ${stream.id}`);
    const audioElement = audioRefs.current[stream.id];
    if (audioElement) {
      audioElement.muted = !audioElement.muted;
      console.log(`VoiceChat: Stream ${stream.id} muted:`, audioElement.muted);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-2xl font-bold">Voice Chat</h2>
      <p>Status: {connectionStatus}</p>
      {connectionError && (
        <p className="text-red-500">Error: {connectionError}</p>
      )}
      {isConnected ? (
        <div className="space-y-4">
          <p className="font-semibold">Connected to room: {roomId}</p>
          {localStream ? (
            <button
              onClick={stopAudio}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors w-full"
            >
              Stop Audio
            </button>
          ) : (
            <button
              onClick={startAudio}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors w-full"
            >
              Start Audio
            </button>
          )}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Remote Streams:</h3>
            {remoteStreams
              .filter((stream) => !isLocalStream(stream.id))
              .map((stream) => (
                <div
                  key={stream.id}
                  className="flex justify-between items-center"
                >
                  <span>Remote Stream: {stream.id.slice(0, 6)}...</span>
                  <button
                    onClick={() => toggleMute(stream)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors"
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
