// supabaseClient.ts
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export const signUp = async (email: string, password: string) => {
  const { user, error } = await supabase.auth.signUp({ email, password });
  return { user, error };
};

export const signIn = async (email: string, password: string) => {
  const { user, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { user, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async (): Promise<User | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

export const createRoom = async (
  name: string,
  initialFile: { name: string; content: string; language: string }
) => {
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .insert({ name })
    .select()
    .single();

  if (roomError) {
    throw roomError;
  }

  const { error: fileError } = await supabase
    .from("files")
    .insert({ ...initialFile, room_id: room.id });

  if (fileError) {
    throw fileError;
  }

  return room;
};

export const getRoomWithFiles = async (roomId: string) => {
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomError) {
    throw roomError;
  }

  const { data: files, error: filesError } = await supabase
    .from("files")
    .select("*")
    .eq("room_id", roomId);

  if (filesError) {
    throw filesError;
  }

  return { ...room, files };
};

export const createFile = async (
  roomId: string,
  name: string,
  content: string,
  language: string
) => {
  const { data, error } = await supabase
    .from("files")
    .insert({ room_id: roomId, name, content, language })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updateFile = async (fileId: string, content: string) => {
  const { data, error } = await supabase
    .from("files")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", fileId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const deleteFile = async (fileId: string) => {
  const { error } = await supabase.from("files").delete().eq("id", fileId);

  if (error) {
    throw error;
  }
};
