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
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import RestoreIcon from "@mui/icons-material/Restore";

interface Version {
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

  useEffect(() => {
    fetchVersions();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`room-${roomId}-versions`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "code_versions",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setVersions((currentVersions) => [
            payload.new as Version,
            ...currentVersions,
          ]);
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
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
    } else {
      setVersions(data || []);
    }
  };

  const saveVersion = async () => {
    const { error } = await supabase
      .from("code_versions")
      .insert({ room_id: roomId, snapshot: currentCode });

    if (error) {
      console.error("Error saving version:", error);
    }
  };

  const revertToVersion = (snapshot: string) => {
    onRevert(snapshot);
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
        onClick={saveVersion}
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
              primary={new Date(version.created_at).toLocaleString()}
            />
            <ListItemSecondaryAction>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RestoreIcon />}
                onClick={() => revertToVersion(version.snapshot)}
              >
                Revert
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default VersionControl;
