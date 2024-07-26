// types.ts

import { User } from "@supabase/supabase-js";

export interface AuthError {
  message: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  compile_output: string;
  message: string;
  time: string;
  memory: string;
}

export interface Room {
  id: string;
  name: string;
  language: string;
  created_at: string;
}

export interface Version {
  id: number;
  created_at: string;
  snapshot: string;
}

export interface RoomManagerProps {
  currentRoom: string | null;
  setCurrentRoom: (roomId: string | null) => void;
  setCurrentLanguage: (language: string) => void;
}

export interface CollaborativeEditorProps {
  roomId: string;
  initialLanguage: string;
}

export interface CodeExecutionEnvironmentProps {
  code: string;
  language: string;
}

export interface VoiceChatProps {
  roomId: string;
}

export interface VersionControlProps {
  roomId: string;
  currentCode: string;
  onRevert: (code: string) => void;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
}

// Add this type for any errors
export type ErrorWithMessage = {
  message: string;
};

// Add this type guard
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

// Add this helper function
export function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError));
  }
}

// Add this helper function
export function getErrorMessage(error: unknown) {
  return toErrorWithMessage(error).message;
}
