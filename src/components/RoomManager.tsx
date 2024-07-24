// components/RoomManager.tsx
import React, { useState, useEffect } from "react";
import { supabase, createRoom, getRoomWithFiles } from "../lib/supabaseClient";

interface File {
  id: string;
  name: string;
  content: string;
  language: string;
}

interface Room {
  id: string;
  name: string;
  files: File[];
  created_at: string;
}

interface RoomManagerProps {
  currentRoom: string | null;
  setCurrentRoom: (roomId: string | null) => void;
  setCurrentFiles: (files: File[]) => void;
}

const RoomManager: React.FC<RoomManagerProps> = ({
  currentRoom,
  setCurrentRoom,
  setCurrentFiles,
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  async function createNewRoom() {
    if (!newRoomName.trim()) {
      setError("Please enter a room name.");
      return;
    }

    try {
      const initialFile = {
        name: "index.js",
        content: "// Start coding here...",
        language: "javascript",
      };
      const room = await createRoom(newRoomName, initialFile);
      setNewRoomName("");
      await joinRoom(room.id);
    } catch (error) {
      console.error("Error creating room:", error);
      setError("Failed to create room. Please try again.");
    }
  }

  async function joinRoom(roomIdToJoin: string) {
    if (!roomIdToJoin) {
      setError("Please enter a room ID.");
      return;
    }

    try {
      const room = await getRoomWithFiles(roomIdToJoin);
      setCurrentRoom(room.id);
      setCurrentFiles(room.files);
      setJoinRoomId("");
      setError(null);
    } catch (error) {
      console.error("Error joining room:", error);
      setError("Failed to join room. Please try again.");
    }
  }

  function leaveRoom() {
    setCurrentRoom(null);
    setCurrentFiles([]);
  }

  return (
    <div className="room-manager p-4 bg-white rounded-lg shadow-md">
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {!currentRoom ? (
        <>
          <div className="create-room mb-4">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="New Room Name"
              className="mr-2 p-2 border rounded"
            />
            <button
              onClick={createNewRoom}
              className="bg-blue-500 text-white p-2 rounded"
            >
              Create Room
            </button>
          </div>
          <div className="join-room mb-4">
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              placeholder="Room ID to Join"
              className="mr-2 p-2 border rounded"
            />
            <button
              onClick={() => joinRoom(joinRoomId)}
              className="bg-green-500 text-white p-2 rounded"
            >
              Join Room
            </button>
          </div>
          <div className="room-list">
            <h3 className="text-lg font-bold mb-2">Available Rooms:</h3>
            <ul>
              {rooms.map((room) => (
                <li key={room.id} className="mb-1">
                  {room.name} (ID: {room.id}) -
                  <button
                    onClick={() => joinRoom(room.id)}
                    className="ml-2 text-blue-500"
                  >
                    Join
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="current-room">
          <p>Current Room: {currentRoom}</p>
          <button
            onClick={leaveRoom}
            className="bg-red-500 text-white p-2 rounded mt-2"
          >
            Leave Room
          </button>
        </div>
      )}
    </div>
  );
};

export default RoomManager;
