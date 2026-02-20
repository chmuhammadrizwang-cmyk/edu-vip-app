import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import BrandingFooter from "@/components/BrandingFooter";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { BookOpen, Clock, Bell, FlaskConical, Lock } from "lucide-react";
import { requestFullscreen } from "@/hooks/useStudyLock";

const classes = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
const durations = ["15 min", "30 min", "45 min", "1 hour", "1.5 hours", "2 hours"];

const SettingsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(() => localStorage.getItem("edu_selected_class") || "");
  const [studyTime, setStudyTime] = useState(() => localStorage.getItem("edu_study_time") || "");
  const [studyDuration, setStudyDuration] = useState(() => localStorage.getItem("edu_study_duration") || "");
  const [alarmSet, setAlarmSet] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/alarm-sw.js").catch(() => {});
    }
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const triggerAlarm = (durationMs: number) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("📚 Study Time!", { body: "It's time to study!", icon: "/favicon.ico" });
    }
    const utterance = new SpeechSynthesisUtterance("Study Time! It's time to study!");
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    speechSynthesis.speak(utterance);
    playBeep();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        clearInterval(interval);
        speechSynthesis.cancel();
        return;
      }
      const u = new SpeechSynthesisUtterance("Study Time!");
      speechSynthesis.speak(u);
      playBeep();
    }, 30000);

    if (durationMs > 0) {
      setTimeout(() => { clearInterval(interval); speechSynthesis.cancel(); }, durationMs);
    }
  };

  const playBeep = () => {
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = "square";
      gain.gain.value = 0.5;
      oscillator.start();
      setTimeout(() => { oscillator.stop(); ctx.close(); }, 1000);
    } catch {}
  };

  const handleSetAlarm = () => {
    if (!studyTime) { toast.error("Please select a study time"); return; }

    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const [hours, minutes] = studyTime.split(":").map(Number);
    const now = new Date();
    const alarm = new Date();
    alarm.setHours(hours, minutes, 0, 0);
    if (alarm <= now) alarm.setDate(alarm.getDate() + 1);

    const diff = alarm.getTime() - now.getTime();
    const durationMs = parseDuration(studyDuration);

    if (selectedClass) localStorage.setItem("edu_selected_class", selectedClass);
    if (studyTime) localStorage.setItem("edu_study_time", studyTime);
    if (studyDuration) localStorage.setItem("edu_study_duration", studyDuration);
    const endTime = Date.now() + diff + durationMs;
    localStorage.setItem("edu_study_session_end", String(endTime));

    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SET_ALARM",
        delay: diff,
        duration: durationMs,
      });
    }

    setTimeout(() => triggerAlarm(durationMs), diff);

    setAlarmSet(true);
    requestFullscreen();
    toast.success(`Alarm set for ${studyTime}! Redirecting to Dashboard...`);
    setTimeout(() => navigate("/chat"), 1000);
  };

  const handleTestAlarm = () => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    toast.info("Alarm will trigger in 5 seconds — minimize the app now!");
    setTimeout(() => triggerAlarm(10000), 5000);
  };

  const parseDuration = (d: string): number => {
    if (d.includes("1.5")) return 90 * 60000;
    if (d.includes("2")) return 120 * 60000;
    if (d.includes("1 hour")) return 60 * 60000;
    const mins = parseInt(d);
    return isNaN(mins) ? 30 * 60000 : mins * 60000;
  };

  const handleChangePin = () => {
    const storedPin = localStorage.getItem("study_guard_pin") || "0000";
    setPinError("");
    setPinSuccess(false);

    if (currentPin !== storedPin) {
      setPinError("Current PIN is incorrect");
      return;
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError("New PIN must be 4 digits");
      return;
    }
    localStorage.setItem("study_guard_pin", newPin);
    setCurrentPin("");
    setNewPin("");
    setPinSuccess(true);
    toast.success("PIN updated successfully!");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AppHeader onMenuClick={() => setSidebarOpen(true)} title="Settings" />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Class Selection */}
          <div className="glass rounded-2xl p-6 glow-cyan">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="h-6 w-6 text-secondary" />
              <h2 className="font-display text-lg font-semibold text-foreground">Select Class</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {classes.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedClass(c)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    selectedClass === c
                      ? "bg-gradient-secondary text-secondary-foreground glow-cyan"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Study Time */}
          <div className="glass rounded-2xl p-6 glow-pink">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-6 w-6 text-accent" />
              <h2 className="font-display text-lg font-semibold text-foreground">Study Time</h2>
            </div>
            <input
              type="time"
              value={studyTime}
              onChange={(e) => setStudyTime(e.target.value)}
              className="w-full py-3 px-4 rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all mb-4"
            />
            <p className="text-sm text-muted-foreground mb-3">Duration:</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {durations.map((d) => (
                <button
                  key={d}
                  onClick={() => setStudyDuration(d)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    studyDuration === d
                      ? "bg-gradient-accent text-accent-foreground glow-pink"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Set Alarm */}
          <button
            onClick={handleSetAlarm}
            className="w-full py-4 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-lg glow-primary hover:opacity-90 transition-opacity flex items-center justify-center gap-3"
          >
            <Bell className="h-5 w-5" />
            {alarmSet ? "Alarm Set ✓" : "Set Voice Alarm"}
          </button>

          {/* Test Alarm */}
          <button
            onClick={handleTestAlarm}
            className="w-full py-3 rounded-xl bg-muted/50 border border-border text-foreground font-medium text-sm hover:bg-muted transition-all flex items-center justify-center gap-2"
          >
            <FlaskConical className="h-4 w-4 text-accent" />
            Test 5-Second Alarm
          </button>

          <button
            onClick={() => {
              if (selectedClass) localStorage.setItem("edu_selected_class", selectedClass);
              if (studyTime) localStorage.setItem("edu_study_time", studyTime);
              if (studyDuration) localStorage.setItem("edu_study_duration", studyDuration);
              requestFullscreen();
              navigate("/chat");
            }}
            className="w-full py-4 rounded-xl bg-gradient-secondary text-secondary-foreground font-semibold text-lg glow-cyan hover:opacity-90 transition-opacity"
          >
            Start Studying →
          </button>

          {/* PIN Management */}
          <div className="glass rounded-2xl p-6 glow-primary">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="h-6 w-6 text-primary" />
              <h2 className="font-display text-lg font-semibold text-foreground">Change Parental PIN</h2>
            </div>
            <div className="space-y-3">
              <input
                type="password"
                maxLength={4}
                inputMode="numeric"
                placeholder="Current PIN"
                value={currentPin}
                onChange={(e) => { setCurrentPin(e.target.value.replace(/\D/g, "")); setPinError(""); setPinSuccess(false); }}
                className="w-full py-3 px-4 rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all text-center tracking-[0.5em]"
              />
              <input
                type="password"
                maxLength={4}
                inputMode="numeric"
                placeholder="New PIN"
                value={newPin}
                onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, "")); setPinError(""); setPinSuccess(false); }}
                className="w-full py-3 px-4 rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all text-center tracking-[0.5em]"
              />
              {pinError && <p className="text-destructive text-sm text-center">{pinError}</p>}
              {pinSuccess && <p className="text-sm text-center" style={{ color: "hsl(145 95% 55%)" }}>PIN updated! ✓</p>}
              <button
                onClick={handleChangePin}
                disabled={currentPin.length !== 4 || newPin.length !== 4}
                className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Update PIN
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      <BrandingFooter />
    </div>
  );
};

export default SettingsPage;
