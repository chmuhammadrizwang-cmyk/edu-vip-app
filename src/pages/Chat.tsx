/**
 * PROJECT: STUDY GUARD (ELITE VERSION 5.0)
 * FIXES: MOBILE VIEW, VOICE STABILITY, & SECURITY REINFORCEMENT
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { 
  Send, Mic, MicOff, Volume2, Share2, Shield, 
  Clock, BrainCircuit, Activity 
} from "lucide-react";

// Project Component Imports (Assuming these exist in your project)
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import FocusOverlay from "@/components/FocusOverlay";
import PinDialog from "@/components/PinDialog";
import BrandingFooter from "@/components/BrandingFooter";
import { useStudyMonitor } from "@/hooks/useStudyMonitor";
import { useStudyLock, isStudyActive } from "@/hooks/useStudyLock";
import { useFocusOverlay } from "@/hooks/useFocusOverlay";

const GROQ_API_KEY = "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";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const Chat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studyActive, setStudyActive] = useState(isStudyActive());
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [remainingTime, setRemainingTime] = useState("");
  const [showPin, setShowPin] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  useStudyLock();
  const { showOverlay, triggerOverlay } = useFocusOverlay();

  // --- TIMER ENGINE ---
  useEffect(() => {
    const tick = setInterval(() => {
      const endStr = localStorage.getItem("edu_study_session_end");
      if (!endStr) { setRemainingTime(""); return; }
      
      const diff = Number(endStr) - Date.now();
      if (diff <= 0) {
        setStudyActive(false);
        setRemainingTime("");
        localStorage.removeItem("edu_study_session_end");
        return;
      }
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemainingTime(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // --- IMPROVED VOICE CLEANER ---
  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const clean = text.replace(/[#*`_~\[\]()]/g, "").substring(0, 500);
    const ut = new SpeechSynthesisUtterance(clean);
    ut.rate = 1.0;
    window.speechSynthesis.speak(ut);
  };

  // --- CORE AI UPLINK ---
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = { role: "user", content: input.trim() };
    setMessages(p => [...p, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: "You are the Study Guard AI. Concise and educational." }, ...messages, userMsg],
        })
      });
      const data = await res.json();
      const aiContent = data.choices[0].message.content;
      setMessages(p => [...p, { role: "assistant", content: aiContent }]);
      speakText(aiContent);
    } catch (e) { toast.error("Guardian Offline."); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-white overflow-hidden">
      <FocusOverlay show={showOverlay} />
      <PinDialog open={showPin} onSuccess={() => setStudyActive(false)} onCancel={() => setShowPin(false)} />
      <AppHeader onMenuClick={() => setSidebarOpen(true)} title="Elite Study Guard" />
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar">
        <div className="max-w-3xl mx-auto">
          {studyActive && remainingTime && (
            <div className="mb-8 p-6 rounded-3xl bg-white dark:bg-slate-800 border border-purple-500/20 shadow-xl text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-1">Active Focus Session</div>
              <div className="text-4xl font-black font-mono text-slate-800 dark:text-white">{remainingTime}</div>
            </div>
          )}

          <div className="space-y-6 pb-32">
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-2xl max-w-[85%] text-sm shadow-sm ${m.role === 'user' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </motion.div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      </main>

      <footer className="p-4 bg-transparent backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] p-2 shadow-2xl">
          <button onClick={() => setIsListening(!isListening)} className={`p-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'text-slate-400'}`}><Mic className="w-5 h-5" /></button>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Ask your Guardian..." className="flex-1 bg-transparent border-none outline-none px-3 text-sm" />
          <button onClick={sendMessage} className="p-3 bg-purple-600 text-white rounded-full"><Send className="w-5 h-5" /></button>
        </div>
        <BrandingFooter />
      </footer>
    </div>
  );
};

export default Chat;
  
