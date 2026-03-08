/**
 * PROJECT: STUDY GUARD (SUPREME EDITION)
 * DEVELOPER: RIZWAN ASHFAQ
 * UI/UX: ULTRA-MODERN GLOW & ANIMATED GRADIENTS
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
  BrainCircuit,
  Sparkles,
  Zap
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
  const recognitionRef = useRef<any>(null);
  const userName = localStorage.getItem("study_guard_name") || "Student";

  useStudyLock();

  // --- VOICE ENGINE (FIXED) ---
  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Stop any current speech
    window.speechSynthesis.cancel();

    // Clean text for natural speech
    const cleanText = text.replace(/[#*`_~]/g, "").replace(/\n/g, " ").trim();
    
    // Create utterance with a slight delay to ensure browser readiness
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      
      // Try to find a high-quality natural voice
      const preferredVoice = voices.find(v => 
        v.name.includes("Google UK English Female") || 
        v.name.includes("Microsoft Libut") ||
        v.lang === "en-US"
      );

      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 0.95; // Slightly slower for clarity
      utterance.pitch = 1.0;
      
      window.speechSynthesis.speak(utterance);
    }, 100);
  }, []);

  // Timer & Security Logic
  const onTimerEnd = useCallback(() => {
    setStudyActive(false);
    setTimerDone(true);
    toast.success("Focus Session Complete! 🏆");
  }, []);

  useStudyMonitor(onTimerEnd, () => triggerOverlay());

  useEffect(() => {
    const tick = setInterval(() => {
      const endStr = localStorage.getItem("edu_study_session_end");
      if (!endStr) return;
      const diff = Number(endStr) - Date.now();
      if (diff <= 0) { setRemainingTime(""); return; }
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemainingTime(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // --- CORE CHAT LOGIC ---
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: "You are an Elite Study Guardian. Answer shortly." }, ...messages, userMsg],
        }),
      });
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      setMessages(prev => [...prev, { role: "assistant", content: aiResponse }]);
      
      // AUTO SPEAK THE FULL RESPONSE
      speakText(aiResponse);
    } catch (err) {
      toast.error("Network Error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#05010a] text-white selection:bg-purple-500/30 overflow-hidden relative">
      {/* Animated Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />

      <FocusOverlay show={showFocusOverlay} />
      <PinDialog open={showPin} onSuccess={() => setStudyActive(false)} onCancel={() => setShowPin(false)} />
      
      <AppHeader onMenuClick={() => setSidebarOpen(true)} title="STUDY GUARD SUPREME" />
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-8 max-w-4xl mx-auto w-full z-10 no-scrollbar">
        
        {/* Elite Welcome UI */}
        {messages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="relative mb-10">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 blur-3xl opacity-30 animate-pulse" />
              {/* Premium Brain Tree Image Placeholder - Replace with your actual image URL if needed */}
              <div className="relative w-40 h-40 rounded-full border-4 border-white/10 p-2 bg-black/40 backdrop-blur-3xl shadow-[0_0_50px_rgba(168,85,247,0.4)] overflow-hidden">
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/6166/6166943.png" 
                  alt="AI Guardian" 
                  className="w-full h-full object-contain filter drop-shadow-2xl"
                />
              </div>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute -top-2 -right-2 text-yellow-400">
                <Sparkles />
              </motion.div>
            </div>
            
            <h2 className="text-4xl font-black mb-2 bg-gradient-to-r from-white via-purple-200 to-gray-500 bg-clip-text text-transparent tracking-tighter">
              HELLO, {userName.toUpperCase()}
            </h2>
            <p className="text-gray-400 font-medium tracking-wide">I am your Elite Study Guardian. Ready to learn?</p>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowPin(true)} className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-bold">
                <Shield className="w-4 h-4 text-purple-400" /> LOCK SESSION
              </button>
              {remainingTime && (
                <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono font-bold">
                  <Clock className="w-4 h-4" /> {remainingTime}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Message Thread */}
        <div className="space-y-6 pb-32">
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-5 rounded-[2rem] max-w-[88%] shadow-2xl backdrop-blur-2xl border ${
                msg.role === 'user' 
                ? 'bg-gradient-to-br from-purple-600 to-blue-700 text-white border-white/20 rounded-br-none' 
                : 'bg-white/5 border-white/10 text-gray-100 rounded-bl-none'
              }`}>
                <ReactMarkdown className="prose prose-invert text-sm sm:text-base leading-relaxed">{msg.content}</ReactMarkdown>
                {msg.role === "assistant" && (
                  <button onClick={() => speakText(msg.content)} className="mt-3 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all">
                    <Volume2 className="w-4 h-4 text-purple-400" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-2 p-5 bg-white/5 rounded-3xl w-24 border border-white/5 animate-pulse">
              <Zap className="w-5 h-5 text-yellow-500 animate-bounce" />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Supreme Input Section */}
      <footer className="fixed bottom-0 left-0 w-full p-6 z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-3 bg-black/60 backdrop-blur-3xl border border-white/10 p-2 rounded-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => {
              const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
              const rec = new SpeechRec();
              rec.onstart = () => setIsListening(true);
              rec.onresult = (e: any) => setInput(e.results[0][0].transcript);
              rec.onend = () => setIsListening(false);
              rec.start();
            }}
            className={`p-5 rounded-full transition-all ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-white/5 text-gray-400 hover:text-white"}`}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === "Enter" && sendMessage()} 
            placeholder="Ask your Guardian..." 
            className="flex-1 bg-transparent outline-none text-white px-4 placeholder:text-gray-600 font-bold text-lg" 
          />
          
          <button 
            onClick={sendMessage} 
            disabled={!input.trim() || isLoading} 
            className="p-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-20"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
        <BrandingFooter />
      </footer>
    </div>
  );
};

export default Chat;
    
