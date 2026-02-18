import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import BrandingFooter from "@/components/BrandingFooter";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { BookOpen, Clock, Bell } from "lucide-react";

const classes = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
const durations = ["15 min", "30 min", "45 min", "1 hour", "1.5 hours", "2 hours"];

const SettingsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [studyTime, setStudyTime] = useState("");
  const [studyDuration, setStudyDuration] = useState("");
  const [alarmSet, setAlarmSet] = useState(false);
  const navigate = useNavigate();

  const handleSetAlarm = () => {
    if (!studyTime) { toast.error("Please select a study time"); return; }

    // Use Web Speech API for voice alarm
    const [hours, minutes] = studyTime.split(":").map(Number);
    const now = new Date();
    const alarm = new Date();
    alarm.setHours(hours, minutes, 0, 0);
    if (alarm <= now) alarm.setDate(alarm.getDate() + 1);

    const diff = alarm.getTime() - now.getTime();

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance("Study Time! It's time to study!");
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      speechSynthesis.speak(utterance);
      // Repeat every 30 seconds
      const interval = setInterval(() => {
        if (document.visibilityState === "visible") {
          clearInterval(interval);
          speechSynthesis.cancel();
          return;
        }
        const u = new SpeechSynthesisUtterance("Study Time!");
        speechSynthesis.speak(u);
      }, 30000);

      // Stop after selected duration
      const durationMs = parseDuration(studyDuration);
      if (durationMs > 0) {
        setTimeout(() => { clearInterval(interval); speechSynthesis.cancel(); }, durationMs);
      }
    }, diff);

    setAlarmSet(true);
    toast.success(`Alarm set for ${studyTime}!`);
  };

  const parseDuration = (d: string): number => {
    if (d.includes("1.5")) return 90 * 60000;
    if (d.includes("2")) return 120 * 60000;
    if (d.includes("1 hour")) return 60 * 60000;
    const mins = parseInt(d);
    return isNaN(mins) ? 30 * 60000 : mins * 60000;
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

          <button
            onClick={() => navigate("/chat")}
            className="w-full py-4 rounded-xl bg-gradient-secondary text-secondary-foreground font-semibold text-lg glow-cyan hover:opacity-90 transition-opacity"
          >
            Start Studying →
          </button>
        </motion.div>
      </main>

      <BrandingFooter />
    </div>
  );
};

export default SettingsPage;
