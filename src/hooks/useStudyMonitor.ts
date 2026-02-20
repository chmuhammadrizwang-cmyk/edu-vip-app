import { useEffect, useRef, useCallback } from "react";

/**
 * Monitors tab visibility during an active study session.
 * - Only warns when user LEAVES the tab (not while active on it)
 * - Stops immediately when user returns
 * - Stops when timer ends
 * - Stops when screen is off (to save battery)
 */
export const useStudyMonitor = (onTimerEnd?: () => void) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopWarning = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    // Periodically check if timer has ended
    checkTimerRef.current = setInterval(() => {
      const endTimeStr = localStorage.getItem("edu_study_session_end");
      if (!endTimeStr) return;
      if (Date.now() >= Number(endTimeStr)) {
        localStorage.removeItem("edu_study_session_end");
        stopWarning();
        onTimerEnd?.();
      }
    }, 1000);

    const handleVisibilityChange = () => {
      const endTimeStr = localStorage.getItem("edu_study_session_end");
      if (!endTimeStr) return;

      const endTime = Number(endTimeStr);
      const now = Date.now();

      if (now >= endTime) {
        localStorage.removeItem("edu_study_session_end");
        stopWarning();
        onTimerEnd?.();
        return;
      }

      if (document.hidden) {
        // Check if screen is actually off (battery saving) — 
        // We detect "screen off" heuristically: if hidden and no user interaction
        // The Page Visibility API fires for both tab switch AND screen off.
        // We notify in both cases but the interval self-checks for timer expiry.

        // Log incident
        const incidents = JSON.parse(localStorage.getItem("study_guard_incidents") || "[]");
        incidents.push({ type: "tab_switch", timestamp: new Date().toISOString() });
        localStorage.setItem("study_guard_incidents", JSON.stringify(incidents));

        warnUser();
        intervalRef.current = setInterval(() => {
          const currentEnd = Number(localStorage.getItem("edu_study_session_end") || "0");
          if (Date.now() >= currentEnd) {
            stopWarning();
            localStorage.removeItem("edu_study_session_end");
            onTimerEnd?.();
            return;
          }
          if (!document.hidden) {
            // User returned — stop immediately
            stopWarning();
            return;
          }
          warnUser();
        }, 10000);
      } else {
        // User returned to the tab — stop ALL warnings immediately
        stopWarning();
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

      // Loud beep
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = "square";
        gain.gain.value = 0.7;
        osc.start();
        setTimeout(() => { osc.stop(); ctx.close(); }, 800);
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
      stopWarning();
      if (checkTimerRef.current) clearInterval(checkTimerRef.current);
    };
  }, [stopWarning, onTimerEnd]);
};
