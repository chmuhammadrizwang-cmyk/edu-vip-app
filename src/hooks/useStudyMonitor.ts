import { useEffect, useRef, useCallback } from "react";

/**
 * SINGLE SOURCE OF TRUTH for focus/visibility monitoring during the project study sessions.
 * Fixed for stable mobile-friendly event handling (pagehide/pageshow).
 */

export const useStudyMonitor = (onTimerEnd?: () => void, onReturn?: () => void) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const wakeLockRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const didLogLeave = useRef(false);
  const eventLockRef = useRef(false);

  const getSessionEnd = () => {
    const es = localStorage.getItem("edu_study_session_end");
    return es ? Number(es) : 0;
  };

  const isActive = () => {
    const end = getSessionEnd();
    return end > 0 && Date.now() < end;
  };

  const logIncident = useCallback((type: string) => {
    const incidents = JSON.parse(localStorage.getItem("study_guard_incidents") || "[]");
    incidents.push({ type, timestamp: new Date().toISOString() });
    localStorage.setItem("study_guard_incidents", JSON.stringify(incidents));
  }, []);

  const stopAlarm = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    workerRef.current?.postMessage({ type: "STOP" });
    speechSynthesis.cancel();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({ type: "STOP_ALARM_LOOP" });
      });
    }
  }, []);

  const warnUser = useCallback(() => {
    const username = localStorage.getItem("study_guard_name") || "Student";
    speechSynthesis.cancel();
    
    const message = `${username}, stop wasting time! Go back to your studies immediately!`;
    const u = new SpeechSynthesisUtterance(message);
    u.rate = 0.9;
    u.pitch = 1.1;

    const voices = speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes("Google US English") || v.lang.startsWith("en"));
    if (preferred) u.voice = preferred;
    speechSynthesis.speak(u);

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "square";
      gain.gain.value = 0.7;
      osc.start();
      setTimeout(() => osc.stop(), 500);
    } catch (e) {
      console.error("Audio Context Error:", e);
    }
  }, []);

  const startAlarm = useCallback(() => {
    warnUser();
    workerRef.current?.postMessage({ type: "START", interval: 10000 });

    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (!isActive()) {
          stopAlarm();
          return;
        }
        if (document.hidden || !document.hasFocus()) {
          warnUser();
        } else {
          stopAlarm();
        }
      }, 10000);
    }
  }, [warnUser, stopAlarm]);

  const acquireWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
      }
    } catch (e) {
      console.error("WakeLock Error:", e);
    }
  }, []);

  useEffect(() => {
    // Initialization
    try {
      audioCtxRef.current = new AudioContext();
    } catch (e) {}

    try {
      workerRef.current = new Worker("/alarm-worker.js");
      workerRef.current.onmessage = (e) => {
        if (e.data.type === "TICK" && isActive() && (document.hidden || !document.hasFocus())) {
          warnUser();
        }
      };
    } catch (e) {}

    if (isActive()) acquireWakeLock();

    /**
     * STABLE EVENT HANDLERS
     * pagehide/pageshow are more reliable on mobile than visibilitychange
     * for tracking when an app is actually backgrounded or terminated.
     */
    const handleAppLeave = () => {
      if (!isActive() || eventLockRef.current) return;

      // Ignore dashboard or home redirects
      const path = window.location.hash || window.location.pathname || "";
      if (path === "/" || path === "#/") return;

      if (!didLogLeave.current) {
        eventLockRef.current = true;
        didLogLeave.current = true;
        logIncident("left_app");
        startAlarm();
        
        setTimeout(() => { eventLockRef.current = false; }, 500);
      }
    };

    const handleAppReturn = () => {
      if (!isActive() || eventLockRef.current) return;

      if (didLogLeave.current) {
        eventLockRef.current = true;
        didLogLeave.current = false;
        stopAlarm();

        const remainingTime = Math.max(0, getSessionEnd() - Date.now());
        logIncident(`returned (Remaining: ${Math.floor(remainingTime / 1000)}s)`);
        
        onReturn?.();
        acquireWakeLock();

        setTimeout(() => { eventLockRef.current = false; }, 500);
      }
    };

    // Use pagehide/pageshow for mobile stability
    window.addEventListener("pagehide", handleAppLeave);
    window.addEventListener("pageshow", handleAppReturn);
    // Fallback for desktop browser switching
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) handleAppLeave();
      else handleAppReturn();
    });

    // Session Timer Check
    checkTimerRef.current = setInterval(() => {
      if (isActive() && Date.now() >= getSessionEnd()) {
        localStorage.removeItem("edu_study_session_end");
        stopAlarm();
        onTimerEnd?.();
      }
    }, 1000);

    return () => {
      window.removeEventListener("pagehide", handleAppLeave);
      window.removeEventListener("pageshow", handleAppReturn);
      document.removeEventListener("visibilitychange", handleAppLeave);
      
      if (checkTimerRef.current) clearInterval(checkTimerRef.current);
      stopAlarm();
      workerRef.current?.terminate();
    };
  }, [startAlarm, stopAlarm, onTimerEnd, onReturn, acquireWakeLock, warnUser, logIncident]);
};
