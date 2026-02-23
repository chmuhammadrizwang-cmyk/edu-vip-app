import { useEffect, useRef, useCallback } from "react";

/**
 * SINGLE SOURCE OF TRUTH for focus/visibility monitoring during study sessions.
 *
 * Rules:
 * - document.hidden && document.hasFocus() => "Screen Locked" (NO alarm)
 * - document.hidden && !document.hasFocus() => "Left the app" + START alarm
 * - !document.hidden => "Returned" + STOP alarm
 * - window blur (immediate) => "Left the app" + START alarm
 * - window focus => "Returned" + STOP alarm
 *
 * No other file should listen to visibilitychange or blur/focus for study logic.
 */
export const useStudyMonitor = (onTimerEnd?: () => void, onReturn?: () => void) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const wakeLockRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Prevent duplicate "Left" logs when both blur and visibilitychange fire
  const didLogLeave = useRef(false);
  const visibilityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getSessionEnd = () => {
    const es = localStorage.getItem("edu_study_session_end");
    return es ? Number(es) : 0;
  };

  const isActive = () => {
    const end = getSessionEnd();
    return end > 0 && Date.now() < end;
  };

  // ── Incident logging (single helper, prevents stacking) ──
  const logIncident = useCallback((type: string) => {
    const incidents = JSON.parse(localStorage.getItem("study_guard_incidents") || "[]");
    incidents.push({ type, timestamp: new Date().toISOString() });
    localStorage.setItem("study_guard_incidents", JSON.stringify(incidents));
  }, []);

  // ── Alarm helpers ──
  const stopAlarm = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    workerRef.current?.postMessage({ type: "STOP" });
    speechSynthesis.cancel();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => reg.active?.postMessage({ type: "STOP_ALARM_LOOP" }))
        .catch(() => {});
    }
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
      setTimeout(() => osc.stop(), 800);
    } catch {}

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🔒 Study Guard", {
        body: `${userName}, stop wasting time! Go back to your studies!`,
        icon: "/favicon.ico",
        tag: "study-monitor",
      });
    }
  }, []);

  const startAlarm = useCallback(() => {
    warnUser();

    workerRef.current?.postMessage({ type: "START", interval: 10000 });

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!isActive()) {
        stopAlarm();
        localStorage.removeItem("edu_study_session_end");
        onTimerEnd?.();
        return;
      }
      if (document.hidden || !document.hasFocus()) {
        warnUser();
      } else {
        stopAlarm();
      }
    }, 10000);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          const remaining = getSessionEnd() - Date.now();
          if (remaining > 0) {
            reg.active?.postMessage({
              type: "START_ALARM_LOOP",
              duration: remaining,
              interval: 10000,
            });
          }
        })
        .catch(() => {});
    }
  }, [warnUser, stopAlarm, onTimerEnd]);

  // ── Wake Lock ──
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

  // ── Core event handlers ──
  const handleLeft = useCallback(() => {
    if (!isActive() || didLogLeave.current) return;
    didLogLeave.current = true;
    console.log("Left App - Starting Alarm");
    logIncident("left_app");
    startAlarm();
  }, [logIncident, startAlarm]);

  const handleScreenLocked = useCallback(() => {
    if (!isActive()) return;
    console.log("Screen turned off - No Alarm");
    logIncident("screen_locked");
  }, [logIncident]);

  const handleReturned = useCallback(() => {
    if (!isActive()) return;
    stopAlarm();
    acquireWakeLock();
    if (didLogLeave.current) {
      didLogLeave.current = false;
      logIncident("returned");
      onReturn?.();
    }
  }, [stopAlarm, acquireWakeLock, logIncident, onReturn]);

  useEffect(() => {
    // Init AudioContext
    try { audioCtxRef.current = new AudioContext(); } catch {}

    // Init Web Worker
    try {
      workerRef.current = new Worker("/alarm-worker.js");
      workerRef.current.onmessage = (e) => {
        if (e.data.type === "TICK") {
          if (!isActive()) { stopAlarm(); return; }
          if (document.hidden || !document.hasFocus()) warnUser();
        }
      };
    } catch {}

    // Acquire wake lock if session active
    if (isActive()) acquireWakeLock();

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/alarm-sw.js").then((reg) => {
        reg.update().catch(() => {});
      }).catch(() => {});
    }

    // ── SINGLE visibilitychange listener ──
    // Uses a 1-second timeout + Performance.now() to detect screen-off vs app-exit.
    // When screen locks, the OS freezes JS execution, so the timeout fires late.
    // When user switches apps, JS keeps running and the timeout fires on time.
    const onVisibilityChange = () => {
      if (!isActive()) {
        const end = getSessionEnd();
        if (end && Date.now() >= end) {
          localStorage.removeItem("edu_study_session_end");
          stopAlarm();
          releaseWakeLock();
          onTimerEnd?.();
        }
        return;
      }

      if (document.hidden) {
        // Cancel any previous pending check
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
          visibilityTimeoutRef.current = null;
        }

        const scheduledAt = performance.now();
        const DELAY = 1000; // 1 second
        const TOLERANCE = 500; // if execution was paused > 500ms extra, it's screen lock

        visibilityTimeoutRef.current = setTimeout(() => {
          visibilityTimeoutRef.current = null;
          if (!isActive()) return;

          const elapsed = performance.now() - scheduledAt;
          const wasPaused = elapsed > DELAY + TOLERANCE;

          if (wasPaused) {
            // Browser execution was frozen → screen was locked
            console.log("Screen turned off (detected via execution pause) - No Alarm");
            logIncident("screen_locked");
          } else if (!didLogLeave.current) {
            // Execution continued normally → user actually left the app
            console.log("Left App (confirmed via timeout) - Starting Alarm");
            didLogLeave.current = true;
            logIncident("left_app");
            startAlarm();
          }
        }, DELAY);
      } else {
        // Came back — cancel pending detection if still waiting
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
          visibilityTimeoutRef.current = null;
        }
        handleReturned();
      }
    };

    // ── SINGLE blur listener ──
    const onBlur = () => {
      if (!isActive()) return;
      handleLeft();
    };

    // ── SINGLE focus listener ──
    const onFocus = () => {
      if (!isActive()) return;
      handleReturned();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    // Timer end check
    checkTimerRef.current = setInterval(() => {
      const es = getSessionEnd();
      if (!es) return;
      if (Date.now() >= es) {
        localStorage.removeItem("edu_study_session_end");
        stopAlarm();
        releaseWakeLock();
        onTimerEnd?.();
      }
    }, 1000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      if (visibilityTimeoutRef.current) { clearTimeout(visibilityTimeoutRef.current); visibilityTimeoutRef.current = null; }
      stopAlarm();
      releaseWakeLock();
      if (checkTimerRef.current) clearInterval(checkTimerRef.current);
      if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null; }
      if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
    };
  }, [stopAlarm, warnUser, onTimerEnd, acquireWakeLock, releaseWakeLock, handleLeft, handleScreenLocked, handleReturned]);
};
