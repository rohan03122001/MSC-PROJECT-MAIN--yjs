// components/FileManager.tsx
import React, { useState } from "react";

interface File {
  id: string;
  name: string;
  content: string;
  language: string;
}

interface FileManagerProps {
  files: File[];
  activeFile: string;
  onFileSelect: (fileId: string) => void;
  onFileCreate: (fileName: string, language: string) => void;
  onFileDelete: (fileId: string) => void;
}

const FileManager: React.FC<FileManagerProps> = ({
  files,
  activeFile,
  onFileSelect,
  onFileCreate,
  onFileDelete,
}) => {
  const [newFileName, setNewFileName] = useState("");
  const [newFileLanguage, setNewFileLanguage] = useState("javascript");

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      onFileCreate(newFileName.trim(), newFileLanguage);
      setNewFileName("");
    }
  };

  return (
    <div className="file-manager p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Files</h3>
      <ul className="mb-4">
        {files.map((file) => (
          <li
            key={file.id}
            className={`cursor-pointer p-2 rounded ${
              activeFile === file.id ? "bg-blue-200" : "hover:bg-gray-200"
            }`}
            onClick={() => onFileSelect(file.id)}
          >
            {file.name}
            <button
              className="ml-2 text-red-500 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                onFileDelete(file.id);
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center">
        <input
          type="text"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          placeholder="New file name"
          className="flex-grow p-2 border rounded mr-2"
        />
        <select
          value={newFileLanguage}
          onChange={(e) => setNewFileLanguage(e.target.value)}
          className="p-2 border rounded mr-2"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="go">Go</option>
        </select>
        <button
          onClick={handleCreateFile}
          className="bg-green-500 text-white p-2 rounded"
        >
          Create
        </button>
      </div>
    </div>
  );
};

export default FileManager;
