import { useState, useEffect } from "react";
import { useStudyMonitor } from "./hooks/useStudyMonitor";
import { Toaster } from "./components/ui/toaster";
import { Toaster as SonnerToaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import StudyGuardWrapper from "./components/StudyGuardWrapper";

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

  useEffect(() => {
    let isRefreshing = false;
    window.addEventListener('beforeunload', () => { isRefreshing = true; });

    const saveActivityLog = (message: string, type: string = "SECURITY") => {
      if (isRefreshing) return;
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
      
      if (diary.length > 0 && diary[0].content === message) return;
      localStorage.setItem("study_diary", JSON.stringify([newLog, ...diary]));
    };

    let leaveTime: number | null = null;

    const handleVisibility = () => {
      // --- 🚨 CONDITION: Sirf tab log bane jab Time Select ho chuka ho ---
      const hasTarget = localStorage.getItem("last_logged_target");
      if (!hasTarget || isRefreshing) return;

      if (document.hidden) {
        leaveTime = Date.now();
        saveActivityLog("🚨 STUDENT LEFT APP");
      } else {
        let durationMsg = "✅ STUDENT RETURNED";
        if (leaveTime) {
          const diff = Math.floor((Date.now() - leaveTime) / 1000);
          const mins = Math.floor(diff / 60);
          const secs = diff % 60;
          durationMsg = `✅ RETURNED (OUT: ${mins}M ${secs}S)`;
        }
        saveActivityLog(durationMsg);
        setShowFocusAlert(true);
        setTimeout(() => setShowFocusAlert(false), 2500);
        leaveTime = null; 
      }
    };

    // Study Target Tracker (Time & Date check)
    const targetInterval = setInterval(() => {
      const target = localStorage.getItem("study_target_minutes");
      // Agar user ne time select kiya hai aur wo pehle log nahi hua
      if (target && localStorage.getItem("last_logged_target") !== target) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        saveActivityLog(`🎯 TARGET SET: ${target} Mins selected at ${timeStr}`, "STUDY");
        localStorage.setItem("last_logged_target", target);
      }
    }, 2000);

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(targetInterval);
    };
  }, []);

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
            <p className="text-white mt-4 text-xl font-bold tracking-[0.5em] opacity-80 uppercase text-center px-4">Elite Monitoring Active</p>
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
            
