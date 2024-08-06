import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Room, RoomManagerProps, getErrorMessage } from "@/types";
import {
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Paper,
  Box,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import JoinFullIcon from "@mui/icons-material/JoinFull";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";

const RoomManager: React.FC<RoomManagerProps> = ({
  currentRoom,
  setCurrentRoom,
  setCurrentLanguage,
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomLanguage, setNewRoomLanguage] = useState("javascript");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchRooms();
    const subscription = supabase
      .channel("public:rooms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        fetchRooms
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchRooms() {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching rooms:", error);
      setError("Failed to fetch rooms. Please try again.");
    } else {
      setRooms((data as Room[]) || []);
      setError(null);
    }
  }

  function generateRoomId(): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  }

  async function createRoom() {
    if (!newRoomName.trim()) {
      setError("Please enter a room name.");
      return;
    }

    const newRoomId = generateRoomId();
    try {
      const { data, error } = await supabase
        .from("rooms")
        .insert({ id: newRoomId, name: newRoomName, language: newRoomLanguage })
        .select()
        .single();

      if (error) {
        console.error("Error creating room:", error);
        setError(`Failed to create room: ${error.message}`);
      } else if (data) {
        setNewRoomName("");
        setCurrentRoom(data.id);
        setCurrentLanguage(data.language);
        setError(null);
        router.push(`/room/${data.id}`);
      } else {
        console.error("Room created but no data returned");
        setError("An unexpected error occurred. Please try again.");
      }
    } catch (err) {
      console.error("Unexpected error:", getErrorMessage(err));
      setError(`An unexpected error occurred: ${getErrorMessage(err)}`);
    }
  }

  async function joinRoom(roomIdToJoin: string) {
    if (!roomIdToJoin) {
      setError("Please enter a room ID.");
      return;
    }

    const { data, error } = await supabase
      .from("rooms")
      .select()
      .eq("id", roomIdToJoin.toUpperCase())
      .single();

    if (error) {
      console.error("Error joining room:", error);
      setError("Failed to join room. Please try again.");
    } else if (data) {
      setCurrentRoom(data.id);
      setCurrentLanguage(data.language);
      setJoinRoomId("");
      setError(null);
      router.push(`/room/${data.id}`);
    } else {
      console.error("Room not found");
      setError("Room not found. Please check the room ID and try again.");
    }
  }

  function leaveRoom() {
    setCurrentRoom(null);
    router.push("/");
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Room Manager
      </Typography>
      {error && (
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      )}
      {!currentRoom ? (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Create a New Room
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="New Room Name"
              margin="normal"
            />
            <TextField
              fullWidth
              select
              variant="outlined"
              value={newRoomLanguage}
              onChange={(e) => setNewRoomLanguage(e.target.value)}
              SelectProps={{
                native: true,
              }}
              margin="normal"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="go">Go</option>
            </TextField>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={createRoom}
              startIcon={<AddIcon />}
            >
              Create Room
            </Button>
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Join a Room
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              placeholder="6-character Room ID to Join"
              margin="normal"
            />
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              onClick={() => joinRoom(joinRoomId)}
              startIcon={<JoinFullIcon />}
            >
              Join Room
            </Button>
          </Box>
          <Box>
            <Typography variant="h6" gutterBottom>
              Available Rooms:
            </Typography>
            <List>
              {rooms.map((room) => (
                <ListItem key={room.id}>
                  <ListItemText
                    primary={room.name}
                    secondary={`ID: ${room.id}, Language: ${room.language}`}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => joinRoom(room.id)}
                      size="small"
                    >
                      Join
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      ) : (
        <Box>
          <Typography variant="body1" gutterBottom>
            Current Room: {currentRoom}
          </Typography>
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={leaveRoom}
            startIcon={<ExitToAppIcon />}
          >
            Leave Room
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default RoomManager;
