import { useState, useEffect } from "react";
import { isStudyActive } from "@/hooks/useStudyLock";

/**
 * Detects when the app returns from background during an active session.
 * Shows a "black-hole" overlay for 3 seconds to re-focus the user.
 */
export const useFocusOverlay = () => {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const handler = () => {
      if (!document.hidden && isStudyActive()) {
        setShowOverlay(true);
        setTimeout(() => setShowOverlay(false), 3000);
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  return showOverlay;
};
