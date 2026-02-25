import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { hashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SettingsPage from "./pages/SettingsPage";
import Chat from "./pages/Chat";
import PuzzleGame from "./pages/PuzzleGame";
import Incidents from "./pages/Incidents";
import ParentalSecurity from "./pages/ParentalSecurity";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <hashRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/puzzle" element={<PuzzleGame />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/parental-security" element={<ParentalSecurity />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </hashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
