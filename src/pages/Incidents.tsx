import React, { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { Clock, ShieldAlert, BookOpen, Video, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Incidents = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const loadLogs = () => {
    // 1. Purana security data aur naya diary data dono uthao
    const securityData = JSON.parse(localStorage.getItem("study_guard_incidents") || "[]");
    const studyDiary = JSON.parse(localStorage.getItem("study_diary") || "[]");

    // 2. Dono ko milao aur sort karo (Naya data upar aaye)
    const combined = [...securityData, ...studyDiary].sort((a, b) => {
      const timeA = new Date(a.timestamp || a.id).getTime();
      const timeB = new Date(b.timestamp || b.id).getTime();
      return timeB - timeA;
    });

    setLogs(combined);
  };

  useEffect(() => { loadLogs(); }, []);

  // VIP Design Styles
  const getStyles = (type: string) => {
    const t = type?.toUpperCase();
    if (t === 'VIDEO') return { bg: 'bg-purple-50', text: 'text-purple-600', icon: <Video size={20} />, border: 'border-purple-100' };
    if (t === 'QUESTION') return { bg: 'bg-blue-50', text: 'text-blue-600', icon: <BookOpen size={20} />, border: 'border-blue-100' };
    if (t === 'SESSION') return { bg: 'bg-orange-50', text: 'text-orange-600', icon: <LogOut size={20} />, border: 'border-orange-100' };
    return { bg: 'bg-red-50', text: 'text-red-600', icon: <ShieldAlert size={20} />, border: 'border-red-100' };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AppHeader onMenuClick={() => setSidebarOpen(true)} title="History" />
      
      <main className="p-4 max-w-xl mx-auto">
        <div className="bg-white rounded-[32px] p-6 shadow-xl border border-slate-100">
          <div className="flex justify-between items-center mb-8 px-2">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="text-blue-600" /> Study Log
            </h2>
            <button onClick={() => { localStorage.clear(); setLogs([]); toast.success("Cleared!"); }} className="p-2 text-slate-300 hover:text-red-500">
              <Trash2 size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-center py-20 text-slate-400">No records found. 📚</p>
            ) : (
              logs.map((log, index) => {
                const style = getStyles(log.type || log.category);
                return (
                  <div key={index} className={`flex gap-4 p-4 rounded-3xl border ${style.border} ${style.bg}`}>
                    <div className={`p-3 rounded-2xl bg-white shadow-sm ${style.text}`}>
                      {style.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${style.text}`}>
                          {log.type || 'SECURITY'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {log.time || new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      {/* Yahan fix hai: log.content ab asli data dikhaye ga */}
                      <p className="text-slate-800 font-bold text-sm">
                        {log.content || log.details || log.reason}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1">
                        {log.date || new Date(log.timestamp).toDateString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Incidents;
