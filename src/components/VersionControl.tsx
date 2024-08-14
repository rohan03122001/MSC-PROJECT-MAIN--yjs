import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Box,
  TextField,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import {
  Save as SaveIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

interface Version {
  id: number;
  created_at: string;
  snapshot: string;
  name: string;
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
    if (!versionName.trim()) {
      showSnackbar("Please enter a version name", "error");
      return;
    }

    const { error } = await supabase
      .from("code_versions")
      .insert({ room_id: roomId, snapshot: currentCode, name: versionName });

    if (error) {
      console.error("Error saving version:", error);
      showSnackbar("Error saving version", "error");
    } else {
      showSnackbar("Version saved successfully", "success");
      setVersionName("");
    }
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
    <Box sx={{ maxHeight: "80vh", overflowY: "auto" }}>
      <Typography variant="h6" gutterBottom>
        Version Control
      </Typography>
      <Box sx={{ display: "flex", mb: 2 }}>
        <TextField
          value={versionName}
          onChange={(e) => setVersionName(e.target.value)}
          placeholder="Version name"
          variant="outlined"
          size="small"
          fullWidth
          sx={{ mr: 1 }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={saveVersion}
        >
          Save
        </Button>
      </Box>
      <List>
        <AnimatePresence>
          {versions.map((version) => (
            <motion.div
              key={version.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ListItem>
                <ListItemText
                  primary={version.name || `Version ${version.id}`}
                  secondary={new Date(version.created_at).toLocaleString()}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="revert"
                    onClick={() => revertToVersion(version.snapshot)}
                    sx={{ mr: 1 }}
                  >
                    <RestoreIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => deleteVersion(version.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </motion.div>
          ))}
        </AnimatePresence>
      </List>
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
    </Box>
  );
};

export default VersionControl;
