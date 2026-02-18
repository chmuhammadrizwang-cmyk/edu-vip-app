import { Home, Settings, MessageSquare, Puzzle, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "AI Chat", url: "/chat", icon: MessageSquare },
  { title: "Puzzle Game", url: "/puzzle", icon: Puzzle },
];

const AppSidebar = ({ open, onClose }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
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
              <h2 className="font-display text-lg font-bold text-gradient-primary">EduApp</h2>
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
                    onClick={() => { navigate(item.url); onClose(); }}
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
  );
};

export default AppSidebar;
