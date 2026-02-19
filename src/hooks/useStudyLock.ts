import { useEffect } from "react";

/**
 * Prevents closing the tab and requests fullscreen during active study sessions.
 * - beforeunload warning when study timer is active
 * - Fullscreen request on mount if study session is active
 */
export const useStudyLock = () => {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const endTimeStr = localStorage.getItem("edu_study_session_end");
      if (!endTimeStr) return;
      const endTime = Number(endTimeStr);
      if (Date.now() < endTime) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);
};

/** Call this to enter fullscreen mode */
export const requestFullscreen = () => {
  const el = document.documentElement;
  try {
    if (el.requestFullscreen) el.requestFullscreen();
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
    else if ((el as any).msRequestFullscreen) (el as any).msRequestFullscreen();
  } catch {}
};

/** Check if a study session is currently active */
export const isStudyActive = (): boolean => {
  const endTimeStr = localStorage.getItem("edu_study_session_end");
  if (!endTimeStr) return false;
  return Date.now() < Number(endTimeStr);
};
