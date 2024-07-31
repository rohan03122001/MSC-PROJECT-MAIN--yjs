import React, { useState, useEffect } from "react";
import { signUp, signIn } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { AuthError, getErrorMessage } from "@/types";

const Auth: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const [lastAttempt, setLastAttempt] = useState(0);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
        if (countdown === 1) {
          setError(null); // Clear the error when countdown reaches 0
        }
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const now = Date.now();
    if (now - lastAttempt < 20000) {
      const remainingTime = Math.ceil((20000 - (now - lastAttempt)) / 1000);
      setCountdown(remainingTime);
      setError(`Please wait before trying again.`);
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
            setError(
              "Too many signup attempts. Please try again after some time."
            );
            setCountdown(20); // Set a 60-second countdown for rate limit
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
      setError(getErrorMessage(error));
    }
  };

  return (
    <div className="max-w-md w-full mx-auto mt-8 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6">
        {isSignUp ? "Sign Up" : "Sign In"}
      </h2>
      <form onSubmit={handleSubmit}>
        {/* Email input */}
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
        {/* Password input */}
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
        {error && (
          <p className="text-red-500 mb-4">
            {error}
            {countdown > 0 && ` Please try again in ${countdown} seconds.`}
          </p>
        )}
        {message && <p className="text-green-500 mb-4">{message}</p>}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:shadow-outline disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={countdown > 0}
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
