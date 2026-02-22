import { useEffect, useRef, useCallback } from "react";

/**
 * Monitors tab visibility during an active study session.
 * - Triggers alarm on blur (app switch / home / tab switch) immediately
 * - visibilitychange is used as backup + to detect return
 * - Web Worker drives the 10-second alarm interval to survive mobile throttling
 * - Service Worker sends persistent notifications in background
 * - Wake Lock keeps the screen alive during study
 */
export const useStudyMonitor = (onTimerEnd?: () => void) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const didLogLeave = useRef(false);
  const workerRef = useRef<Worker | null>(null);
  const wakeLockRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isSessionActive = useRef(false);

  const getSessionEnd = () => {
    const es = localStorage.getItem("edu_study_session_end");
    return es ? Number(es) : 0;
  };

  const stopWarning = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "STOP" });
    }
    speechSynthesis.cancel();
  }, []);

  const warnUser = useCallback(() => {
    const userName = localStorage.getItem("study_guard_name") || "Student";
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      `${userName}, stop wasting time! This is Study Guard. Go back to your studies immediately!`
    );
    u.rate = 0.9;
    u.pitch = 1.1;
    u.volume = 1;
    const voices = speechSynthesis.getVoices();
    const preferred =
      voices.find(
        (v) =>
          v.name.includes("Google Hindi") ||
          v.name.includes("Google UK English Female") ||
          v.name.includes("Google US English")
      ) || voices.find((v) => v.lang.startsWith("en"));
    if (preferred) u.voice = preferred;
    speechSynthesis.speak(u);

    // High-priority beep via persistent AudioContext
    try {
      const ctx = audioCtxRef.current || new AudioContext();
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "square";
      gain.gain.value = 0.7;
      osc.start();
      setTimeout(() => { osc.stop(); }, 800);
    } catch {}

    // Web notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🔒 Study Guard", {
        body: `${userName}, stop wasting time! Go back to your studies!`,
        icon: "/favicon.ico",
        tag: "study-monitor",
      });
    }
  }, []);

  // Acquire Wake Lock
  const acquireWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        wakeLockRef.current.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
      }
    } catch {}
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, []);

  // Start alarm loop (Web Worker + fallback setInterval + Service Worker notifications)
  const startAlarmLoop = useCallback(() => {
    // Immediately fire first warning
    warnUser();

    // Web Worker alarm loop
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "START", interval: 10000 });
    }

    // Fallback setInterval (in case worker is throttled)
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const endTime = getSessionEnd();
      if (Date.now() >= endTime) {
        stopWarning();
        localStorage.removeItem("edu_study_session_end");
        releaseWakeLock();
        onTimerEnd?.();
        return;
      }
      // Keep warning if still away
      if (document.hidden || !document.hasFocus()) {
        warnUser();
      } else {
        stopWarning();
      }
    }, 10000);

    // Service Worker persistent notifications
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        const endTime = getSessionEnd();
        const remaining = endTime - Date.now();
        if (remaining > 0) {
          registration.active?.postMessage({
            type: "START_ALARM_LOOP",
            duration: remaining,
            interval: 10000,
          });
        }
      }).catch(() => {});
    }
  }, [warnUser, stopWarning, releaseWakeLock, onTimerEnd]);

  const handleLeave = useCallback(() => {
    const endTime = getSessionEnd();
    if (!endTime || Date.now() >= endTime) return;

    if (!didLogLeave.current) {
      didLogLeave.current = true;
      const incidents = JSON.parse(localStorage.getItem("study_guard_incidents") || "[]");
      incidents.push({ type: "tab_leave", timestamp: new Date().toISOString() });
      localStorage.setItem("study_guard_incidents", JSON.stringify(incidents));
    }

    startAlarmLoop();
  }, [startAlarmLoop]);

  const handleReturn = useCallback(() => {
    stopWarning();

    // Stop Service Worker alarm loop
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({ type: "STOP_ALARM_LOOP" });
      }).catch(() => {});
    }

    acquireWakeLock();

    if (didLogLeave.current) {
      didLogLeave.current = false;
      const incidents = JSON.parse(localStorage.getItem("study_guard_incidents") || "[]");
      incidents.push({ type: "tab_return", timestamp: new Date().toISOString() });
      localStorage.setItem("study_guard_incidents", JSON.stringify(incidents));
    }
  }, [stopWarning, acquireWakeLock]);

  useEffect(() => {
    // Initialize persistent AudioContext
    try {
      audioCtxRef.current = new AudioContext();
    } catch {}

    // Initialize Web Worker
    try {
      workerRef.current = new Worker("/alarm-worker.js");
      workerRef.current.onmessage = (e) => {
        if (e.data.type === "TICK") {
          const endTime = getSessionEnd();
          if (!endTime || Date.now() >= endTime) {
            stopWarning();
            return;
          }
          if (document.hidden || !document.hasFocus()) {
            warnUser();
          }
        }
      };
    } catch {}

    // Acquire wake lock if session is active
    const endTime = getSessionEnd();
    if (endTime && Date.now() < endTime) {
      isSessionActive.current = true;
      acquireWakeLock();
    }

    // Register and force-update service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/alarm-sw.js").then((reg) => {
        reg.update().catch(() => {});
      }).catch(() => {});
    }

    // PRIMARY: blur fires immediately on tab switch, home button, app switch
    const onBlur = () => {
      const et = getSessionEnd();
      if (!et || Date.now() >= et) return;
      // Small delay to distinguish from screen-off:
      // On mobile, blur WITHOUT subsequent visibilitychange = screen-off
      // blur WITH visibilitychange = real leave (but we handle both for safety)
      handleLeave();
    };

    const onFocus = () => {
      const et = getSessionEnd();
      if (!et || Date.now() >= et) return;
      handleReturn();
    };

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    // BACKUP: visibilitychange catches cases blur might miss
    const handleVisibilityChange = () => {
      const et = getSessionEnd();
      if (!et) return;

      if (Date.now() >= et) {
        localStorage.removeItem("edu_study_session_end");
        stopWarning();
        releaseWakeLock();
        onTimerEnd?.();
        return;
      }

      if (document.hidden) {
        handleLeave();
      } else {
        handleReturn();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Periodically check if timer has ended
    checkTimerRef.current = setInterval(() => {
      const es = getSessionEnd();
      if (!es) return;
      if (Date.now() >= es) {
        localStorage.removeItem("edu_study_session_end");
        stopWarning();
        releaseWakeLock();
        onTimerEnd?.();
      }
    }, 1000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      stopWarning();
      releaseWakeLock();
      if (checkTimerRef.current) clearInterval(checkTimerRef.current);
      if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null; }
      if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
    };
  }, [stopWarning, warnUser, onTimerEnd, acquireWakeLock, releaseWakeLock, handleLeave, handleReturn]);
};
