// components/VersionControl.tsx

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Version {
  id: number;
  created_at: string;
  snapshot: string;
}

interface VersionControlProps {
  roomId: string;
  currentCode: string;
  onRevert: (code: string) => void;
}

const VersionControl: React.FC<VersionControlProps> = ({
  roomId,
  currentCode,
  onRevert,
}) => {
  const [versions, setVersions] = useState<Version[]>([]);

  useEffect(() => {
    fetchVersions();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`room-${roomId}-versions`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "code_versions",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setVersions((currentVersions) => [
            payload.new as Version,
            ...currentVersions,
          ]);
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  const fetchVersions = async () => {
    const { data, error } = await supabase
      .from("code_versions")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching versions:", error);
    } else {
      setVersions(data || []);
    }
  };

  const saveVersion = async () => {
    const { error } = await supabase
      .from("code_versions")
      .insert({ room_id: roomId, snapshot: currentCode });

    if (error) {
      console.error("Error saving version:", error);
    }
  };

  const revertToVersion = (snapshot: string) => {
    onRevert(snapshot);
  };

  return (
    <div className="version-control mt-4">
      <h3 className="text-lg font-semibold mb-2">Version Control</h3>
      <button
        onClick={saveVersion}
        className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
      >
        Save Current Version
      </button>
      <div className="versions mt-2">
        <h4 className="font-medium">Previous Versions:</h4>
        <ul>
          {versions.map((version) => (
            <li key={version.id} className="flex items-center mt-1">
              <span className="mr-2">
                {new Date(version.created_at).toLocaleString()}
              </span>
              <button
                onClick={() => revertToVersion(version.snapshot)}
                className="bg-gray-200 px-2 py-1 rounded text-sm"
              >
                Revert
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VersionControl;
