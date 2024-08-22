// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import JoinFullIcon from "@mui/icons-material/JoinFull";

interface Room {
  id: string;
  name: string;
  language: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomLanguage, setNewRoomLanguage] = useState("javascript");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    } else if (user) {
      fetchRooms();
    }
  }, [user, loading, router]);

  async function fetchRooms() {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching rooms:", error);
    } else {
      setRooms(data as Room[]);
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
    if (!newRoomName.trim()) return;

    const newRoomId = generateRoomId();
    const { data, error } = await supabase
      .from("rooms")
      .insert({ id: newRoomId, name: newRoomName, language: newRoomLanguage })
      .select()
      .single();

    if (error) {
      console.error("Error creating room:", error);
    } else if (data) {
      setNewRoomName("");
      router.push(`/room/${data.id}`);
    }
  }

  async function joinRoom(roomId: string) {
    const { data, error } = await supabase
      .from("rooms")
      .select()
      .eq("id", roomId.toUpperCase())
      .single();

    if (error) {
      console.error("Error joining room:", error);
    } else if (data) {
      router.push(`/room/${data.id}`);
    }
  }

  async function deleteRoom(roomId: string) {
    const { error } = await supabase.from("rooms").delete().eq("id", roomId);

    if (error) {
      console.error("Error deleting room:", error);
    } else {
      fetchRooms();
    }
    setDeleteDialogOpen(false);
    setRoomToDelete(null);
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to DisCoder
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Create a New Room
            </Typography>
            <TextField
              fullWidth
              label="Room Name"
              variant="outlined"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
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
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Join a Room
            </Typography>
            <TextField
              fullWidth
              label="Room ID"
              variant="outlined"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              placeholder="Enter 6-character Room ID"
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
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Rooms
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
          </Paper>
        </Grid>
      </Grid>
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
    </Container>
  );
}
