
"use client";

import { useEffect } from "react";
import "./globals.css";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import { AuthProvider } from "@/lib/AuthContext";
import loadMonacoLanguages from "@/lib/monaco-languages";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Load Monaco languages on client-side
  useEffect(() => {
    loadMonacoLanguages();
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}