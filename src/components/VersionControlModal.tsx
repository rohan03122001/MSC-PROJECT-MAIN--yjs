import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
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

interface VersionControlModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  currentCode: string;
  onRevert: (code: string) => void;
}

const VersionControlModal: React.FC<VersionControlModalProps> = ({
  open,
  onClose,
  roomId,
  currentCode,
  onRevert,
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [versionName, setVersionName] = useState("");

  useEffect(() => {
    if (open) {
      fetchVersions();
    }
  }, [open, roomId]);

  const fetchVersions = async () => {
    const { data, error } = await supabase
      .from("code_versions")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching versions:", error);
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
    } else {
      fetchVersions();
      setVersionName("");
    }
  };

  const revertToVersion = (snapshot: string) => {
    onRevert(snapshot);
    onClose();
  };

  const deleteVersion = async (id: number) => {
    const { error } = await supabase
      .from("code_versions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting version:", error);
    } else {
      fetchVersions();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Version Control</DialogTitle>
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
          size="small"
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={saveVersion}
          fullWidth
          sx={{ mt: 2, mb: 2 }}
          size="small"
        >
          Save Current Version
        </Button>
        <Typography variant="subtitle2" gutterBottom>
          Previous Versions:
        </Typography>
        <List sx={{ maxHeight: 300, overflowY: "auto" }}>
          {versions.map((version) => (
            <ListItem key={version.id} divider>
              <ListItemText
                primary={version.name || `Version ${version.id}`}
                secondary={new Date(version.created_at).toLocaleString()}
                primaryTypographyProps={{ variant: "body2" }}
                secondaryTypographyProps={{ variant: "caption" }}
              />
              <ListItemSecondaryAction>
                <Tooltip title="Revert to this version">
                  <IconButton
                    edge="end"
                    aria-label="revert"
                    onClick={() => revertToVersion(version.snapshot)}
                    size="small"
                  >
                    <RestoreIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete this version">
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => deleteVersion(version.id)}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VersionControlModal;
