// app/auth/page.tsx
"use client";

import Auth from "@/components/Auth";
import { Box } from "@mui/material";

export default function AuthPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <Auth />
    </Box>
  );
}
