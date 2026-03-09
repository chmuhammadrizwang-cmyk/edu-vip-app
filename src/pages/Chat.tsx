/**
 * PROJECT: STUDY GUARD SUPREME (ELITE VERSION)
 * DEVELOPER: MUHAMMAD RIZWAN ASHFAQ
 * UPDATES: VOICE LOOP FIXED | ELITE VOICE SYNCED | BACK-BUTTON SECURED
 */

import { logStudyActivity } from "@/Utils/activityLogger";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

// UI Components
import BrandingFooter from "@/components/BrandingFooter";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import FocusOverlay from "@/components/FocusOverlay";
import PinDialog from "@/components/PinDialog";

// Hooks
import { useStudyMonitor } from "@/hooks/useStudyMonitor";
import { useStudyLock, isStudyActive } from "@/hooks/useStudyLock";
import { useFocusOverlay } from "@/hooks/useFocusOverlay";

import { 
  Send, Mic, MicOff, Volume2, Share2, Shield, 
  Clock, BrainCircuit, Activity 
} from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const GROQ_API_KEY = "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";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const Chat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studyActive, setStudyActive] = useState(isStudyActive());
  const [timerDone, setTimerDone] = useState(false);
  const [remainingTime, setRemainingTime] = useState("");
  const { showOverlay: showFocusOverlay, triggerOverlay } = useFocusOverlay();
  
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showPin, setShowPin] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const userName = localStorage.getItem("study_guard_name") || "Student";

  useStudyLock();

  // --- BUG FIX 3: BACK-BUTTON SECURITY ---
  useEffect(() => {
    if (!studyActive) return;
    
    const lockHistory = () => {
      window.history.pushState({ studyLock: true }, "", window.location.href);
    };

    lockHistory();

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      toast.warning("Study Mode: Navigation Locked!");
      lockHistory(); // Re-lock immediately
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [studyActive]);

  // --- TIMER LOGIC ---
  const onTimerEnd = useCallback(() => {
    setStudyActive(false);
    setTimerDone(true);
    localStorage.removeItem("edu_study_session_end");
    toast.success("Focus Session Complete!");
  }, []);

  useStudyMonitor(onTimerEnd, () => {
    triggerOverlay();
    logStudyActivity("Security", "Violation Detected.");
  });

  useEffect(() => {
    const tick = setInterval(() => {
      const endStr = localStorage.getItem("edu_study_session_end");
      if (!endStr) { setRemainingTime(""); return; }
      const diff = Number(endStr) - Date.now();
      if (diff <= 0) { onTimerEnd(); clearInterval(tick); return; }
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemainingTime(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(tick);
  }, [onTimerEnd]);

  // --- BUG FIX 2: ELITE VOICE SYNC ---
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[#*`_~\[\]()]/g, "").substring(0, 500);
    const ut = new SpeechSynthesisUtterance(clean);
    
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      ut.voice = voices.find(v => v.name.includes("Google UK") || v.name.includes("US English")) || voices[0];
      window.speechSynthesis.speak(ut);
    };

    if (window.speechSynthesis.getVoices().length !== 0) {
      setVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }
  };

  // --- AI LOGIC ---
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: "You are the Study Guardian AI." }, ...messages, userMsg],
        }),
      });
      const data = await res.json();
      const aiMsg = data.choices[0].message.content;
      setMessages(prev => [...prev, { role: "assistant", content: aiMsg }]);
      speakText(aiMsg);
    } catch (e) { toast.error("Connection Error."); }
    finally { setIsLoading(false); }
  };

  // --- BUG FIX 1: VOICE LOOP TERMINATION ---
  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return toast.error("Not supported.");
    
    if (isListening) {
      setIsListening(false);
      return;
    }

    const rec = new SR();
    rec.onresult = (e: any) => setInput(e.results[0][0].transcript);
    rec.onend = () => setIsListening(false); // FIXED: No infinite loop
    rec.start();
    setIsListening(true);
  };

  return (
    <div className="flex h-screen bg-[#0b041a] text-white overflow-hidden relative">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <FocusOverlay show={showFocusOverlay} />
        <PinDialog open={showPin} onSuccess={() => {setShowPin(false); setStudyActive(false);}} onCancel={() => setShowPin(false)} />
        <AppHeader onMenuClick={() => setSidebarOpen(true)} title="Study Guard Elite" />

        <main className="flex-1 overflow-y-auto px-4 py-8 no-scrollbar">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 && !timerDone && (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-40 h-40 rounded-full bg-[#1a0b2e] border border-purple-500/30 flex items-center justify-center shadow-2xl">
                  <img src="https://cdn-icons-png.flaticon.com/512/2103/2103633.png" className="w-24 h-24" alt="Brain Logo" />
                </div>
                <h1 className="text-4xl font-black mt-8 text-purple-400">Hello, {userName}</h1>
              </div>
            )}

            {studyActive && remainingTime && (
              <div className="mb-8 p-6 glass rounded-3xl border border-purple-500/20 text-center">
                <div className="text-5xl font-black font-mono">{remainingTime}</div>
              </div>
            )}

            <div className="space-y-6 pb-32">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-5 rounded-2xl max-w-[85%] ${m.role === 'user' ? 'bg-purple-600' : 'bg-white/5 border border-white/10'}`}>
                    <ReactMarkdown className="prose prose-invert prose-sm">{m.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>
        </main>

        <footer className="p-6">
          <div className="max-w-4xl mx-auto flex items-center bg-white/5 border border-white/10 p-2 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
            <button onClick={toggleVoice} className={`p-4 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-purple-600'}`}>
              {isListening ? <MicOff /> : <Mic />}
            </button>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Ask your Guardian..." className="flex-1 bg-transparent border-none outline-none px-4 text-sm" />
            <button onClick={sendMessage} className="p-4 bg-blue-600 rounded-full">{isLoading ? <Activity className="animate-spin" /> : <Send />}</button>
          </div>
          <BrandingFooter />
        </footer>
      </div>
    </div>
  );
};

export default Chat;
    
