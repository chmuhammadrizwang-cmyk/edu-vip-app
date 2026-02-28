import React, { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { Clock, ShieldAlert, BookOpen, Video, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Incidents = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const loadLogs = () => {
    // 1. Purane incidents (Security alerts) uthao
    const securityAlerts = JSON.parse(localStorage.getItem("study_guard_incidents") || "[]").map((item: any) => ({
      ...item,
      category: "Security",
      type: "Alert",
      icon: <ShieldAlert className="text-red-500" size={20} />
    }));

    // 2. Nayi Study Diary (Questions, Videos, Sessions) uthao
    const studyDiary = JSON.parse(localStorage.getItem("study_diary") || "[]").map((item: any) => {
      let icon = <BookOpen className="text-blue-500" size={20} />;
      if (item.type === "Video") icon = <Video className="text-purple-500" size={20} />;
      if (item.type === "Session") icon = <LogOut className="text-orange-500" size={20} />;
      return { ...item, category: item.type, icon };
    });

    // 3. Dono ko milao aur Time ke hisab se set karo (Latest First)
    const combined = [...securityAlerts, ...studyDiary].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setLogs(combined);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear all history?")) {
      localStorage.removeItem("study_diary");
      localStorage.removeItem("study_guard_incidents");
      setLogs([]);
      toast.success("History cleared!");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AppHeader onMenuClick={() => setSidebarOpen(true)} title="Activity Log" />
      
      <main className="p-4 max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <Clock className="text-blue-600" /> Study History
            </h2>
            {logs.length > 0 && (
              <button onClick={clearHistory} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 size={20} />
              </button>
            )}
          </div>

          <div className="space-y-6">
            {logs.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-500 font-medium text-lg text-center">No parhai records found yet. 📚</p>
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="p-2 rounded-full bg-slate-100 group-hover:bg-white group-hover:shadow-md transition-all">
                      {log.icon}
                    </div>
                    {index !== logs.length - 1 && <div className="w-0.5 h-full bg-slate-100 my-1" />}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{log.category}</p>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-700 font-medium leading-relaxed">
                      {log.details || log.reason || "Bache ne kuch kiya par record nahi mila."}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(log.timestamp).toDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Incidents;
