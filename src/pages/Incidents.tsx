import React, { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { Clock, ShieldAlert, BookOpen, Video, LogOut, ChevronRight, Binary, Trash2 } from "lucide-react";
import { toast } from "sonner";

const eventStyles: { [key: string]: { gradient: string; text: string; shadow: string; icon: React.ReactNode } } = {
  VIDEO: { gradient: "from-fuchsia-50 to-white", text: "text-fuchsia-700", shadow: "shadow-fuchsia-100", icon: <Video className="w-6 h-6" /> },
  QUESTION: { gradient: "from-sky-50 to-white", text: "text-sky-700", shadow: "shadow-sky-100", icon: <BookOpen className="w-6 h-6" /> },
  SESSION: { gradient: "from-amber-50 to-white", text: "text-amber-700", shadow: "shadow-amber-100", icon: <LogOut className="w-6 h-6" /> },
  SECURITY: { gradient: "from-rose-50 to-white", text: "text-rose-700", shadow: "shadow-rose-100", icon: <ShieldAlert className="w-6 h-6" /> },
};

const Incidents = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const loadLogs = () => {
    const securityData = JSON.parse(localStorage.getItem("study_guard_incidents") || "[]");
    const studyDiary = JSON.parse(localStorage.getItem("study_diary") || "[]");
    const combined = [...securityData, ...studyDiary].sort((a, b) => {
      const timeA = new Date(a.timestamp || a.id).getTime();
      const timeB = new Date(b.timestamp || b.id).getTime();
      return timeB - timeA;
    });
    setLogs(combined);
  };

  useEffect(() => { loadLogs(); }, []);

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AppHeader onMenuClick={() => setSidebarOpen(true)} title="Activity Monitor" />
      
      <main className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-[40px] p-6 md:p-8 shadow-2xl shadow-slate-200/70 border border-white">
          <div className="flex justify-between items-center mb-10 px-2">
            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tighter flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                <Clock className="text-white w-7 h-7" />
              </div>
              Study Log
            </h2>
            <button onClick={() => { localStorage.clear(); setLogs([]); toast.error("History Cleared"); }} className="p-2 text-slate-300 hover:text-red-500">
              <Trash2 size={20} />
            </button>
          </div>

          <div className="space-y-5">
            {logs.length === 0 ? (
              <div className="text-center py-24 bg-slate-50 rounded-[30px] border-2 border-dashed border-slate-200 text-slate-400">
                <Binary className="w-16 h-16 mx-auto mb-4 opacity-40" />
                <p className="text-lg font-bold">No Records Found</p>
              </div>
            ) : (
              logs.map((log, index) => {
                const type = (log.type || log.category || "Security").toUpperCase();
                const style = eventStyles[type] || eventStyles.SECURITY;
                return (
                  <div key={index} className={`relative flex gap-5 p-5 rounded-[30px] border border-slate-100 bg-gradient-to-br ${style.gradient} ${style.shadow} transition-all`}>
                    <div className={`flex-shrink-0 p-4 rounded-2xl bg-white shadow-sm ${style.text}`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 pr-6">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${style.text} bg-white/60 px-2 py-0.5 rounded-full`}>
                          {type}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {log.time || new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <p className="text-slate-900 font-extrabold text-sm leading-tight">
                        {log.content || log.details || log.reason}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">
                        {log.date || new Date(log.timestamp).toDateString()}
                      </p>
                    </div>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* --- GOLDEN SIGNATURE FOOTER --- */}
        <footer className="mt-12 mb-6 text-center">
          <div className="inline-block px-10 py-5 bg-slate-950 rounded-[30px] shadow-2xl border border-slate-800">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Developed by
            </p>
            <p className="text-xl font-black mt-1 tracking-tighter bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
              Rizwan Ashfaq Web Developer
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Incidents;
                
