"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import RoomManager from "@/components/RoomManager";
import { Container, Typography, Box } from "@mui/material";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

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
    return null; // This will prevent a flash of unauthenticated content
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to DisCoder
      </Typography>
      <RoomManager
        currentRoom={null}
        setCurrentRoom={() => {}}
        setCurrentLanguage={() => {}}
      />
    </Container>
  );
}
