// CollaborativeEditor.tsx
import React, { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import Editor from "@monaco-editor/react";

interface CollaborativeEditorProps {
  roomId: string;
  initialLanguage: string;
}

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
    return () => {
      binding.destroy();
    };
  }, [ydoc, provider, editor]);
  return (
    <div className="border-t border-gray-200">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="mb-2 p-2 border rounded"
      >
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
        <option value="go">Go</option>
      </select>
      <Editor
        height="50vh"
        defaultValue={getStarterCode(language)}
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
      />
    </div>
  );
}

export default CollaborativeEditor;
