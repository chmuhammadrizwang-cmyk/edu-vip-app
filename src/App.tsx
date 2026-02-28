import { Toaster } from "./components/ui/toaster";
import { Toaster as SonnerToaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";

// Naya Wrapper Import karein
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
  // Purana useStudyMonitor yahan se delete kar diya gaya hai 
  // taake duplicate logs aur refresh ka masla hal ho jaye.

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SonnerToaster />

        {/* StudyGuardWrapper ab poore project par nazar rakhega bina kisi bug ke */}
        <StudyGuardWrapper>
          <HashRouter>
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
          </HashRouter>
        </StudyGuardWrapper>
        
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
