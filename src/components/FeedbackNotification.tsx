import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { Paper, Typography, Button, Box } from "@mui/material";
import FeedbackIcon from "@mui/icons-material/Feedback";

const FeedbackNotification: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const showCount = parseInt(
      localStorage.getItem("feedbackNotificationCount") || "0"
    );
    if (showCount >= 2) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
      localStorage.setItem(
        "feedbackNotificationCount",
        (showCount + 1).toString()
      );
    }, 240000); // 6 minutes

    return () => clearTimeout(timer);
  }, [user]);

  const handleGiveFeedback = () => {
    window.open(
      "https://forms.gle/ba9U4nFTw9ArqPqp9",
      "_blank",
      "noopener,noreferrer"
    );
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.5 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{
            position: "fixed",
            bottom: "1rem",
            right: "1rem",
            zIndex: 1000,
          }}
        >
          <Paper
            elevation={6}
            sx={{ p: 3, bgcolor: "background.paper", borderRadius: 2 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <FeedbackIcon
                sx={{ fontSize: 40, color: "primary.main", mr: 2 }}
              />
              <Typography
                variant="h6"
                component="div"
                sx={{ fontWeight: "bold" }}
              >
                Your Feedback Matters!
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              We would love to hear your thoughts. Your feedback helps us
              improve your experience.
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="outlined" onClick={handleDismiss} sx={{ mr: 1 }}>
                Maybe Later
              </Button>
              <Button
                variant="contained"
                onClick={handleGiveFeedback}
                color="primary"
              >
                Give Feedback
              </Button>
            </Box>
          </Paper>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackNotification;
