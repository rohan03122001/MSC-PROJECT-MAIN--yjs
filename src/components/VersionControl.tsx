import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import RestoreIcon from "@mui/icons-material/Restore";
import DeleteIcon from "@mui/icons-material/Delete";

interface Version {
  name: string;
  id: number;
  created_at: string;
  snapshot: string;
}

interface VersionControlProps {
  roomId: string;
  currentCode: string;
  onRevert: (code: string) => void;
}

const VersionControl: React.FC<VersionControlProps> = ({
  roomId,
  currentCode,
  onRevert,
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [versionName, setVersionName] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  useEffect(() => {
    fetchVersions();

    const subscription = supabase
      .channel(`room-${roomId}-versions`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "code_versions",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setVersions((currentVersions) => [
              payload.new as Version,
              ...currentVersions,
            ]);
          } else if (payload.eventType === "DELETE") {
            setVersions((currentVersions) =>
              currentVersions.filter((v) => v.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  const fetchVersions = async () => {
    const { data, error } = await supabase
      .from("code_versions")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching versions:", error);
      showSnackbar("Error fetching versions", "error");
    } else {
      setVersions(data || []);
    }
  };

  const saveVersion = async () => {
    const { error } = await supabase
      .from("code_versions")
      .insert({ room_id: roomId, snapshot: currentCode, name: versionName });

    if (error) {
      console.error("Error saving version:", error);
      showSnackbar("Error saving version", "error");
    } else {
      showSnackbar("Version saved successfully", "success");
    }
    setSaveDialogOpen(false);
    setVersionName("");
  };

  const revertToVersion = (snapshot: string) => {
    onRevert(snapshot);
    showSnackbar("Reverted to selected version", "success");
  };

  const deleteVersion = async (id: number) => {
    const { error } = await supabase
      .from("code_versions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting version:", error);
      showSnackbar("Error deleting version", "error");
    } else {
      showSnackbar("Version deleted successfully", "success");
    }
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Version Control
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<SaveIcon />}
        onClick={() => setSaveDialogOpen(true)}
        fullWidth
        sx={{ mb: 2 }}
      >
        Save Current Version
      </Button>
      <Typography variant="subtitle1" gutterBottom>
        Previous Versions:
      </Typography>
      <List>
        {versions.map((version) => (
          <ListItem key={version.id}>
            <ListItemText
              primary={version.name || `Version ${version.id}`}
              secondary={new Date(version.created_at).toLocaleString()}
            />
            <ListItemSecondaryAction>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RestoreIcon />}
                onClick={() => revertToVersion(version.snapshot)}
                sx={{ mr: 1 }}
              >
                Revert
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => deleteVersion(version.id)}
              >
                Delete
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Version</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Version Name"
            type="text"
            fullWidth
            variant="outlined"
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveVersion} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default VersionControl;
