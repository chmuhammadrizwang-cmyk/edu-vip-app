/**
 * PROJECT: STUDY GUARD (SUPREME EDITION)
 * DEVELOPER: RIZWAN ASHFAQ
 * FEATURE: ORIGINAL 500+ LINE LOGIC WITH VOICE FIX & HIGH-END UI
 */

import { logStudyActivity } from "@/Utils/activityLogger";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import BrandingFooter from "@/components/BrandingFooter";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import FocusOverlay from "@/components/FocusOverlay";
import PinDialog from "@/components/PinDialog";
import { useStudyMonitor } from "@/hooks/useStudyMonitor";
import { useStudyLock, isStudyActive } from "@/hooks/useStudyLock";
import { useFocusOverlay } from "@/hooks/useFocusOverlay";
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  Share2, 
  Shield, 
  Clock, 
  BookOpen, 
  BrainCircuit,
  Zap,
  Lock,
  MessageSquare
} from "lucide-react";

// Message Type Definition
type Msg = { 
  role: "user" | "assistant"; 
  content: string 
};

/**
 * API CONFIGURATION
 */
const GROQ_API_KEY = "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";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const Chat = () => {
  // --- UI & NAVIGATION STATES ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studyActive, setStudyActive] = useState(isStudyActive());
  const [timerDone, setTimerDone] = useState(false);
  const [remainingTime, setRemainingTime] = useState("");
  const { showOverlay: showFocusOverlay, triggerOverlay } = useFocusOverlay();
  
  // Custom Hook for Locking the Browser
  useStudyLock();

  // --- TIMER LOGIC (Original) ---
  const onTimerEnd = useCallback(() => {
    setStudyActive(false);
    setTimerDone(true);
    setRemainingTime("");
    toast.success("Congratulations! Your study session is complete. 🎉");
  }, []);

  /**
   * MONITORING SYSTEM
   * Detects if the student leaves the tab
   */
  useStudyMonitor(onTimerEnd, () => {
    triggerOverlay();
    logStudyActivity("Security", "User returned to the study zone. Focus Restored.");
  });

  /**
   * COUNTDOWN EFFECT
   * Updates every second to show time in HH:MM:SS
   */
  useEffect(() => {
    const tick = setInterval(() => {
      const endStr = localStorage.getItem("edu_study_session_end");
      
      if (!endStr) {
        if (studyActive) setStudyActive(false);
        setRemainingTime("");
        return;
      }

      const diff = Number(endStr) - Date.now();
      
      if (diff <= 0) {
        setRemainingTime("");
        clearInterval(tick);
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      const hours = h > 0 ? `${h}:` : "";
      const minutes = String(m).padStart(2, "0");
      const seconds = String(s).padStart(2, "0");
      
      setRemainingTime(`${hours}${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(tick);
  }, [studyActive]);

  /**
   * SECURITY: ANTI-EXIT SYSTEM (Original)
   * Prevents back-button navigation during active study sessions
   */
  useEffect(() => {
    if (!studyActive) return;

    const lockHistory = () => {
      window.history.pushState({ studyLock: true }, "", window.location.href);
      window.history.pushState({ studyLock: true }, "", window.location.href);
    };

    lockHistory();

    let backPressCount = 0;
    let backPressTimer: ReturnType<typeof setTimeout> | null = null;

    const handlePopState = (e: PopStateEvent) => {
      const endStr = localStorage.getItem("edu_study_session_end");
      
      if (endStr && Date.now() < Number(endStr)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        
        backPressCount++;
        toast.warning(`Warning: Back button is locked! (${backPressCount}/3)`);

        if (backPressCount >= 3) {
          logStudyActivity("Security", "Forced exit attempt detected. System Lockdown.");
          
          const incidents = JSON.parse(localStorage.getItem("study_guard_incidents") || "[]");
          incidents.push({ 
            type: "critical_exit_attempt", 
            timestamp: new Date().toISOString(), 
            reason: "multiple_back_press" 
          });
          
          localStorage.setItem("study_guard_incidents", JSON.stringify(incidents));
          window.location.replace("about:blank");
          return;
        }

        if (backPressTimer) clearTimeout(backPressTimer);
        backPressTimer = setTimeout(() => { backPressCount = 0; }, 2500);

        lockHistory();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (backPressTimer) clearTimeout(backPressTimer);
    };
  }, [studyActive]);

  // --- CHAT & VOICE STATES ---
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showPin, setShowPin] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const userName = localStorage.getItem("study_guard_name") || "Student";

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * ELITE VOICE OUTPUT (FIXED)
   * This ensures the full answer is spoken clearly.
   */
  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    
    // Cleaning text for phonetic clarity
    const cleanText = text
      .replace(/[#*`_~\[\]()]/g, "")
      .replace(/\n/g, " ")
      .trim();
    
    // Short delay to allow the browser's speech queue to clear
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      
      // Selection of a premium voice if available
      const eliteVoice = voices.find(v => 
        v.name.includes("Google UK English Female") || 
        v.name.includes("Microsoft Libut") ||
        v.lang.includes("en-US")
      ) || voices[0];

      if (eliteVoice) utterance.voice = eliteVoice;
      utterance.rate = 0.98; // Natural pace
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    }, 150);
  }, []);

  /**
   * CORE AI LOGIC
   */
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    logStudyActivity("Question", input.trim()); 
    
    const userMsg: Msg = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { 
              role: "system", 
              content: "You are an Elite Study Guardian. Answer educational questions professionally. Keep it concise." 
            },
            ...updatedMessages
          ],
        }),
      });

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }]);
      
      // AUTO-SPEAK TRIGGER
      speakText(aiResponse);

    } catch (error) {
      toast.error("Network error. AI Guardian is offline.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRec) return toast.error("Browser not supported.");

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRec();
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => setInput(event.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleShare = async () => {
    const data = {
      title: "Study Guard",
      text: "Elite focus tool by Rizwan Ashfaq.",
      url: "https://edu-vip-app.lovable.app",
    };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(`${data.text} ${data.url}`);
        toast.success("Link copied!");
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="h-screen flex flex-col bg-[#050209] text-white selection:bg-purple-500/40 relative overflow-hidden">
      {/* Visual Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(120,50,255,0.15),transparent_50%)] pointer-events-none" />
      
      <FocusOverlay show={showFocusOverlay} />
      <PinDialog open={showPin} onSuccess={() => { setStudyActive(false); setShowPin(false); }} onCancel={() => setShowPin(false)} />
      
      <AppHeader onMenuClick={() => setSidebarOpen(true)} title="STUDY GUARD SUPREME" />
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-8 container max-w-4xl mx-auto z-10 no-scrollbar">
        
        {/* Session Info & Timer */}
        {studyActive && remainingTime && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-[2px] rounded-[2rem] bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 shadow-2xl">
            <div className="bg-[#0c051a] backdrop-blur-3xl rounded-[1.9rem] p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-2xl">
                  <Clock className="h-6 w-6 text-purple-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300/60 leading-none">Focus Active</h4>
                  <p className="text-3xl font-black font-mono tracking-tighter text-white">{remainingTime}</p>
                </div>
              </div>
              <Shield className="h-8 w-8 text-white/5" />
            </div>
          </motion.div>
        )}

        {/* Welcome Screen (Supreme Interface) */}
        {messages.length === 0 && !timerDone && (
          <div className="flex flex-col items-center justify-center min-h-[55vh] text-center space-y-8">
            <motion.div animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }} transition={{ repeat: Infinity, duration: 6 }} className="relative">
              <div className="absolute inset-0 bg-purple-600 blur-[80px] opacity-40 rounded-full" />
              <div className="relative w-48 h-48 rounded-[3rem] bg-gradient-to-br from-[#1a0b3a] to-[#050209] border border-white/10 flex items-center justify-center shadow-2xl">
                {/* Elite Image: High-Level AI Logo */}
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/6166/6166943.png" 
                  alt="Elite AI" 
                  className="w-32 h-32 object-contain drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]"
                />
              </div>
            </motion.div>

            <div className="space-y-4">
              <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-b from-white via-purple-100 to-purple-400 bg-clip-text text-transparent">
                HELLO, {userName}
              </h1>
              <p className="text-gray-400 text-lg font-medium max-w-sm mx-auto leading-relaxed">
                I am your Supreme Study Guardian. Ask me anything from your syllabus.
              </p>
            </div>

            <div className="flex gap-4">
              <button onClick={handleShare} className="flex items-center gap-3 px-8 py-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-sm">
                <Share2 className="h-5 w-5 text-purple-400" /> SHARE
              </button>
              <button onClick={() => setShowPin(true)} className="flex items-center gap-3 px-8 py-4 rounded-3xl bg-purple-600 shadow-xl shadow-purple-500/20 hover:scale-105 transition-all font-bold text-sm text-white">
                <Lock className="h-5 w-5" /> UNLOCK
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Chat Thread */}
        <div className="space-y-8 pb-32">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`group relative p-6 rounded-[2.5rem] max-w-[85%] shadow-2xl backdrop-blur-2xl border ${
                  msg.role === "user" 
                    ? "bg-gradient-to-br from-purple-600 to-blue-700 text-white border-white/20 rounded-br-none" 
                    : "bg-white/5 border-white/10 text-gray-100 rounded-bl-none"
                }`}>
                  <ReactMarkdown className="prose prose-invert prose-sm leading-relaxed">{msg.content}</ReactMarkdown>
                  {msg.role === "assistant" && (
                    <button onClick={() => speakText(msg.content)} className="mt-4 p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                      <Volume2 className="h-4 w-4 text-purple-400" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <div className="flex justify-start">
              <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem] flex gap-3 animate-pulse">
                <Zap className="h-5 w-5 text-yellow-500 animate-bounce" />
                <span className="text-sm font-bold text-gray-500">Processing...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-1" />
        </div>
      </main>

      {/* Floating Input Controller */}
      <footer className="fixed bottom-0 left-0 w-full p-6 z-30">
        <div className="max-w-4xl mx-auto flex items-center gap-3 p-2 rounded-[3rem] bg-[#0c051a]/80 backdrop-blur-3xl border border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.4)]">
          <button onClick={toggleVoiceInput} className={`p-5 rounded-full transition-all ${isListening ? "bg-red-500 animate-pulse text-white shadow-lg shadow-red-500/50" : "bg-white/5 text-gray-500 hover:text-white"}`}>
            {isListening ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
          </button>
          
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === "Enter" && sendMessage()} 
            placeholder="Search your syllabus..." 
            className="flex-1 bg-transparent border-none outline-none text-white px-4 placeholder:text-gray-600 font-black text-xl tracking-tight" 
          />
          
          <button onClick={sendMessage} disabled={!input.trim() || isLoading} className="p-5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full shadow-xl shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-20">
            <Send className="h-7 w-7" />
          </button>
        </div>
        <BrandingFooter />
      </footer>
    </div>
  );
};

export default Chat;
        
