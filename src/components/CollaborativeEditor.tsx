// components/CollaborativeEditor.tsx

import React, { useEffect, useMemo, useState } from "react";
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

// Function to get starter code for different languages
const getStarterCode = (lang: string) => {
  switch (lang) {
    case "javascript":
      return "// JavaScript starter code\nconsole.log('Hello, World!');";
    case "python":
      return "# Python starter code\nprint('Hello, World!')";
    case "java":
      return '// Java starter code\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}';
    case "go":
      return '// Go starter code\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}';
    default:
      return "// Start coding here...";
  }
};
function CollaborativeEditor({
  roomId,
  initialLanguage,
}: CollaborativeEditorProps) {
  const [language, setLanguage] = useState(initialLanguage || "javascript");
  const ydoc = useMemo(() => new Y.Doc(), []);
  const [editor, setEditor] = useState<any | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [binding, setBinding] = useState<MonacoBinding | null>(null);
  const [code, setCode] = useState("");

  // Fetch the latest code version when component mounts
  useEffect(() => {
    const fetchLatestCode = async () => {
      const { data, error } = await supabase
        .from("code_versions")
        .select("snapshot")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching latest code:", error);
        setCode(getStarterCode(language));
      } else if (data) {
        setCode(data.snapshot);
      } else {
        setCode(getStarterCode(language));
      }
    };

    fetchLatestCode();
  }, [roomId, language]);

  // Set up WebSocket provider and Monaco binding
  useEffect(() => {
    const provider = new WebsocketProvider(
      "wss://demos.yjs.dev",
      `monaco-demo-${roomId}`,
      ydoc
    );
    setProvider(provider);
    return () => {
      provider?.destroy();
      ydoc.destroy();
    };
  }, [ydoc, roomId]);

  useEffect(() => {
    if (provider == null || editor == null) {
      return;
    }
    const binding = new MonacoBinding(
      ydoc.getText("monaco"),
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );
    setBinding(binding);

    // Add a cleanup function to remove stale cursors
    return () => {
      binding.destroy();
      provider.awareness.setLocalStateField("user", null);
      provider.awareness.setLocalStateField("cursor", null);
    };
  }, [ydoc, provider, editor]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const handleRevert = (newCode: string) => {
    if (editor) {
      editor.setValue(newCode);
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
        value={code}
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
