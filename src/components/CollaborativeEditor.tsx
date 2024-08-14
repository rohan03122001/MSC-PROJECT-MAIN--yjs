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
  Collapse,
} from "@mui/material";
import {
  PersonOutline,
  Settings,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import CodeExecutionEnvironment from "./CodeExecutionEnvironment";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface CollaborativeEditorProps {
  roomId: string;
  initialLanguage: string;
  onCodeChange: (code: string) => void;
}

function CollaborativeEditor({
  roomId,
  initialLanguage,
  onCodeChange,
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
  const [expandExecution, setExpandExecution] = useState(false);

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
        const newCode = ytext.toString();
        setCode(newCode);
        onCodeChange(newCode);
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
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
            <AnimatePresence>
              {users.map((user, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: "inline-block", marginRight: "8px" }}
                >
                  <Tooltip title={user}>
                    <Chip
                      icon={<PersonOutline />}
                      label={user.charAt(0).toUpperCase()}
                    />
                  </Tooltip>
                </motion.div>
              ))}
            </AnimatePresence>
            <IconButton onClick={() => setSettingsOpen(true)}>
              <Settings />
            </IconButton>
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
        <Box sx={{ height: "60vh", mb: 2 }}>
          <Editor
            height="100%"
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
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="h6"
            onClick={() => setExpandExecution(!expandExecution)}
            sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            Code Execution
            {expandExecution ? <ExpandLess /> : <ExpandMore />}
          </Typography>
          <Collapse in={expandExecution}>
            <CodeExecutionEnvironment code={code} language={language} />
          </Collapse>
        </Box>
      </Paper>
    </motion.div>
  );
}

export default CollaborativeEditor;
