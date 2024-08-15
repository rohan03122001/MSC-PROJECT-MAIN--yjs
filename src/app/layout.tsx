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

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
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
            <Header />
            <main style={{ 
              minHeight: 'calc(100vh - 64px)', 
              backgroundColor: theme.palette.background.default,
              padding: '24px 0'
            }}>
              {children}
            </main>
            <FeedbackNotification />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}