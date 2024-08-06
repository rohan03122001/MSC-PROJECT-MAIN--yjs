// components/CollaborativeEditor.tsx

import React, { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
import CodeExecutionEnvironment from "./CodeExecutionEnvironment";
import VersionControl from "./VersionControl";
import { supabase } from "@/lib/supabaseClient";

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="go">Go</option>
        </select>
      </div>
      <Editor
        height="50vh"
        language={language}
        theme="vs-dark"
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
    </div>
  );
}

export default CollaborativeEditor;
