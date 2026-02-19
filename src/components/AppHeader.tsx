import { Menu, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { isStudyActive } from "@/hooks/useStudyLock";

interface AppHeaderProps {
  onMenuClick: () => void;
  title?: string;
}

const AppHeader = ({ onMenuClick, title }: AppHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const studyActive = isStudyActive();
  const showBack = !studyActive && location.pathname !== "/" && location.pathname !== "/auth";

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 glass border-b border-border">
      <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-muted transition-colors">
        <Menu className="h-6 w-6 text-foreground" />
      </button>
      {showBack && (
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
      )}
      {title && <h1 className="font-display text-sm font-semibold tracking-wide text-gradient-primary">{title}</h1>}
    </header>
  );
};

export default AppHeader;
