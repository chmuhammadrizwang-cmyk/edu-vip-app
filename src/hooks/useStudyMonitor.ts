import { useEffect, useRef, useCallback } from "react";

/**
 * SINGLE SOURCE OF TRUTH for focus/visibility monitoring during study sessions.
 * Final Professional Version with Screen-Off Fix.
 */

export const useStudyMonitor = (onTimerEnd?: () => void, onReturn?: () => void) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const wakeLockRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const didLogLeave = useRef<boolean>(false);
  const visibilityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const u = new SpeechSynthesisUtterance(`${username}, stop wasting time! Go back to your studies immediately!`);
    u.rate = 0.9;
    u.pitch = 1.1;
    
    const voices = speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes("Google US English") || v.lang.startsWith("en"));
    if (preferred) u.voice = preferred;
    speechSynthesis.speak(u);

    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    } catch (e) { console.error(e); }
  }, []);

  const startAlarm = useCallback(() => {
    warnUser();
    workerRef.current?.postMessage({ type: "START", interval: 10000 });
    
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (!isActive()) { stopAlarm(); return; }
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
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    try { audioCtxRef.current = new AudioContext(); } catch (e) {}
    try {
      workerRef.current = new Worker("/alarm-worker.js");
      workerRef.current.onmessage = (e) => {
        if (e.data.type === "TICK" && isActive() && (document.hidden || !document.hasFocus())) {
          warnUser();
        }
      };
    } catch (e) {}

    if (isActive()) acquireWakeLock();

    // FIXED: Smart Visibility Logic (Screen-off vs App-switch)
    const handleVisibilityChange = () => {
      if (!isActive()) return;
      
      if (document.hidden) {
        const scheduledAt = performance.now();
        
        if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
        
        visibilityTimeoutRef.current = setTimeout(() => {
          const elapsed = performance.now() - scheduledAt;
          const TOLERANCE = 500;
          const DELAY = 1200;
          
          // If execution was paused (Screen Off), elapsed will be > 1700ms.
          // In this case, we strictly ignore it (no logs, no alarm).
          if (elapsed > DELAY + TOLERANCE) {
            console.log("System: Screen-off detected (PAUSE). Ignoring.");
            return; 
          }

          // Otherwise, it was a legitimate App Switch
          if (!didLogLeave.current) {
            didLogLeave.current = true;
            logIncident("left_app");
            startAlarm();
          }
        }, 1200);
      } else {
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
          visibilityTimeoutRef.current = null;
        }
        
        if (didLogLeave.current) {
          const remainingTime = Math.max(0, getSessionEnd() - Date.now());
          didLogLeave.current = false;
          stopAlarm();
          
          // Log including remaining time as requested
          logIncident(`returned (Remaining: ${Math.floor(remainingTime / 1000)}s)`);
          onReturn?.();
          acquireWakeLock();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", () => { if(isActive()) handleVisibilityChange(); });

    checkTimerRef.current = setInterval(() => {
      if (isActive() && Date.now() >= getSessionEnd()) {
        localStorage.removeItem("edu_study_session_end");
        stopAlarm();
        onTimerEnd?.();
      }
    }, 1000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (checkTimerRef.current) clearInterval(checkTimerRef.current);
      if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
      stopAlarm();
    };
  }, [startAlarm, stopAlarm, onTimerEnd, onReturn, acquireWakeLock, warnUser]);
};
                                
