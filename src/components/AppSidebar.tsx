import { Settings, MessageSquare, Puzzle, AlertTriangle, X, Shield, ShieldCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import PinDialog from "@/components/PinDialog";
import { isStudyActive } from "@/hooks/useStudyLock";

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { title: "Dashboard", url: "/chat", icon: MessageSquare },
  { title: "Settings", url: "/settings", icon: Settings, pinProtected: true },
  { title: "Puzzle Game", url: "/puzzle", icon: Puzzle },
  { title: "Focus Log", url: "/incidents", icon: AlertTriangle },
  { title: "Parental Security", url: "/parental-security", icon: ShieldCheck, pinProtected: true },
];

const AppSidebar = ({ open, onClose }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPin, setShowPin] = useState(false);
  const [pendingUrl, setPendingUrl] = useState("");

  const handleNav = (item: typeof navItems[0]) => {
    if ((item as any).pinProtected && isStudyActive()) {
      setPendingUrl(item.url);
      setShowPin(true);
    } else {
      navigate(item.url);
      onClose();
    }
  };

  return (
    <>
      <PinDialog
        open={showPin}
        onSuccess={() => { setShowPin(false); navigate(pendingUrl); onClose(); }}
        onCancel={() => setShowPin(false)}
      />
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-50 h-full w-72 glass border-r border-border p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg font-bold text-gradient-primary">Study Guard</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <nav className="flex flex-col gap-2 flex-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <button
                      key={item.url}
                      onClick={() => handleNav(item)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                        isActive
                          ? "bg-gradient-primary text-primary-foreground glow-primary"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </button>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AppSidebar;
