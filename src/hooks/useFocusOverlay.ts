import { useState, useCallback } from "react";

/**
 * Provides overlay state that can be triggered externally.
 * No longer listens to visibilitychange directly — 
 * useStudyMonitor is the single source of truth for focus events.
 */
export const useFocusOverlay = () => {
  const [showOverlay, setShowOverlay] = useState(false);

  const triggerOverlay = useCallback(() => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 3000);
  }, []);

  return { showOverlay, triggerOverlay };
};
