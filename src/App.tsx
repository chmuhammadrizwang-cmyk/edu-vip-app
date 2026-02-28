import { useState } from "react";
import { useStudyMonitor } from "./hooks/useStudyMonitor";
import { Toaster } from "./components/ui/toaster";
import { Toaster as SonnerToaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import StudyGuardWrapper from "./components/StudyGuardWrapper";

// Saare Pages confirm karein ke sahi imported hain
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

  // Global Monitor
  useStudyMonitor(undefined, () => {
    setShowFocusAlert(true);
    setTimeout(() => setShowFocusAlert(false), 3000);
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SonnerToaster />

        {/* Focus Alert Overlay - Isko Wrapper ke bahar rakhein */}
        {showFocusAlert && (
          <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl">
            <div className="p-8 rounded-full bg-green-500/20 border-2 border-green-500 animate-pulse mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#00ff00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h1 className="text-white text-6xl font-black uppercase italic">Focus Active</h1>
            <p className="text-green-500 mt-4 text-xl font-bold tracking-widest">SYSTEM RESUMED</p>
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
            
