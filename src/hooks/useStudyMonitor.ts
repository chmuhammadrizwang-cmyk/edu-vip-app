import { useEffect, useRef, useCallback } from "react";

/**
 * Monitors tab visibility during an active study session.
 * - Only warns when user LEAVES the tab (actual tab switch / app switch / home)
 * - Uses blur event as the primary signal: blur fires on tab switch but NOT on screen-off
 * - visibilitychange is used only to confirm + detect return
 * - Web Worker drives the 10-second alarm interval to survive mobile throttling
 * - Wake Lock keeps the screen alive during study
 */
export const useStudyMonitor = (onTimerEnd?: () => void) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const didLogLeave = useRef(false);
  const blurredAt = useRef<number>(0);
  const workerRef = useRef<Worker | null>(null);
  const wakeLockRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

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

  useEffect(() => {
    // Initialize persistent AudioContext for high-priority audio
    try {
      audioCtxRef.current = new AudioContext();
    } catch {}

    // Initialize Web Worker for alarm timing
    try {
      workerRef.current = new Worker("/alarm-worker.js");
      workerRef.current.onmessage = (e) => {
        if (e.data.type === "TICK") {
          // Only fire alarm if still hidden and session active
          const endStr = localStorage.getItem("edu_study_session_end");
          if (!endStr || Date.now() >= Number(endStr)) {
            stopWarning();
            return;
          }
          if (document.hidden && didLogLeave.current) {
            warnUser();
          }
        }
      };
    } catch {}

    // Acquire wake lock if session is active
    const endStr = localStorage.getItem("edu_study_session_end");
    if (endStr && Date.now() < Number(endStr)) {
      acquireWakeLock();
    }

    // Force re-register service worker to clear legacy cache
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((r) => r.update().catch(() => {}));
      });
    }

    // Track blur: blur fires on actual tab switch / app switch, NOT on screen-off
    const onBlur = () => {
      blurredAt.current = Date.now();
    };
    const onFocus = () => {
      blurredAt.current = 0;
    };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    // Periodically check if timer has ended
    checkTimerRef.current = setInterval(() => {
      const es = localStorage.getItem("edu_study_session_end");
      if (!es) return;
      if (Date.now() >= Number(es)) {
        localStorage.removeItem("edu_study_session_end");
        stopWarning();
        releaseWakeLock();
        onTimerEnd?.();
      }
    }, 1000);

    const handleVisibilityChange = () => {
      const es = localStorage.getItem("edu_study_session_end");
      if (!es) return;

      const endTime = Number(es);
      const now = Date.now();

      if (now >= endTime) {
        localStorage.removeItem("edu_study_session_end");
        stopWarning();
        releaseWakeLock();
        onTimerEnd?.();
        return;
      }

      if (document.hidden) {
        // STRICT CHECK: Only treat as "left" if blur fired recently (within 2s)
        // Screen-off does NOT fire blur on most mobile browsers
        const timeSinceBlur = now - blurredAt.current;
        if (blurredAt.current === 0 || timeSinceBlur > 2000) {
          // No recent blur → screen-off, NOT a real leave. Ignore completely.
          return;
        }

        // Real tab switch / app switch — log and warn
        didLogLeave.current = true;
        const incidents = JSON.parse(localStorage.getItem("study_guard_incidents") || "[]");
        incidents.push({ type: "tab_leave", timestamp: new Date().toISOString() });
        localStorage.setItem("study_guard_incidents", JSON.stringify(incidents));

        warnUser();

        // Start Web Worker alarm loop (survives throttling)
        if (workerRef.current) {
          workerRef.current.postMessage({ type: "START", interval: 10000 });
        }

        // Fallback setInterval
        intervalRef.current = setInterval(() => {
          const ce = Number(localStorage.getItem("edu_study_session_end") || "0");
          if (Date.now() >= ce) {
            stopWarning();
            localStorage.removeItem("edu_study_session_end");
            releaseWakeLock();
            onTimerEnd?.();
            return;
          }
          if (!document.hidden) {
            stopWarning();
            return;
          }
          warnUser();
        }, 10000);
      } else {
        // User returned — stop ALL warnings
        stopWarning();

        // Re-acquire wake lock (it's released when page becomes hidden)
        acquireWakeLock();

        // Only log return if we previously logged a leave
        if (didLogLeave.current) {
          didLogLeave.current = false;
          const incidents = JSON.parse(localStorage.getItem("study_guard_incidents") || "[]");
          incidents.push({ type: "tab_return", timestamp: new Date().toISOString() });
          localStorage.setItem("study_guard_incidents", JSON.stringify(incidents));
        }
      }
    };

    const warnUser = () => {
      const userName = localStorage.getItem("study_guard_name") || "Student";
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(`${userName}, stop wasting time! This is Study Guard. Go back to your studies immediately!`);
      u.rate = 0.9;
      u.pitch = 1.1;
      u.volume = 1;
      const voices = speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.name.includes("Google Hindi") ||
        v.name.includes("Google UK English Female") ||
        v.name.includes("Google US English")
      ) || voices.find(v => v.lang.startsWith("en"));
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
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
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
  }, [stopWarning, onTimerEnd, acquireWakeLock, releaseWakeLock]);
};
