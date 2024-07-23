// /components/Auth.tsx

import React, { useState } from "react";
import { signUp, signIn } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const Auth: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const [lastAttempt, setLastAttempt] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const now = Date.now();
    if (now - lastAttempt < 60000) {
      // 1 minute cooldown
      setError("Please wait a moment before trying again.");
      return;
    }
    setLastAttempt(now);

    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes("rate limit")) {
            setError("Too many signup attempts. Please try again later.");
          } else {
            throw error;
          }
        } else {
          setMessage(
            "Please check your email to verify your account before signing in."
          );
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        router.push("/");
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto mt-8 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6">
        {isSignUp ? "Sign Up" : "Sign In"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="password"
            className="block text-gray-700 font-bold mb-2"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:shadow-outline"
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </button>
      </form>
      <p className="mt-4 text-center">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="ml-1 text-blue-500 hover:text-blue-600 focus:outline-none"
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </p>
    </div>
  );
};

export default Auth;
