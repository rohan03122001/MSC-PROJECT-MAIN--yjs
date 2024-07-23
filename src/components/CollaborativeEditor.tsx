import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

import React, { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";

function CollaborativeEditor() {
  const ydoc = useMemo(() => new Y.Doc(), []);
  const [editor, setEditor] = useState<any | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [binding, setBinding] = useState<MonacoBinding | null>(null);

  useEffect(() => {
    const provider = new WebsocketProvider(
      "wss://demos.yjs.dev/ws",
      "monaco-next-demo",
      ydoc
    );
    setProvider(provider);
    return () => {
      provider?.destroy();
      ydoc.destroy();
    };
  }, [ydoc]);

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
      <Editor
        height="50vh"
        defaultValue="// Start coding here..."
        defaultLanguage="javascript"
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
