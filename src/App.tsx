import { useState, useEffect } from "react";
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

  // --- 🛠️ ELITE MONITORING LOGIC START ---
  useEffect(() => {
    // 1. Refresh detect karne ke liye variable
    let isRefreshing = false;
    window.onbeforeunload = () => { isRefreshing = true; };

    const saveActivityLog = (message: string, type: string = "SECURITY") => {
      if (isRefreshing) return; // Refresh ho raha ho to log na banaye
      
      const diary = JSON.parse(localStorage.getItem("study_diary") || "[]");
      const now = new Date();
      
      // Duplicate entry rokne ke liye
      if (diary.length > 0 && diary[0].content === message) return;

      const newLog = {
        id: Date.now(),
        type: type,
        content: message,
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: now.toDateString(),
        timestamp: now.toISOString()
      };
      
      localStorage.setItem("study_diary", JSON.stringify([newLog, ...diary]));
    };

    // 2. Study Target Monitor (Exact Time aur Minutes ke sath)
    const checkTarget = setInterval(() => {
      const targetTime = localStorage.getItem("study_target_minutes");
      const isStudying = localStorage.getItem("isStudying") === "true";
      
      if (isStudying && targetTime && localStorage.getItem("target_logged_val") !== targetTime) {
        const now = new Date();
        const startTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const msg = `🎯 TARGET SET: ${targetTime} Minutes study selected at ${startTime}`;
        saveActivityLog(msg, "STUDY");
        localStorage.setItem("target_logged_val", targetTime);
      }
      
      // Agar study khatam ho jaye to flag reset karein
      if (!isStudying) {
        localStorage.removeItem("target_logged_val");
      }
    }, 1000);

    let leaveTime: number | null = null;

    const handleVisibility = () => {
      // 3. Strict Mode: Sirf tab log bane jab study start ho
      const isStudying = localStorage.getItem("isStudying") === "true";
      if (!isStudying || isRefreshing) return;

      if (document.hidden) {
        leaveTime = Date.now();
        saveActivityLog("🚨 STUDENT LEFT APP");
      } else {
        let durationMsg = "✅ STUDENT RETURNED";
        if (leaveTime) {
          const diff = Math.floor((Date.now() - leaveTime) / 1000);
          const mins = Math.floor(diff / 60);
          const secs = diff % 60;
          durationMsg = `✅ RETURNED (STAYED OUT: ${mins}M ${secs}S)`;
        }
        saveActivityLog(durationMsg);

        setShowFocusAlert(true);
        setTimeout(() => setShowFocusAlert(false), 2500);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(checkTarget);
    };
  }, []);
  // --- 🛠️ ELITE MONITORING LOGIC END ---

  useStudyMonitor(undefined, () => {
    setShowFocusAlert(true);
    setTimeout(() => setShowFocusAlert(false), 3000);
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SonnerToaster />

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
