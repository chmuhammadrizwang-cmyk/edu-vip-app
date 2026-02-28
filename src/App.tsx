import { useState } from "react";
import { useStudyMonitor } from "./hooks/useStudyMonitor";
import { Toaster } from "./components/ui/toaster";
import { Toaster as SonnerToaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import StudyGuardWrapper from "./components/StudyGuardWrapper";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import StudySearch from "./pages/StudySearch";
import Incidents from "./pages/Incidents";
// ... baki pages import kar lein

const queryClient = new QueryClient();

const App = () => {
  const [showFocusAlert, setShowFocusAlert] = useState(false);

  // Global Monitor Call
  useStudyMonitor(undefined, () => {
    setShowFocusAlert(true);
    setTimeout(() => setShowFocusAlert(false), 3000);
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SonnerToaster />

        {/* Focus Activation Overlay */}
        {showFocusAlert && (
          <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="p-8 rounded-full bg-primary/20 border-2 border-primary animate-pulse mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#00ff00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h1 className="text-white text-6xl font-black tracking-tighter uppercase italic italic">Focus Active</h1>
            <p className="text-primary mt-4 text-xl font-bold tracking-widest uppercase">Monitoring System Resumed</p>
          </div>
        )}

        <StudyGuardWrapper>
          <HashRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/study-search" element={<StudySearch />} />
              <Route path="/incidents" element={<Incidents />} />
              {/* Baki routes yahan add karein */}
            </Routes>
          </HashRouter>
        </StudyGuardWrapper>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
