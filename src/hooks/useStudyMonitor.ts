import { useEffect, useRef, useCallback } from "react";

export const useStudyMonitor = (onTimerEnd?: () => void, onReturn?: () => void) => {
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const didLogLeave = useRef(false);
  const leaveTimeRef = useRef<number | null>(null);

  const getSessionEnd = () => Number(localStorage.getItem("edu_study_session_end") || 0);
  const isActive = useCallback(() => {
    const end = getSessionEnd();
    return end > 0 && Date.now() < end;
  }, []);

  const logIncident = useCallback((type: string) => {
    // 3 second ka sakht lock taake duplicate logs na banen
    const lastLogTime = Number(localStorage.getItem("last_log_timestamp") || 0);
    if (Date.now() - lastLogTime < 3000) return;
    localStorage.setItem("last_log_timestamp", Date.now().toString());

    const incidents = JSON.parse(localStorage.getItem("study_guard_incidents") || "[]");
    incidents.push({ type, timestamp: new Date().toISOString() });
    localStorage.setItem("study_guard_incidents", JSON.stringify(incidents));
  }, []);

  const stopAlarm = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    speechSynthesis.cancel();
  }, []);

  const warnUser = useCallback(() => {
    if (!isActive()) return;
    const username = localStorage.getItem("study_guard_name") || "Student";
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`${username}, stop wasting time! Go back to your studies!`);
    speechSynthesis.speak(u);
  }, [isActive]);

  const startAlarm = useCallback(() => {
    if (alarmIntervalRef.current) return;
    warnUser(); // Pehli dafa foran
    alarmIntervalRef.current = setInterval(() => {
      if (!isActive()) stopAlarm();
      else if (document.hidden || !document.hasFocus()) warnUser();
      else stopAlarm();
    }, 10000); // Har 10 second baad repeat
  }, [warnUser, stopAlarm, isActive]);

  useEffect(() => {
    const handleLeave = () => {
      if (!isActive() || sessionStorage.getItem("study_is_refreshing") === "true") return;
      if (!didLogLeave.current) {
        didLogLeave.current = true;
        leaveTimeRef.current = Date.now();
        logIncident("Student Left App");
        startAlarm();
      }
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
          durationMsg = diff >= 60 ? `${Math.floor(diff / 60)}m ${diff % 60}s` : `${diff}s`;
        }
        logIncident(`Returned (Stayed out: ${durationMsg})`);
        onReturn?.(); // App.tsx mein overlay trigger karega
      }
    };

    window.addEventListener("beforeunload", () => sessionStorage.setItem("study_is_refreshing", "true"));
    window.addEventListener("pagehide", handleLeave);
    window.addEventListener("pageshow", handleReturn);
    document.addEventListener("visibilitychange", () => document.hidden ? handleLeave() : handleReturn());

    const timerInterval = setInterval(() => {
      if (isActive() && Date.now() >= getSessionEnd()) {
        localStorage.removeItem("edu_study_session_end");
        stopAlarm();
        onTimerEnd?.();
      }
    }, 1000);

    return () => {
      window.removeEventListener("pagehide", handleLeave);
      window.removeEventListener("pageshow", handleReturn);
      clearInterval(timerInterval);
      stopAlarm();
    };
  }, [isActive, logIncident, startAlarm, stopAlarm, onTimerEnd, onReturn]);
};
        
