"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { signOut } from "@/lib/supabaseClient";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FeedbackIcon from "@mui/icons-material/Feedback";

const FEEDBACK_FORM_URL = "https://forms.gle/ba9U4nFTw9ArqPqp9";

const Header: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const parts = pathname.split("/");
    if (parts[1] === "room" && parts[2]) {
      setRoomCode(parts[2]);
    } else {
      setRoomCode(null);
    }
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleLeaveRoom = () => {
    router.push("/");
  };

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          DisCoder
        </Typography>
        {roomCode && (
          <>
            <Tooltip title={copied ? "Copied!" : "Copy Room Code"}>
              <Button
                color="inherit"
                onClick={copyRoomCode}
                startIcon={<ContentCopyIcon />}
              >
                {roomCode}
              </Button>
            </Tooltip>
            <Button color="error" onClick={handleLeaveRoom}>
              Leave Room
            </Button>
          </>
        )}
        <Tooltip title="Provide Feedback">
          <IconButton
            color="inherit"
            component={Link}
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FeedbackIcon />
          </IconButton>
        </Tooltip>
        {user && (
          <>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user.email}
            </Typography>
            <Tooltip title="Sign Out">
              <IconButton color="inherit" onClick={handleSignOut}>
                <ExitToAppIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
