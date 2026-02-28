import { useEffect, useRef, useCallback } from "react";

export const useStudyMonitor = (onTimerEnd?: () => void, onReturn?: () => void) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const didLogLeave = useRef(false);
  const leaveTimeRef = useRef<number | null>(null);

  const getSessionEnd = () => Number(localStorage.getItem("edu_study_session_end") || 0);
  const isActive = () => getSessionEnd() > 0 && Date.now() < getSessionEnd();

  // --- PAKKA HAL: THROTTLE FUNCTION ---
  const canLogNow = () => {
    const lastLogTime = Number(localStorage.getItem("last_log_timestamp") || 0);
    const now = Date.now();
    if (now - lastLogTime < 3000) return false; // 3 second ka sakht lock
    localStorage.setItem("last_log_timestamp", now.toString());
    return true;
  };

  const logIncident = useCallback((type: string) => {
    if (!canLogNow()) return; 

    const incidents = JSON.parse(localStorage.getItem("study_guard_incidents") || "[]");
    incidents.push({ type, timestamp: new Date().toISOString() });
    localStorage.setItem("study_guard_incidents", JSON.stringify(incidents));
  }, []);

  const stopAlarm = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    speechSynthesis.cancel();
  }, []);

  const warnUser = useCallback(() => {
    const username = localStorage.getItem("study_guard_name") || "Student";
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`${username}, stop wasting time! Go back to your studies!`);
    speechSynthesis.speak(u);
  }, []);

  const startAlarm = useCallback(() => {
    if (!intervalRef.current) {
      warnUser();
      intervalRef.current = setInterval(() => {
        if (!isActive()) { stopAlarm(); return; }
        if (document.hidden || !document.hasFocus()) warnUser();
        else stopAlarm();
      }, 10000);
    }
  }, [warnUser, stopAlarm]);

  useEffect(() => {
    const handleLeave = () => {
      if (sessionStorage.getItem("study_is_refreshing") === "true") return;
      if (!isActive() || didLogLeave.current) return;

      didLogLeave.current = true;
      leaveTimeRef.current = Date.now();
      logIncident("Student Left App");
      startAlarm();
    };

    const handleReturn = () => {
      if (sessionStorage.getItem("study_is_refreshing") === "true") {
        sessionStorage.removeItem("study_is_refreshing");
        stopAlarm();
        return;
      }

      if (didLogLeave.current) {
        didLogLeave.current = false;
        stopAlarm();

        let durationMsg = "Short time";
        if (leaveTimeRef.current) {
          const diff = Math.floor((Date.now() - leaveTimeRef.current) / 1000);
          durationMsg = diff > 60 ? `${Math.floor(diff/60)}m ${diff%60}s` : `${diff}s`;
        }

        logIncident(`Returned (Stayed out: ${durationMsg})`);
        onReturn?.();
      }
    };

    const handleBeforeUnload = () => {
      sessionStorage.setItem("study_is_refreshing", "true");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleLeave);
    window.addEventListener("pageshow", handleReturn);
    document.addEventListener("visibilitychange", () => {
      document.hidden ? handleLeave() : handleReturn();
    });

    const timerInterval = setInterval(() => {
      if (isActive() && Date.now() >= getSessionEnd()) {
        localStorage.removeItem("edu_study_session_end");
        stopAlarm();
        onTimerEnd?.();
      }
    }, 1000);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleLeave);
      window.removeEventListener("pageshow", handleReturn);
      clearInterval(timerInterval);
    };
  }, [logIncident, startAlarm, stopAlarm, onTimerEnd, onReturn]);
};
            
