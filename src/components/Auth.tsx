// components/Auth.tsx
import React, { useState, useEffect } from "react";
import { signUp, signIn } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/types";
import {
  Button,
  TextField,
  Typography,
  Box,
  Container,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const Auth: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const [lastAttempt, setLastAttempt] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
        if (countdown === 1) {
          setError(null);
        }
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const now = Date.now();
    if (now - lastAttempt < 20000) {
      const remainingTime = Math.ceil((20000 - (now - lastAttempt)) / 1000);
      setCountdown(remainingTime);
      setError(`Please wait before trying again.`);
      setLoading(false);
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
            setCountdown(20);
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
        router.push("/dashboard");
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={6} sx={{ mt: 8, p: 4, bgcolor: "background.paper" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <LockOutlinedIcon
            sx={{ fontSize: 40, mb: 2, color: "primary.main" }}
          />
          <Typography
            component="h1"
            variant="h5"
            sx={{ color: "primary.main" }}
          >
            {isSignUp ? "Sign Up" : "Sign In"}
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.23)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.5)",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.23)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.5)",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
              }}
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            {message && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {message}
              </Alert>
            )}
            <Button
              type="submit"
              fullWidth
              variant="outlined"
              sx={{
                mt: 3,
                mb: 2,
                color: "primary.main",
                borderColor: "primary.main",
              }}
              disabled={loading || countdown > 0}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : isSignUp ? (
                "Sign Up"
              ) : (
                "Sign In"
              )}
            </Button>
            {countdown > 0 && (
              <Typography
                variant="body2"
                sx={{ color: "secondary.main", textAlign: "center" }}
              >
                Please try again in {countdown} seconds.
              </Typography>
            )}
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "secondary.main" }}>
                {isSignUp
                  ? "Already have an account?"
                  : "Don't have an account?"}
                <Button
                  onClick={() => setIsSignUp(!isSignUp)}
                  sx={{ ml: 1, color: "primary.main" }}
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </Button>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Auth;
