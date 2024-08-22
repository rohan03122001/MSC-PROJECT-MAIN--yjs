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
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Box,
} from "@mui/material";
import {
  ExitToApp as ExitToAppIcon,
  ContentCopy as ContentCopyIcon,
  Feedback as FeedbackIcon,
  Menu as MenuIcon,
  Code as CodeIcon,
} from "@mui/icons-material";

//const FEEDBACK_FORM_URL = "https://forms.gle/ba9U4nFTw9ArqPqp9";
const FEEDBACK_FORM_URL = "https://forms.gle/FPTzFag1KmPfhCrh7";

const Header: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{
            flexGrow: 1,
            textDecoration: "none",
            color: "primary.main",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
          }}
        >
          <CodeIcon sx={{ mr: 1 }} />
          DisCoder
        </Typography>
        {isMobile ? (
          <>
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={handleMenuOpen}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              {roomCode && (
                <MenuItem onClick={copyRoomCode}>
                  <ContentCopyIcon sx={{ mr: 1 }} />
                  {copied ? "Copied!" : "Copy Room Code"}
                </MenuItem>
              )}
              <MenuItem
                component={Link}
                href={FEEDBACK_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FeedbackIcon sx={{ mr: 1 }} />
                Provide Feedback
              </MenuItem>
              {user && (
                <MenuItem onClick={handleSignOut}>
                  <ExitToAppIcon sx={{ mr: 1 }} />
                  Sign Out
                </MenuItem>
              )}
            </Menu>
          </>
        ) : (
          <>
            {roomCode && (
              <>
                <Tooltip title={copied ? "Copied!" : "Copy Room Code"}>
                  <Button
                    color="inherit"
                    onClick={copyRoomCode}
                    startIcon={<ContentCopyIcon />}
                    sx={{ mr: 2 }}
                  >
                    {roomCode}
                  </Button>
                </Tooltip>
                <Button color="error" onClick={handleLeaveRoom} sx={{ mr: 2 }}>
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
                sx={{ mr: 2 }}
              >
                <FeedbackIcon />
              </IconButton>
            </Tooltip>
            {user && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body2" sx={{ mr: 2 }}>
                  {user.email}
                </Typography>
                <Tooltip title="Sign Out">
                  <IconButton color="inherit" onClick={handleSignOut}>
                    <ExitToAppIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
