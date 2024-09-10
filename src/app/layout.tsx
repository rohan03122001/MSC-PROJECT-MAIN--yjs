"use client";
import { useEffect } from "react";
import "./globals.css";
import { Roboto } from "next/font/google";
import Header from "@/components/Header";
import { AuthProvider } from "@/lib/AuthContext";
import loadMonacoLanguages from "@/lib/monaco-languages";
import FeedbackNotification from "@/components/FeedbackNotification";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "@/lib/themes";
import { Box } from "@mui/material";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    loadMonacoLanguages();
  }, []);

  return (
    <html lang="en" className={roboto.className}>
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
              }}
            >
              <Header />
              <Box
                component="main"
                sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}
              >
                {children}
              </Box>
              <FeedbackNotification />
            </Box>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
