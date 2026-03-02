import React, { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { Clock, ShieldAlert, BookOpen, Video, Trash2, Trophy, Lock, Eye } from "lucide-react";
import { toast } from "sonner";

const Incidents = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [showSecurityPrompt, setShowSecurityPrompt] = useState(false);
  const [inputCode, setInputCode] = useState("");

  // --- FIX 1: Parental PIN Logic (Sync with your ParentalSecurity page) ---
  const getSystemParentalCode = () => {
    // Ye har us key ko check karega jo aapki app use kar rahi hai
    const savedPin = localStorage.getItem("study_guard_pin") || 
                     localStorage.getItem("parental_code") || 
                     localStorage.getItem("parentalCode") || 
                     localStorage.getItem("user_pin");
    return savedPin; 
  };

  const loadLogs = () => {
    const security = JSON.parse(localStorage.getItem("study_guard_incidents") || "[]");
    const diary = JSON.parse(localStorage.getItem("study_diary") || "[]");
    const allLogs = [...security, ...diary];

    const uniqueLogs = allLogs.filter((log, index, self) =>
      index === self.findIndex((t) => (
        t.content === log.content && t.time === log.time
      ))
    );

    const sorted = uniqueLogs.sort((a, b) => 
      new Date(b.timestamp || b.id).getTime() - new Date(a.timestamp || a.id).getTime()
    );
    
    setLogs(sorted);
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  const confirmDelete = () => {
    const activeCode = getSystemParentalCode();
    
    if (!activeCode) {
      toast.error("Settings mein ja kar Parental PIN set karein!");
      return;
    }

    // .trim() lagaya taake mobile keyboard space ka masla na ho
    if (inputCode.trim() === activeCode.trim()) {
      // 1. Logs Delete
      localStorage.removeItem("study_guard_incidents");
      localStorage.removeItem("study_diary");
      localStorage.removeItem("study_logged"); 
      
      // 2. --- 🚨 SESSION KILL SWITCH ---
      // Ye do lines monitoring ko pakka band kar dengi PIN dene ke baad
      localStorage.removeItem("edu_study_duration");
      localStorage.removeItem("last_logged_target");
      localStorage.removeItem("edu_study_time");

      setLogs([]);
      setShowSecurityPrompt(false);
      setInputCode("");
      toast.success("Session Terminated & History Cleared");
    } else {
      toast.error("Ghalt Code! Please use your real Parental PIN.");
      setInputCode("");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-gray-300">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AppHeader onMenuClick={() => setSidebarOpen(true)} title="Elite Activity Monitor" />
      
      <main className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="bg-[#0f0f0f] rounded-[45px] p-8 border border-[#1a1a1a] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 bg-amber-500/5 blur-3xl rounded-full"></div>
          
          <div className="flex justify-between items-center mb-10 relative z-10">
            <div>
              <p className="text-[10px] font-black text-amber-500 tracking-[0.3em] uppercase mb-1">Elite Security Active</p>
              <h2 className="text-3xl font-black bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-600 bg-clip-text text-transparent flex items-center gap-3">
                <Trophy className="text-amber-500 w-8 h-8" /> Study Intel
              </h2>
            </div>
            <button onClick={() => setShowSecurityPrompt(true)} className="p-4 bg-black rounded-2xl border border-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg">
              <Trash2 size={22} />
            </button>
          </div>

          {showSecurityPrompt && (
            <div className="mb-8 p-6 bg-black border-2 border-amber-500/50 rounded-[30px] animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-3 mb-4 text-amber-500">
                <Lock size={20} />
                <p className="font-bold text-sm">Enter Parental PIN to Delete</p>
              </div>
              <input 
                type="password" 
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="****"
                className="w-full bg-[#111] border border-[#222] p-4 rounded-2xl text-center text-2xl tracking-[1em] text-amber-500 focus:outline-none focus:border-amber-500"
              />
              <div className="flex gap-3 mt-4">
                <button onClick={confirmDelete} className="flex-1 bg-amber-500 text-black font-black py-3 rounded-xl hover:bg-amber-400 transition-all">UNLOCK & DELETE</button>
                <button onClick={() => {setShowSecurityPrompt(false); setInputCode("");}} className="flex-1 bg-gray-900 text-white font-bold py-3 rounded-xl">CANCEL</button>
              </div>
            </div>
          )}

          <div className="space-y-5 relative z-10">
            {logs.length === 0 ? (
              <div className="text-center py-24 bg-black/50 rounded-[35px] border border-[#1a1a1a] text-gray-600">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-bold tracking-tight">System is watching... No activity yet.</p>
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="group bg-gradient-to-br from-[#111] to-black p-6 rounded-[30px] border border-[#1a1a1a] flex gap-5 hover:border-amber-500/40 transition-all duration-500">
                  <div className="flex-shrink-0 p-4 rounded-2xl bg-[#0a0a0a] text-amber-500 border border-amber-900/20 shadow-inner group-hover:scale-110 transition-transform">
                    {log.type === 'VIDEO' ? <Video size={24}/> : log.type === 'STUDY' ? <BookOpen size={24}/> : <ShieldAlert size={24}/>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-amber-500/80 tracking-widest uppercase bg-amber-500/5 px-3 py-1 rounded-full border border-amber-500/10">
                        {log.type || 'SECURITY'}
                      </span>
                      <span className="text-[10px] font-bold text-gray-600 bg-black px-2 py-1 rounded-md">
                        {log.time}
                      </span>
                    </div>
                    <p className="text-gray-100 font-bold text-[15px] leading-snug">
                      {log.content}
                    </p>
                    <p className="text-[10px] text-gray-700 mt-3 font-medium italic border-t border-[#1a1a1a] pt-2">
                      {log.date}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <footer className="mt-16 mb-10 text-center">
          <div className="inline-block relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative px-12 py-6 bg-black rounded-full border border-amber-900/30 shadow-2xl">
              <p className="text-[9px] font-black text-amber-600 tracking-[0.4em] uppercase mb-1">Architect</p>
              <p className="text-2xl font-black bg-gradient-to-r from-amber-500 via-yellow-100 to-amber-600 bg-clip-text text-transparent tracking-tighter">
                Rizwan Ashfaq Web Developer
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Incidents;
