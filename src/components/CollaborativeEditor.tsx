import React, { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import dynamic from "next/dynamic";
import {
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  IconButton,
  useTheme,
} from "@mui/material";
import { Code as CodeIcon, History as HistoryIcon } from "@mui/icons-material";
import CodeExecutionEnvironment from "./CodeExecutionEnvironment";
import VersionControlModal from "./VersionControlModal";
import { supabase } from "@/lib/supabaseClient";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface CollaborativeEditorProps {
  roomId: string;
  initialLanguage: string;
}

function CollaborativeEditor({
  roomId,
  initialLanguage,
}: CollaborativeEditorProps) {
  const [language, setLanguage] = useState(initialLanguage || "javascript");
  const [editor, setEditor] = useState<any | null>(null);
  const [code, setCode] = useState("");
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const [users, setUsers] = useState<string[]>([]);
  const theme = useTheme();
  const [versionControlOpen, setVersionControlOpen] = useState(false);

  useEffect(() => {
    const setupCollaboration = async () => {
      if (!editor) return;

      // Clean up previous instances
      if (bindingRef.current) bindingRef.current.destroy();
      if (providerRef.current) providerRef.current.destroy();
      if (ydocRef.current) ydocRef.current.destroy();

      // Create new instances
      const ydoc = new Y.Doc();
      ydocRef.current = ydoc;

      const provider = new WebsocketProvider(
        `wss://rohanbhujbal.live`,
        `monaco-room-${roomId}`,
        ydoc
      );
      providerRef.current = provider;

      provider.on("status", (event: { status: string }) => {
        console.log("WebSocket connection status:", event.status);
      });

      provider.awareness.on("change", () => {
        const clients = Array.from(provider.awareness.getStates().values());
        setUsers(
          clients.map((client: any) => client.user?.name || "Anonymous")
        );
      });

      const ytext = ydoc.getText("monaco");

      const binding = new MonacoBinding(
        ytext,
        editor.getModel(),
        new Set([editor]),
        provider.awareness
      );
      bindingRef.current = binding;

      // Fetch initial content from Supabase
      const { data, error } = await supabase
        .from("code_versions")
        .select("snapshot")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching latest code:", error);
      } else if (data && data.snapshot) {
        ytext.delete(0, ytext.length);
        ytext.insert(0, data.snapshot);
      }

      
      ytext.observe(() => {
        setCode(ytext.toString());
      });
    };

    setupCollaboration();

    return () => {
      if (bindingRef.current) bindingRef.current.destroy();
      if (providerRef.current) providerRef.current.destroy();
      if (ydocRef.current) ydocRef.current.destroy();
    };
  }, [editor, roomId, language]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const handleRevert = (newCode: string) => {
    if (editor && ydocRef.current) {
      const ytext = ydocRef.current.getText("monaco");
      ytext.delete(0, ytext.length);
      ytext.insert(0, newCode);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        bgcolor: "background.paper",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{ display: "flex", alignItems: "center", color: "primary.main" }}
        >
          <CodeIcon sx={{ mr: 1 }} />
          Collaborative Editor
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <FormControl sx={{ minWidth: 120, mr: 2 }} size="small">
            <InputLabel id="language-select-label">Language</InputLabel>
            <Select
              labelId="language-select-label"
              value={language}
              onChange={(e) => setLanguage(e.target.value as string)}
              label="Language"
            >
              <MenuItem value="javascript">JavaScript</MenuItem>
              <MenuItem value="python">Python</MenuItem>
              <MenuItem value="java">Java</MenuItem>
              <MenuItem value="go">Go</MenuItem>
            </Select>
          </FormControl>
          <IconButton
            onClick={() => setVersionControlOpen(true)}
            color="primary"
            size="small"
          >
            <HistoryIcon />
          </IconButton>
        </Box>
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
          }}
          onMount={(editor) => {
            setEditor(editor);
          }}
          onChange={handleEditorChange}
        />
      </Box>
      <CodeExecutionEnvironment code={code} language={language} />
      <VersionControlModal
        open={versionControlOpen}
        onClose={() => setVersionControlOpen(false)}
        roomId={roomId}
        currentCode={code}
        onRevert={handleRevert}
      />
    </Paper>
  );
}

export default CollaborativeEditor;
