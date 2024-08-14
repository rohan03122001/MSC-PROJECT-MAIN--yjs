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
  Chip,
  Tooltip,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  PersonOutline,
  Settings,
  Brightness4,
  Brightness7,
} from "@mui/icons-material";
import CodeExecutionEnvironment from "./CodeExecutionEnvironment";
import VersionControl from "./VersionControl";
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
  const [theme, setTheme] = useState<"vs-dark" | "light">("vs-dark");
  const [settingsOpen, setSettingsOpen] = useState(false);

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

      // Update local state when the shared document changes
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

  const toggleTheme = () => {
    setTheme(theme === "vs-dark" ? "light" : "vs-dark");
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5">Collaborative Editor</Typography>
        <Box>
          {users.map((user, index) => (
            <Tooltip key={index} title={user}>
              <Chip
                icon={<PersonOutline />}
                label={user.charAt(0).toUpperCase()}
                sx={{ mr: 1 }}
              />
            </Tooltip>
          ))}
        </Box>
      </Box>
      <FormControl fullWidth margin="normal">
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
      <Editor
        height="50vh"
        language={language}
        theme={theme}
        options={{
          minimap: { enabled: false },
          fontSize: 16,
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
      <VersionControl
        roomId={roomId}
        currentCode={code}
        onRevert={handleRevert}
      />
      <CodeExecutionEnvironment code={code} language={language} />
    </Paper>
  );
}

export default CollaborativeEditor;
