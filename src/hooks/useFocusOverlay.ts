import { useEffect, useState } from "react";

export const useFocusOverlay = () => {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const handleVisibility = () => {
      // Jab screen hide ho (Tab switch), tab parda dikhaye
      if (document.hidden) {
        setShowOverlay(true);
      } else {
        setShowOverlay(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  return { showOverlay };
};
