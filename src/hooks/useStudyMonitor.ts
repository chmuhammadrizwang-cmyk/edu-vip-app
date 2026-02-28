import { useEffect, useRef, useCallback } from "react";

/**
 * ULTIMATE STUDY MONITOR HOOK
 * Features: Refresh Protection, Duration Calculation, No Duplicate Logs, Voice & Audio Alarm.
 */
export const useStudyMonitor = (onTimerEnd?: () => void, onReturn?: () => void) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const wakeLockRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Logical Flags
  const didLogLeave = useRef(false);
  const eventLockRef = useRef(false);
  const isRefreshing = useRef(false);
  const leaveTimeRef = useRef<number | null>(null); // Time tracking ke liye

  const getSessionEnd = () => Number(localStorage.getItem("edu_study_session_end") || 0);
  const isActive = () => getSessionEnd() > 0 && Date.now() < getSessionEnd();

  const logIncident = useCallback((type: string) => {
    const incidents = JSON.parse(localStorage.getItem("study_guard_incidents") || "[]");
    incidents.push({ type, timestamp: new Date().toISOString() });
    localStorage.setItem("study_guard_incidents", JSON.stringify(incidents));
  }, []);

  const stopAlarm = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    workerRef.current?.postMessage({ type: "STOP" });
    speechSynthesis.cancel();
  }, []);

  const warnUser = useCallback(() => {
    const username = localStorage.getItem("study_guard_name") || "Student";
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`${username}, stop wasting time! Go back to your studies!`);
    u.rate = 1.0;
    speechSynthesis.speak(u);

    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.start();
      setTimeout(() => osc.stop(), 500);
    } catch (e) {}
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

  const acquireWakeLock = useCallback(async () => {
    try { if ("wakeLock" in navigator) wakeLockRef.current = await (navigator as any).wakeLock.request("screen"); }
    catch (e) {}
  }, []);

  useEffect(() => {
    // Refresh detection
    const markRefresh = () => {
      isRefreshing.current = true;
      sessionStorage.setItem("study_is_refreshing", "true");
    };

    const handleLeave = () => {
      // Logic Check: Session active ho, lock na ho, aur refresh na ho raha ho
      if (!isActive() || eventLockRef.current || isRefreshing.current) return;

      if (!didLogLeave.current) {
        eventLockRef.current = true;
        didLogLeave.current = true;
        
        leaveTimeRef.current = Date.now(); // Leave time save kiya
        logIncident("Left App / Switched Tab");
        startAlarm();

        // Lock for 1 second to prevent duplicate logs from multiple events
        setTimeout(() => { eventLockRef.current = false; }, 1000);
      }
    };

    const handleReturn = () => {
      if (!isActive() || eventLockRef.current) return;
      
      // Agar refresh ke baad page khula hai, to alarm band karo aur log mat karo
      if (sessionStorage.getItem("study_is_refreshing") === "true") {
        sessionStorage.removeItem("study_is_refreshing");
        stopAlarm();
        return;
      }

      if (didLogLeave.current) {
        eventLockRef.current = true;
        didLogLeave.current = false;
        stopAlarm();

        // Calculate Duration
        let durationMsg = "Unknown";
        if (leaveTimeRef.current) {
          const diffInSecs = Math.floor((Date.now() - leaveTimeRef.current) / 1000);
          durationMsg = diffInSecs >= 60 
            ? `${Math.floor(diffInSecs / 60)}m ${diffInSecs % 60}s` 
            : `${diffInSecs}s`;
        }

        logIncident(`Returned (Time wasted: ${durationMsg})`);
        onReturn?.();
        acquireWakeLock();

        setTimeout(() => { eventLockRef.current = false; }, 1000);
      }
    };

    // Event Listeners
    window.addEventListener("beforeunload", markRefresh);
    window.addEventListener("pagehide", handleLeave);
    window.addEventListener("pageshow", handleReturn);
    document.addEventListener("visibilitychange", () => {
      document.hidden ? handleLeave() : handleReturn();
    });

    // Timer Check (Every 1 second)
    const timerInterval = setInterval(() => {
      if (isActive() && Date.now() >= getSessionEnd()) {
        localStorage.removeItem("edu_study_session_end");
        stopAlarm();
        onTimerEnd?.();
      }
    }, 1000);

    return () => {
      window.removeEventListener("beforeunload", markRefresh);
      window.removeEventListener("pagehide", handleLeave);
      window.removeEventListener("pageshow", handleReturn);
      clearInterval(timerInterval);
      stopAlarm();
    };
  }, [startAlarm, stopAlarm, onTimerEnd, onReturn, acquireWakeLock, logIncident]);
};
