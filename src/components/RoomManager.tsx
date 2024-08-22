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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Divider,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import JoinFullIcon from "@mui/icons-material/JoinFull";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
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
        setSuccessMessage(`Room "${data.name}" created successfully!`);
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
      setSuccessMessage(`Joined room "${data.name}" successfully!`);
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

  async function deleteRoom(roomId: string) {
    try {
      const { error } = await supabase.from("rooms").delete().eq("id", roomId);

      if (error) {
        console.error("Error deleting room:", error);
        setError(`Failed to delete room: ${error.message}`);
      } else {
        setSuccessMessage("Room deleted successfully!");
        fetchRooms();
      }
    } catch (err) {
      console.error("Unexpected error:", getErrorMessage(err));
      setError(`An unexpected error occurred: ${getErrorMessage(err)}`);
    }
    setDeleteDialogOpen(false);
    setRoomToDelete(null);
  }

  return (
    <Paper elevation={3} sx={{ p: 3, bgcolor: "background.paper" }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", color: "primary.main" }}
      >
        <MeetingRoomIcon sx={{ mr: 1 }} />
        Room Manager
      </Typography>
      <Snackbar
        open={!!error || !!successMessage}
        autoHideDuration={6000}
        onClose={() => {
          setError(null);
          setSuccessMessage(null);
        }}
      >
        <Alert
          onClose={() => {
            setError(null);
            setSuccessMessage(null);
          }}
          severity={error ? "error" : "success"}
          sx={{ width: "100%" }}
        >
          {error || successMessage}
        </Alert>
      </Snackbar>
      {!currentRoom ? (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: "text.primary" }}
            >
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
            <FormControl fullWidth margin="normal">
              <InputLabel id="language-select-label">Language</InputLabel>
              <Select
                labelId="language-select-label"
                value={newRoomLanguage}
                onChange={(e) => setNewRoomLanguage(e.target.value as string)}
                label="Language"
              >
                <MenuItem value="javascript">JavaScript</MenuItem>
                <MenuItem value="python">Python</MenuItem>
                <MenuItem value="java">Java</MenuItem>
                <MenuItem value="go">Go</MenuItem>
              </Select>
            </FormControl>
            <Button
              fullWidth
              variant="contained"
              onClick={createRoom}
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
            >
              Create Room
            </Button>
          </Box>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: "text.primary" }}
            >
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
              onClick={() => joinRoom(joinRoomId)}
              startIcon={<JoinFullIcon />}
              sx={{ mt: 2 }}
            >
              Join Room
            </Button>
          </Box>
          <Divider sx={{ my: 3 }} />
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: "text.primary" }}
            >
              Available Rooms
            </Typography>
            <List>
              {rooms.map((room) => (
                <ListItem key={room.id} divider>
                  <ListItemText
                    primary={room.name}
                    secondary={`ID: ${room.id}, Language: ${room.language}`}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Join Room">
                      <IconButton
                        edge="end"
                        aria-label="join"
                        onClick={() => joinRoom(room.id)}
                        sx={{ mr: 1 }}
                      >
                        <JoinFullIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Room">
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => {
                          setRoomToDelete(room.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Tooltip title="Refresh Room List">
                <IconButton onClick={fetchRooms} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
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
            onClick={leaveRoom}
            startIcon={<ExitToAppIcon />}
            color="error"
            sx={{ mt: 2 }}
          >
            Leave Room
          </Button>
        </Box>
      )}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Delete Room?"}</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this room? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => roomToDelete && deleteRoom(roomToDelete)}
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default RoomManager;
