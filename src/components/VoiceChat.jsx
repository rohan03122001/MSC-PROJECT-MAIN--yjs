import React, { useEffect, useState, useRef, useCallback } from "react";
import IonSfuClient from "@/lib/ionSfuClient";
import {
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";

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

    const initializeClient = async () => {
      console.log("VoiceChat: Initializing client...");
      setConnectionStatus("Initializing");
      try {
        const wsUrl = `wss://rohanbhujbal.live/ws`;
        console.log(`VoiceChat: Using WebSocket URL: ${wsUrl}`);
        ionClient = new IonSfuClient(wsUrl);
        if (isMounted) setClient(ionClient);

        ionClient.setOnConnectionLost(() => {
          if (isMounted) {
            setConnectionStatus("Connection lost");
            setIsConnected(false);
          }
        });

        const uid = `user-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`VoiceChat: Generated UID: ${uid}`);
        localUidRef.current = uid;

        console.log(`VoiceChat: Attempting to connect to room ${roomId}...`);
        setConnectionStatus("Connecting");

        await ionClient.connect(roomId, uid);

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
      }
    };

    initializeClient();

    return () => {
      isMounted = false;
      if (ionClient) {
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
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Voice Chat
      </Typography>
      <Typography variant="body1" gutterBottom>
        Status: {connectionStatus}
      </Typography>
      {connectionError && (
        <Typography color="error" gutterBottom>
          Error: {connectionError}
        </Typography>
      )}
      {isConnected ? (
        <div>
          <Typography variant="body1" gutterBottom>
            Connected to room: {roomId}
          </Typography>
          {localStream ? (
            <Button
              variant="contained"
              color="error"
              startIcon={<MicOffIcon />}
              onClick={stopAudio}
              fullWidth
            >
              Stop Audio
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<MicIcon />}
              onClick={startAudio}
              fullWidth
            >
              Start Audio
            </Button>
          )}
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Remote Streams:
          </Typography>
          <List>
            {remoteStreams
              .filter((stream) => !isLocalStream(stream.id))
              .map((stream) => (
                <ListItem key={stream.id}>
                  <ListItemText
                    primary={`Remote Stream: ${stream.id.slice(0, 6)}...`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="toggle mute"
                      onClick={() => toggleMute(stream)}
                    >
                      {audioRefs.current[stream.id]?.muted ? (
                        <VolumeOffIcon />
                      ) : (
                        <VolumeUpIcon />
                      )}
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
          </List>
        </div>
      ) : (
        <Typography variant="body1">Connecting...</Typography>
      )}
    </Paper>
  );
};

export default VoiceChat;
