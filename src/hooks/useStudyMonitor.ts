import { useEffect, useRef, useCallback } from "react";

/**
 * Monitors tab visibility during an active study session.
 * - Only warns when user LEAVES the tab (actual tab switch, not screen off)
 * - Logs both leave and return events
 * - Stops immediately when user returns
 * - Stops when timer ends
 * - Does NOT trigger on screen off (saves battery & avoids false positives)
 */
export const useStudyMonitor = (onTimerEnd?: () => void) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track whether the window had focus before visibility change
  // If window loses focus THEN becomes hidden → tab switch
  // If window still has focus when hidden → screen off
  const hadFocusBeforeHide = useRef(true);

  const stopWarning = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    // Track window focus to distinguish tab switch from screen off
    const onFocus = () => { hadFocusBeforeHide.current = true; };
    const onBlur = () => { hadFocusBeforeHide.current = false; };
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

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
        // Distinguish screen off from tab switch:
        // If window lost focus (blur fired) before going hidden → user switched tabs
        // If window still had focus when hidden → screen turned off
        if (hadFocusBeforeHide.current) {
          // Screen off — do NOT warn, save battery
          return;
        }

        // Actual tab switch — log and warn
        const incidents = JSON.parse(localStorage.getItem("study_guard_incidents") || "[]");
        incidents.push({ type: "tab_leave", timestamp: new Date().toISOString() });
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
            stopWarning();
            return;
          }
          warnUser();
        }, 10000);
      } else {
        // User returned to the tab — stop ALL warnings immediately
        stopWarning();

        // Log return event
        const incidents = JSON.parse(localStorage.getItem("study_guard_incidents") || "[]");
        incidents.push({ type: "tab_return", timestamp: new Date().toISOString() });
        localStorage.setItem("study_guard_incidents", JSON.stringify(incidents));
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
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      stopWarning();
      if (checkTimerRef.current) clearInterval(checkTimerRef.current);
    };
  }, [stopWarning, onTimerEnd]);
};
