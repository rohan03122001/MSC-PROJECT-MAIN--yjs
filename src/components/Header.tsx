// /components/Header.tsx
"use client";

import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { signOut } from "@/lib/supabaseClient";
import Link from "next/link";

const Header: React.FC = () => {
  const { user, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">CollabCode</h2>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link href="/" className="text-gray-600 hover:text-gray-800">
                Home
              </Link>
            </li>
            <li>
              <a href="#" className="text-gray-600 hover:text-gray-800">
                About
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-600 hover:text-gray-800">
                Contact
              </a>
            </li>
            {!loading && (
              <li>
                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/auth"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Sign In
                  </Link>
                )}
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
