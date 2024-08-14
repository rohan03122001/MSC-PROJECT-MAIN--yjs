"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import RoomManager from "@/components/RoomManager";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import {
  Button,
  Container,
  Paper,
  Typography,
  Drawer,
  IconButton,
  Box,
  useTheme,
  useMediaQuery,
  Modal,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronRight as ChevronRightIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

const CollaborativeEditor = dynamic(
  () => import("@/components/CollaborativeEditor"),
  { ssr: false }
);
const VoiceChat = dynamic(() => import("@/components/VoiceChat"), {
  ssr: false,
});
const VersionControl = dynamic(() => import("@/components/VersionControl"), {
  ssr: false,
});

export default function RoomPage() {
  const { id } = useParams();
  const [currentRoom, setCurrentRoom] = useState<string | null>(id as string);
  const [currentLanguage, setCurrentLanguage] = useState<string>("javascript");
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [versionControlOpen, setVersionControlOpen] = useState(false);
  const [currentCode, setCurrentCode] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    if (id) {
      setCurrentRoom(id as string);
    }
  }, [id]);

  if (loading) {
    return (
      <Container
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h5">Loading...</Typography>
        </motion.div>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h4" gutterBottom>
              Welcome to DisCoder
            </Typography>
            <Link href="/auth" passHref>
              <Button variant="contained" color="primary">
                Sign In or Sign Up
              </Button>
            </Link>
          </Paper>
        </motion.div>
      </Container>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Box component="main" sx={{ flexGrow: 1, p: 3, position: "relative" }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="end"
          onClick={() => setSidebarOpen(true)}
          sx={{ position: "absolute", right: 16, top: 16, zIndex: 1 }}
        >
          <MenuIcon />
        </IconButton>
        <AnimatePresence>
          {currentRoom && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <CollaborativeEditor
                roomId={currentRoom}
                initialLanguage={currentLanguage}
                onCodeChange={setCurrentCode}
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<HistoryIcon />}
                onClick={() => setVersionControlOpen(true)}
                sx={{ position: "absolute", right: 16, bottom: 16 }}
              >
                Version History
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        anchor="right"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <IconButton onClick={() => setSidebarOpen(false)}>
            <ChevronRightIcon />
          </IconButton>
          <RoomManager
            currentRoom={currentRoom}
            setCurrentRoom={setCurrentRoom}
            setCurrentLanguage={setCurrentLanguage}
          />
          {currentRoom && <VoiceChat roomId={currentRoom} />}
        </Box>
      </Drawer>
      <Modal
        open={versionControlOpen}
        onClose={() => setVersionControlOpen(false)}
        aria-labelledby="version-control-modal"
        aria-describedby="version-control-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4,
          }}
        >
          <VersionControl
            roomId={currentRoom}
            currentCode={currentCode}
            onRevert={(code) => {
              setCurrentCode(code);
              setVersionControlOpen(false);
            }}
          />
        </Box>
      </Modal>
    </Box>
  );
}
