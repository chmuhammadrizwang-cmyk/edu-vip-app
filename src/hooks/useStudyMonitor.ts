import { useEffect, useRef, useCallback } from "react";

export const useStudyMonitor = (
  onTimerEnd?: () => void,
  onReturn?: () => void
) => {
  const alarmRef = useRef<number | null>(null);
  const leftRef = useRef(false);
  const hiddenAtRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  const getSessionEnd = () => {
    const v = localStorage.getItem("edu_study_session_end");
    return v ? Number(v) : 0;
  };

  const isActive = () => {
    const end = getSessionEnd();
    return end > 0 && Date.now() < end;
  };

  const log = (type: "left" | "return") => {
    const arr = JSON.parse(
      localStorage.getItem("study_guard_incidents") || "[]"
    );
    arr.push({ type, time: new Date().toISOString() });
    localStorage.setItem("study_guard_incidents", JSON.stringify(arr));
  };

  const stopAlarm = useCallback(() => {
    if (alarmRef.current) {
      clearInterval(alarmRef.current);
      alarmRef.current = null;
    }
    speechSynthesis.cancel();
  }, []);

  const warn = useCallback(() => {
    const name = localStorage.getItem("study_guard_name") || "Student";
    speechSynthesis.cancel();
    speechSynthesis.speak(
      new SpeechSynthesisUtterance(
        `${name}, go back to your studies now`
      )
    );
  }, []);

  const startAlarm = useCallback(() => {
    if (alarmRef.current) return;

    warn();
    alarmRef.current = window.setInterval(() => {
      if (!isActive()) {
        stopAlarm();
        onTimerEnd?.();
        return;
      }
      warn();
    }, 10000);
  }, [warn, stopAlarm, onTimerEnd]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (!isActive()) return;

      // App hidden
      if (document.hidden) {
        hiddenAtRef.current = performance.now();

        timeoutRef.current = window.setTimeout(() => {
          const diff = performance.now() - hiddenAtRef.current;

          // 🔒 Screen OFF case → ignore
          if (diff > 2500) return;

          // 📱 App left (home / back)
          if (!leftRef.current) {
            leftRef.current = true;
            log("left");
            startAlarm();
          }
        }, 1200);
      } else {
        // App returned
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (leftRef.current) {
          leftRef.current = false;
          stopAlarm();
          log("return");
          onReturn?.();
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      stopAlarm();
    };
  }, [startAlarm, stopAlarm, onReturn]);
};
