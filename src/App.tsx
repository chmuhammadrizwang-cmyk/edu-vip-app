import { useState, useEffect } from "react"; // useEffect add kiya
import { useStudyMonitor } from "./hooks/useStudyMonitor";
import { Toaster } from "./components/ui/toaster";
import { Toaster as SonnerToaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import StudyGuardWrapper from "./components/StudyGuardWrapper";

// Saare Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SettingsPage from "./pages/SettingsPage";
import Chat from "./pages/Chat";
import PuzzleGame from "./pages/PuzzleGame";
import Incidents from "./pages/Incidents";
import ParentalSecurity from "./pages/ParentalSecurity";
import StudySearch from "./pages/StudySearch";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showFocusAlert, setShowFocusAlert] = useState(false);

  // --- 🛠️ UNIVERSAL TRACKING LOGIC START ---
  useEffect(() => {
    const saveActivityLog = (message: string, type: string = "SECURITY") => {
      const diary = JSON.parse(localStorage.getItem("study_diary") || "[]");
      const now = new Date();
      const newLog = {
        id: Date.now(),
        type: type,
        content: message,
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: now.toDateString(),
        timestamp: now.toISOString()
      };
      // Duplicate logs rokne ke liye check (agar aakhri log wahi hai to dobara na banaye)
      if (diary.length > 0 && diary[0].content === message) return;
      
      localStorage.setItem("study_diary", JSON.stringify([newLog, ...diary]));
    };

    const handleVisibility = () => {
      if (document.hidden) {
        saveActivityLog("🚨 ALERT: Student minimized the app or switched tabs!");
      } else {
        saveActivityLog("✅ LOG: Student returned to the study session.");
        // Wapis aane par alert dikhayen
        setShowFocusAlert(true);
        setTimeout(() => setShowFocusAlert(false), 2500);
      }
    };

    // Tab Change & Minimize Monitor
    document.addEventListener("visibilitychange", handleVisibility);
    
    // Focus Loss (Jab bacha notifications check kare ya browser se bahir click kare)
    const handleBlur = () => saveActivityLog("⚠️ WARNING: App focus lost! (Suspected multitasking)");
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);
  // --- 🛠️ UNIVERSAL TRACKING LOGIC END ---

  // Global Monitor (Existing hooks)
  useStudyMonitor(undefined, () => {
    setShowFocusAlert(true);
    setTimeout(() => setShowFocusAlert(false), 3000);
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SonnerToaster />

        {/* Focus Alert Overlay - Elite Glassmorphism */}
        {showFocusAlert && (
          <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl">
            <div className="p-10 rounded-full bg-amber-500/10 border-2 border-amber-500/50 animate-pulse mb-8 shadow-[0_0_50px_rgba(245,158,11,0.3)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h1 className="text-amber-500 text-7xl font-black uppercase tracking-tighter italic">Focus Locked</h1>
            <p className="text-white mt-4 text-xl font-bold tracking-[0.5em] opacity-80 uppercase">Elite Monitoring Active</p>
          </div>
        )}

        <HashRouter>
          <StudyGuardWrapper>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/puzzle" element={<PuzzleGame />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/parental-security" element={<ParentalSecurity />} />
              <Route path="/study-search" element={<StudySearch />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </StudyGuardWrapper>
        </HashRouter>
        
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
