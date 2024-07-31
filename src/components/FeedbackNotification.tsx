import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";

const FeedbackNotification: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return; // Don't show user is not logged in

    const showCount = parseInt(
      localStorage.getItem("feedbackNotificationCount") || "0"
    );
    if (showCount >= 2) return; //already shown twice

    const timer = setTimeout(() => {
      setIsVisible(true);
      localStorage.setItem(
        "feedbackNotificationCount",
        (showCount + 1).toString()
      );
    }, 360000); // 6 minutes

    return () => clearTimeout(timer);
  }, [user]);

  const handleGiveFeedback = () => {
    window.open(
      "https://forms.gle/ba9U4nFTw9ArqPqp9",
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!user) return null; // Don't render anything if user is not logged in

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.5 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl shadow-2xl max-w-sm"
        >
          <h3 className="text-xl font-bold mb-2">Your Feedback Matters!</h3>
          <p className="mb-4">
            We would love to hear your thoughts. Your feedback helps us improve
            your experience.
          </p>
          <div className="flex justify-between items-center">
            <button
              onClick={handleDismiss}
              className="bg-white text-indigo-600 px-4 py-2 rounded-full font-semibold hover:bg-indigo-100 transition-colors duration-300"
            >
              Maybe Later
            </button>
            <button
              onClick={() => {
                handleGiveFeedback();
                handleDismiss();
              }}
              className="bg-indigo-400 text-white px-4 py-2 rounded-full font-semibold hover:bg-indigo-300 transition-colors duration-300"
            >
              Give Feedback
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackNotification;
