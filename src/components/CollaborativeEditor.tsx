// components/CollaborativeEditor.tsx
import React, { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import dynamic from "next/dynamic";
import { createFile, updateFile, deleteFile } from "@/lib/supabaseClient";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
import CodeExecutionEnvironment from "./CodeExecutionEnvironment";
import FileManager from "./FileManager";

interface CollaborativeEditorProps {
  roomId: string;
  initialFiles: File[];
}

interface File {
  id: string;
  name: string;
  content: string;
  language: string;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  roomId,
  initialFiles,
}) => {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [activeFileId, setActiveFileId] = useState(initialFiles[0]?.id || "");
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
    if (provider == null || editor == null || !activeFileId) {
      return;
    }
    const ytext = ydoc.getText(`file_${activeFileId}`);
    const binding = new MonacoBinding(
      ytext,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );
    setBinding(binding);
    return () => {
      binding.destroy();
    };
  }, [ydoc, provider, editor, activeFileId]);

  const handleEditorChange = async (value: string | undefined) => {
    if (value !== undefined && activeFileId) {
      try {
        await updateFile(activeFileId, value);
        setFiles((prevFiles) =>
          prevFiles.map((file) =>
            file.id === activeFileId ? { ...file, content: value } : file
          )
        );
      } catch (error) {
        console.error("Error updating file:", error);
      }
    }
  };

  const handleFileSelect = (fileId: string) => {
    setActiveFileId(fileId);
  };

  const handleFileCreate = async (fileName: string, language: string) => {
    try {
      const newFile = await createFile(roomId, fileName, "", language);
      setFiles((prevFiles) => [...prevFiles, newFile]);
      setActiveFileId(newFile.id);
    } catch (error) {
      console.error("Error creating file:", error);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      await deleteFile(fileId);
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
      if (activeFileId === fileId) {
        setActiveFileId(files[0]?.id || "");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const activeFile = files.find((file) => file.id === activeFileId);

  return (
    <div className="collaborative-editor">
      <FileManager
        files={files}
        activeFile={activeFileId}
        onFileSelect={handleFileSelect}
        onFileCreate={handleFileCreate}
        onFileDelete={handleFileDelete}
      />
      {activeFile && (
        <>
          <Editor
            height="50vh"
            value={activeFile.content}
            language={activeFile.language}
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
          <CodeExecutionEnvironment
            code={activeFile.content}
            language={activeFile.language}
          />
        </>
      )}
    </div>
  );
};

export default CollaborativeEditor;
