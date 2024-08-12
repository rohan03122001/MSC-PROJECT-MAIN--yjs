// app/page.tsx
"use client";

import { Box, Typography, Button, Container } from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import RoomManager from "@/components/RoomManager";
import { useState } from "react";

export default function Home() {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string>("javascript");

  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box
        sx={{
          bgcolor: "background.default",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Container maxWidth="sm">
          <Typography
            variant="h2"
            component="h1"
            align="center"
            gutterBottom
            sx={{ color: "primary.main" }}
          >
            Welcome to DisCoder
          </Typography>
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push("/auth")}
              sx={{
                color: "primary.main",
                borderColor: "primary.main",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                },
              }}
            >
              Sign In or Sign Up
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br p-6">
      <div className="container mx-auto">
        <RoomManager
          currentRoom={currentRoom}
          setCurrentRoom={setCurrentRoom}
          setCurrentLanguage={setCurrentLanguage}
        />
      </div>
    </div>
  );
}
