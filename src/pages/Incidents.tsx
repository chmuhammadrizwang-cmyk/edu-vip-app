import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import BrandingFooter from "@/components/BrandingFooter";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import PinDialog from "@/components/PinDialog";
import { AlertTriangle, Trash2 } from "lucide-react";

interface Incident {
  type: string;
  timestamp: string;
}

const typeLabels: Record<string, string> = {
  tab_switch: "Left the app",
  tab_leave: "Left the app",
  tab_return: "Returned to app",
  screen_locked: "Screen Locked",
  wrong_pin: "Wrong PIN attempt",
  close_attempt: "Tried to close tab",
};

const Incidents = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("study_guard_incidents") || "[]");
    setIncidents([...data].reverse());
  }, []);

  const handleDeleteClick = () => {
    setShowPin(true);
  };

  const onPinSuccess = () => {
    setShowPin(false);
    localStorage.setItem("study_guard_incidents", "[]");
    setIncidents([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PinDialog open={showPin} onSuccess={onPinSuccess} onCancel={() => setShowPin(false)} />
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AppHeader onMenuClick={() => setSidebarOpen(true)} title="Focus Log" />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-accent" />
              <h2 className="font-display text-lg font-bold text-foreground">Focus Log</h2>
            </div>
            {incidents.length > 0 && (
              <button onClick={handleDeleteClick} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {incidents.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-muted-foreground">No incidents recorded. Great focus!</p>
            </div>
          ) : (
            incidents.map((inc, i) => (
              <div key={i} className="glass rounded-xl p-4 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{typeLabels[inc.type] || inc.type}</p>
                  <p className="text-xs text-muted-foreground">{new Date(inc.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </motion.div>
      </main>
      <BrandingFooter />
    </div>
  );
};

export default Incidents;
