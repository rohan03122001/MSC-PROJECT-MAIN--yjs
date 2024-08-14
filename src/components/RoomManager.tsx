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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import JoinFullIcon from "@mui/icons-material/JoinFull";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";

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
    <Paper elevation={3} sx={{ p: 3, bgcolor: "#1E1E1E" }}>
      <Typography variant="h5" gutterBottom sx={{ color: "#90CAF9" }}>
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
            <Typography variant="h6" gutterBottom sx={{ color: "#E0E0E0" }}>
              Create a New Room
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="New Room Name"
              margin="normal"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#424242",
                  },
                  "&:hover fieldset": {
                    borderColor: "#616161",
                  },
                },
                "& .MuiInputBase-input": {
                  color: "#E0E0E0",
                },
              }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="language-select-label" sx={{ color: "#E0E0E0" }}>
                Language
              </InputLabel>
              <Select
                labelId="language-select-label"
                value={newRoomLanguage}
                onChange={(e) => setNewRoomLanguage(e.target.value as string)}
                label="Language"
                sx={{
                  color: "#E0E0E0",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#424242",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#616161",
                  },
                }}
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
              sx={{
                mt: 2,
                bgcolor: "#424242",
                color: "#E0E0E0",
                "&:hover": { bgcolor: "#616161", color: "#E0E0E0" },
              }}
            >
              Create Room
            </Button>
          </Box>
          <Divider sx={{ my: 3, bgcolor: "#424242" }} />
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: "#E0E0E0" }}>
              Join a Room
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              placeholder="6-character Room ID to Join"
              margin="normal"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#424242",
                  },
                  "&:hover fieldset": {
                    borderColor: "#616161",
                  },
                },
                "& .MuiInputBase-input": {
                  color: "#E0E0E0",
                },
              }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={() => joinRoom(joinRoomId)}
              startIcon={<JoinFullIcon />}
              sx={{
                mt: 2,
                bgcolor: "#424242",
                color: "#E0E0E0",
                "&:hover": { bgcolor: "#616161", color: "#E0E0E0" },
              }}
            >
              Join Room
            </Button>
          </Box>
          <Divider sx={{ my: 3, bgcolor: "#424242" }} />
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: "#E0E0E0" }}>
              Available Rooms
            </Typography>
            <List>
              {rooms.map((room) => (
                <ListItem
                  key={room.id}
                  divider
                  sx={{ borderBottomColor: "#424242" }}
                >
                  <ListItemText
                    primary={room.name}
                    secondary={`ID: ${room.id}, Language: ${room.language}`}
                    primaryTypographyProps={{ color: "#E0E0E0" }}
                    secondaryTypographyProps={{ color: "#BDBDBD" }}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="outlined"
                      onClick={() => joinRoom(room.id)}
                      size="small"
                      sx={{ color: "#90CAF9", borderColor: "#90CAF9", mr: 1 }}
                    >
                      Join
                    </Button>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => {
                        setRoomToDelete(room.id);
                        setDeleteDialogOpen(true);
                      }}
                      sx={{ color: "#F44336" }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <IconButton onClick={fetchRooms} sx={{ color: "#90CAF9" }}>
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box>
          <Typography variant="body1" gutterBottom sx={{ color: "#E0E0E0" }}>
            Current Room: {currentRoom}
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={leaveRoom}
            startIcon={<ExitToAppIcon />}
            sx={{
              mt: 2,
              bgcolor: "#D32F2F",
              "&:hover": { bgcolor: "#C62828" },
            }}
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
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
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
