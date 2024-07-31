import { useEffect } from "react";
import { useRouter } from "next/router";

const FEEDBACK_FORM_URL = "https://forms.gle/ba9U4nFTw9ArqPqp9";

const FeedbackRedirect: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const handleUnload = () => {
      router.push(FEEDBACK_FORM_URL);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
    };
  }, [router]);

  return null;
};

export default FeedbackRedirect;
