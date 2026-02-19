import { useEffect, useRef } from "react";

/**
 * Monitors tab visibility during an active study session.
 * If the user switches tabs/minimizes while the study timer is active,
 * plays a loud voice warning and sends a web notification every 10 seconds.
 */
export const useStudyMonitor = () => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const endTimeStr = localStorage.getItem("edu_study_session_end");
      if (!endTimeStr) return;

      const endTime = Number(endTimeStr);
      const now = Date.now();

      // Only monitor if study session is active
      if (now >= endTime) {
        localStorage.removeItem("edu_study_session_end");
        return;
      }

      if (document.hidden) {
        // User left — start warning loop
        warnUser();
        intervalRef.current = setInterval(() => {
          const currentEnd = Number(localStorage.getItem("edu_study_session_end") || "0");
          if (Date.now() >= currentEnd || !document.hidden) {
            stopWarning();
            return;
          }
          warnUser();
        }, 10000);
      } else {
        // User returned
        stopWarning();
      }
    };

    const warnUser = () => {
      // Voice warning
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance("Wapas ao! Study time khatam nahi hua!");
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
        new Notification("📚 Wapas ao!", {
          body: "Study time khatam nahi hua! App pe wapas aao!",
          icon: "/favicon.ico",
          tag: "study-monitor",
        });
      }
    };

    const stopWarning = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      speechSynthesis.cancel();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopWarning();
    };
  }, []);
};
