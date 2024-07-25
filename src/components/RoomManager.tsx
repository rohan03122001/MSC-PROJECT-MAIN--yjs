import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

interface Room {
  id: string;
  name: string;
  language: string;
  created_at: string;
}

interface RoomManagerProps {
  currentRoom: string | null;
  setCurrentRoom: (roomId: string | null) => void;
  setCurrentLanguage: (language: string) => void;
}

const RoomManager: React.FC<RoomManagerProps> = ({
  currentRoom,
  setCurrentRoom,
  setCurrentLanguage,
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomLanguage, setNewRoomLanguage] = useState("javascript");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchRooms();
    const subscription = supabase
      .channel("public:rooms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        fetchRooms
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchRooms() {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching rooms:", error);
      setError("Failed to fetch rooms. Please try again.");
    } else {
      setRooms((data as Room[]) || []);
      setError(null);
    }
  }

  function generateRoomId(): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  }

  async function createRoom() {
    if (!newRoomName.trim()) {
      setError("Please enter a room name.");
      return;
    }

    const newRoomId = generateRoomId();
    try {
      const { data, error } = await supabase
        .from("rooms")
        .insert({ id: newRoomId, name: newRoomName, language: newRoomLanguage })
        .select()
        .single();

      if (error) {
        console.error("Error creating room:", error);
        setError(`Failed to create room: ${error.message}`);
      } else if (data) {
        setNewRoomName("");
        setCurrentRoom(data.id);
        setCurrentLanguage(data.language);
        setError(null);
        router.push(`/room/${data.id}`);
      } else {
        console.error("Room created but no data returned");
        setError("An unexpected error occurred. Please try again.");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError(`An unexpected error occurred: ${err.message}`);
    }
  }

  async function joinRoom(roomIdToJoin: string) {
    if (!roomIdToJoin) {
      setError("Please enter a room ID.");
      return;
    }

    const { data, error } = await supabase
      .from("rooms")
      .select()
      .eq("id", roomIdToJoin.toUpperCase())
      .single();

    if (error) {
      console.error("Error joining room:", error);
      setError("Failed to join room. Please try again.");
    } else if (data) {
      setCurrentRoom(data.id);
      setCurrentLanguage(data.language);
      setJoinRoomId("");
      setError(null);
      router.push(`/room/${data.id}`);
    } else {
      console.error("Room not found");
      setError("Room not found. Please check the room ID and try again.");
    }
  }

  function leaveRoom() {
    setCurrentRoom(null);
    router.push("/");
  }

  return (
    <div className="room-manager p-6 bg-white rounded-lg shadow-md space-y-6">
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!currentRoom ? (
        <>
          <div className="create-room space-y-4">
            <h3 className="text-lg font-semibold">Create a New Room</h3>
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="New Room Name"
                className="p-2 border rounded w-full"
              />
              <select
                value={newRoomLanguage}
                onChange={(e) => setNewRoomLanguage(e.target.value)}
                className="p-2 border rounded w-full"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="go">Go</option>
              </select>
              <button
                onClick={createRoom}
                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors w-full"
              >
                Create Room
              </button>
            </div>
          </div>
          <div className="join-room space-y-4">
            <h3 className="text-lg font-semibold">Join a Room</h3>
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="6-character Room ID to Join"
                className="p-2 border rounded w-full"
              />
              <button
                onClick={() => joinRoom(joinRoomId)}
                className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-colors w-full"
              >
                Join Room
              </button>
            </div>
          </div>
          <div className="room-list space-y-4">
            <h3 className="text-lg font-semibold">Available Rooms:</h3>
            <ul className="space-y-2">
              {rooms.map((room) => (
                <li key={room.id} className="flex justify-between items-center">
                  <span>
                    {room.name} (ID: {room.id}, Language: {room.language})
                  </span>
                  <button
                    onClick={() => joinRoom(room.id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                  >
                    Join
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="current-room space-y-4">
          <p className="font-semibold">Current Room: {currentRoom}</p>
          <button
            onClick={leaveRoom}
            className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-colors w-full"
          >
            Leave Room
          </button>
        </div>
      )}
    </div>
  );
};

export default RoomManager;
