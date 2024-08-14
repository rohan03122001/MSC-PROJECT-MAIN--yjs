"use client";
import { useEffect } from "react";
import "./globals.css";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import { AuthProvider } from "@/lib/AuthContext";
import loadMonacoLanguages from "@/lib/monaco-languages";
import FeedbackNotification from "@/components/FeedbackNotification";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "@/lib/themes";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    loadMonacoLanguages();
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <Header />
            <main>{children}</main>
            <FeedbackNotification />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
