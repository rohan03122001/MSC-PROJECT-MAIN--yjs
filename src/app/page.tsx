// app/page.tsx
"use client";

import { Box, Typography, Button, Container } from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function Home() {
  const router = useRouter();
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

  if (user) {
    router.push("/dashboard");
    return null;
  }

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
