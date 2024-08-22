import React, { useEffect, useState, useRef, useCallback } from "react";
import IonSfuClient from "@/lib/ionSfuClient";
import {
  Paper,
  Typography,
  IconButton,
  Box,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Fade,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VoiceChatIcon from "@mui/icons-material/VoiceChat";
import PersonIcon from "@mui/icons-material/Person";

const VoiceChat = ({ roomId }) => {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Initializing");
  const [connectionError, setConnectionError] = useState(null);
  const audioRefs = useRef({});
  const localUidRef = useRef("");
  const [isMuted, setIsMuted] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  const showSnackbar = (message, severity = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  useEffect(() => {
    console.log("VoiceChat: Component mounted");
    let ionClient = null;

    const initializeClient = async () => {
      console.log("VoiceChat: Initializing client...");
      setConnectionStatus("Initializing");
      try {
        const wsUrl = `wss://rohanbhujbal.live/ws`;
        console.log(`VoiceChat: Using WebSocket URL: ${wsUrl}`);
        ionClient = new IonSfuClient(wsUrl);
        setClient(ionClient);

        ionClient.setOnConnectionLost(() => {
          console.log("VoiceChat: Connection lost");
          setConnectionStatus("Connection lost");
          setIsConnected(false);
          showSnackbar(
            "Voice chat connection lost. Trying to reconnect...",
            "warning"
          );
        });

        const uid = `user-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`VoiceChat: Generated UID: ${uid}`);
        localUidRef.current = uid;

        console.log(`VoiceChat: Attempting to connect to room ${roomId}...`);
        setConnectionStatus("Connecting");

        await ionClient.connect(roomId, uid);

        console.log(`VoiceChat: Connected successfully to room ${roomId}`);
        setIsConnected(true);
        setConnectionStatus("Connected");
        setConnectionError(null);
        showSnackbar("Connected to voice chat", "success");

        console.log("VoiceChat: Auto-starting audio");
        await startAudio(ionClient);

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
        setConnectionStatus("Connection failed");
        setConnectionError(error.message || "Unknown error occurred");
        showSnackbar("Failed to connect to voice chat", "error");
      }
    };

    initializeClient();

    return () => {
      console.log("VoiceChat: Component unmounting, cleaning up");
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
  }, [remoteStreams]);

  const isLocalStream = useCallback(
    (streamId) => {
      return (
        streamId === localUidRef.current ||
        (localStream && streamId === localStream.id)
      );
    },
    [localStream]
  );

  const startAudio = async (clientInstance) => {
    console.log("VoiceChat: Starting audio");
    try {
      if (clientInstance) {
        const stream = await clientInstance.publishStream({
          audio: true,
          video: false,
        });
        console.log(`VoiceChat: Local stream created with ID ${stream.id}`);
        setLocalStream(stream);
        setIsMuted(false);
        showSnackbar("Microphone turned on", "success");
      }
    } catch (error) {
      console.error("VoiceChat: Error publishing audio:", error);
      showSnackbar("Failed to turn on microphone", "error");
    }
  };

  const toggleMute = () => {
    console.log(`VoiceChat: Toggling local mute`);
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
      showSnackbar(
        `Microphone ${audioTrack.enabled ? "unmuted" : "muted"}`,
        "info"
      );
    }
  };

  const toggleRemoteMute = (stream) => {
    console.log(`VoiceChat: Toggling mute for remote stream: ${stream.id}`);
    const audioElement = audioRefs.current[stream.id];
    if (audioElement) {
      audioElement.muted = !audioElement.muted;
      console.log(
        `VoiceChat: Remote stream ${stream.id} muted:`,
        audioElement.muted
      );
      showSnackbar(
        `${audioElement.muted ? "Muted" : "Unmuted"} remote user`,
        "info"
      );
    }
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography
        variant="h6"
        sx={{ mb: 2, display: "flex", alignItems: "center" }}
      >
        <VoiceChatIcon sx={{ mr: 1 }} />
        Voice Chat
      </Typography>
      <Typography variant="body2" gutterBottom color="text.secondary">
        Status: {connectionStatus}
      </Typography>
      {connectionError && (
        <Typography color="error" gutterBottom variant="body2">
          Error: {connectionError}
        </Typography>
      )}
      {isConnected ? (
        <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
          <List dense>
            <ListItem>
              <ListItemAvatar>
                <Avatar>
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="You"
                secondary={isMuted ? "Muted" : "Speaking"}
              />
              <IconButton
                onClick={toggleMute}
                color={isMuted ? "error" : "primary"}
                size="small"
              >
                {isMuted ? (
                  <MicOffIcon fontSize="small" />
                ) : (
                  <MicIcon fontSize="small" />
                )}
              </IconButton>
            </ListItem>
            {remoteStreams
              .filter((stream) => !isLocalStream(stream.id))
              .map((stream) => (
                <ListItem key={stream.id}>
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`User ${stream.id.slice(0, 6)}...`}
                    secondary={
                      audioRefs.current[stream.id]?.muted ? "Muted" : "Speaking"
                    }
                  />
                  <IconButton
                    edge="end"
                    aria-label="toggle mute"
                    onClick={() => toggleRemoteMute(stream)}
                    color="primary"
                    size="small"
                  >
                    {audioRefs.current[stream.id]?.muted ? (
                      <VolumeOffIcon fontSize="small" />
                    ) : (
                      <VolumeUpIcon fontSize="small" />
                    )}
                  </IconButton>
                </ListItem>
              ))}
          </List>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexGrow: 1,
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}
    </Box>
  );
};

export default VoiceChat;
