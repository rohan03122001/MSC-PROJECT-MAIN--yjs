"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { Button, Container, Grid, Paper, Typography, Box } from "@mui/material";

const CollaborativeEditor = dynamic(
  () => import("@/components/CollaborativeEditor"),
  { ssr: false }
);
const VoiceChat = dynamic(() => import("@/components/VoiceChat"), {
  ssr: false,
});

export default function RoomPage() {
  const { id } = useParams();
  const [currentRoom, setCurrentRoom] = useState<string | null>(id as string);
  const [currentLanguage, setCurrentLanguage] = useState<string>("javascript");
  const { user, loading } = useAuth();

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
        <Typography variant="h5">Loading...</Typography>
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
      </Container>
    );
  }

  return (
    <Container
      maxWidth="xl"
      sx={{ mt: 4, mb: 4, height: "calc(100vh - 100px)" }}
    >
      <Grid container spacing={3} sx={{ height: "100%" }}>
        <Grid item xs={12} md={10} sx={{ height: "100%" }}>
          <Box
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            {currentRoom && (
              <CollaborativeEditor
                roomId={currentRoom}
                initialLanguage={currentLanguage}
              />
            )}
          </Box>
        </Grid>
        <Grid item xs={12} md={2} sx={{ height: "100%" }}>
          <Box
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            {currentRoom && <VoiceChat roomId={currentRoom} />}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
