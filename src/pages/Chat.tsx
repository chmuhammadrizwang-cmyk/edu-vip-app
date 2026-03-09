/**
 * PROJECT: STUDY GUARD (SUPREME DEVELOPER EDITION)
 * VERSION: 4.0.5 (ENTERPRISE)
 * ARCHITECT: RIZWAN ASHFAQ (SENIOR WEB DEVELOPER)
 * ---------------------------------------------------------
 * FEATURES: 
 * - Full Security Tab Monitoring
 * - Anti-Back Button Lockdown
 * - Phonetic Audio Cleaning (Fixed TTS)
 * - Activity Encryption & Storage
 * - High-End Cyber-Luxe UI
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

// UI Core Components
import BrandingFooter from "@/components/BrandingFooter";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import FocusOverlay from "@/components/FocusOverlay";
import PinDialog from "@/components/PinDialog";

// Logic & Security Infrastructure
import { logStudyActivity } from "@/Utils/activityLogger";
import { useStudyMonitor } from "@/hooks/useStudyMonitor";
import { useStudyLock, isStudyActive } from "@/hooks/useStudyLock";
import { useFocusOverlay } from "@/hooks/useFocusOverlay";

// Elite Icon Suite
import { 
  Send, Mic, MicOff, Volume2, Share2, Shield, 
  Clock, BrainCircuit, Sparkles, Lock, Terminal,
  Cpu, Zap, Fingerprint, Code2, Activity, Globe,
  ShieldAlert, Database, History, Settings
} from "lucide-react";

// Types Configuration
type Message = { role: "user" | "assistant"; content: string };

const GROQ_API_KEY = "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";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const Chat = () => {
  // ---------------------------------------------------------
  // 1. SYSTEM STATES & REF MANAGEMENT
  // ---------------------------------------------------------
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studyActive, setStudyActive] = useState(isStudyActive());
  const [remainingTime, setRemainingTime] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [apiStatus, setApiStatus] = useState<"online" | "busy" | "offline">("online");
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const userName = localStorage.getItem("study_guard_name") || "Student";

  // ---------------------------------------------------------
  // 2. SECURITY & MONITORING (FULL ORIGINAL LOGIC)
  // ---------------------------------------------------------
  const { showOverlay: showFocusOverlay, triggerOverlay } = useFocusOverlay();
  useStudyLock();

  const handleFocusViolation = useCallback(() => {
    triggerOverlay();
    logStudyActivity("Security", "Protocol Breach: Tab focus lost. Incident logged.");
    toast.error("SECURITY BREACH: System focus lost. Return immediately!", {
        style: { background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444' }
    });
  }, [triggerOverlay]);

  useStudyMonitor(() => {
    setStudyActive(false);
    setRemainingTime("");
    toast.success("MISSION COMPLETE: Study session finalized successfully.");
  }, handleFocusViolation);

  // High-Resolution Timer HUD
  useEffect(() => {
    const timerInterval = setInterval(() => {
      const sessionEnd = localStorage.getItem("edu_study_session_end");
      if (!sessionEnd) {
        if (studyActive) setStudyActive(false);
        return;
      }
      const diff = Number(sessionEnd) - Date.now();
      if (diff <= 0) {
        setRemainingTime("");
        clearInterval(timerInterval);
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemainingTime(`${hours > 0 ? hours + ':' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [studyActive]);

  // Anti-Back Button Security Grid
  useEffect(() => {
    if (!studyActive) return;

    const pushLock = () => {
      window.history.pushState({ lock: true }, "", window.location.href);
    };
    pushLock();

    let exitAttempts = 0;
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      exitAttempts++;
      toast.warning(`LOCKDOWN ACTIVE: Back-button disabled during session. (${exitAttempts}/3)`);
      
      if (exitAttempts >= 3) {
        logStudyActivity("Critical", "Forced System Exit triggered via Hardware Back.");
        window.location.replace("about:blank");
      }
      pushLock();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [studyActive]);

  // ---------------------------------------------------------
  // 3. ENHANCED VOICE ENGINE (NO CUTTING FIX)
  // ---------------------------------------------------------
  const executeCleanSpeech = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Kill existing speech
    window.speechSynthesis.cancel();
    
    // Clean text for natural phonetics
    const sanitizedText = text
      .replace(/[#*`_~\[\]()]/g, "")
      .replace(/\n/g, " ")
      .trim();
    
    // Buffer delay to ensure first word is clear
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(sanitizedText);
      const voices = window.speechSynthesis.getVoices();
      
      // Preference: Natural British/American Voice
      const eliteVoice = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US')) || voices[0];
      
      utterance.voice = eliteVoice;
      utterance.rate = 0.98;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    }, 350); 
  }, []);

  // ---------------------------------------------------------
  // 4. AI UPLINK CORE
  // ---------------------------------------------------------
  const initiateQuery = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setApiStatus("busy");
    
    logStudyActivity("Query", userMessage.content);

    try {
      const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are the Supreme Study Guardian. Provide elite, high-level academic intelligence. Be concise and professional." },
            ...messages,
            userMessage
          ],
          temperature: 0.5,
        }),
      });

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      setMessages(prev => [...prev, { role: "assistant", content: aiResponse }]);
      executeCleanSpeech(aiResponse);
      setApiStatus("online");
    } catch (error) {
      setApiStatus("offline");
      toast.error("COMMUNICATION ERROR: AI Uplink unstable.");
    } finally {
      setIsLoading(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleVoiceInput = () => {
    const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRec) return toast.error("Speech Recognition not supported.");

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRec();
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => setInput(e.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    
    recognitionRef.current = recognition;
    recognition.start();
  };

  // ---------------------------------------------------------
  // 5. MASTER UI RENDER
  // ---------------------------------------------------------
  return (
    <div className="h-screen flex flex-col bg-[#020205] text-[#e2e8f0] selection:bg-purple-500/40 relative overflow-hidden font-sans">
      
      {/* Cinematic Cyber Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-600 to-transparent shadow-[0_0_15px_rgba(168,85,247,1)]" />

      <FocusOverlay show={showFocusOverlay} />
      <PinDialog open={showPin} onSuccess={() => setStudyActive(false)} onCancel={() => setShowPin(false)} />
      
      <AppHeader onMenuClick={() => setSidebarOpen(true)} title="STUDY GUARD SUPREME" />
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* API STATUS HUD ELEMENT */}
      <div className="absolute top-16 right-6 z-50">
        <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border backdrop-blur-2xl transition-all duration-700 ${
          apiStatus === 'online' ? 'bg-green-500/10 border-green-500/20 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 
          apiStatus === 'busy' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 
          'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${apiStatus === 'online' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : apiStatus === 'busy' ? 'bg-yellow-500 animate-ping' : 'bg-red-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{apiStatus} Status</span>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-6 py-8 container max-w-5xl mx-auto z-10 no-scrollbar relative">
        
        {/* Dynamic Focus HUD */}
        {studyActive && remainingTime && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-12 p-[1px] rounded-[2.5rem] bg-gradient-to-r from-purple-900/40 via-purple-500/30 to-purple-900/40 shadow-2xl backdrop-blur-3xl">
            <div className="bg-[#0c0c1a] rounded-[2.4rem] p-6 flex items-center justify-between border border-white/5">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-purple-500/10 rounded-2xl relative">
                   <Cpu className="w-7 h-7 text-purple-400 animate-pulse" />
                   <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400/60 leading-none mb-2">Protocol: Focus_Active</h4>
                  <p className="text-4xl font-black font-mono tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{remainingTime}</p>
                </div>
              </div>
              <div className="hidden md:flex gap-4">
                 <div className="text-right border-r border-white/10 pr-4">
                   <span className="text-[9px] font-bold text-gray-500 uppercase">Latency</span>
                   <p className="text-xs font-bold text-green-400">12ms</p>
                 </div>
                 <div className="text-right">
                   <span className="text-[9px] font-bold text-gray-500 uppercase">Uplink</span>
                   <p className="text-xs font-bold text-blue-400">Secure</p>
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Hero Welcome Unit */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10">
            <motion.div whileHover={{ scale: 1.05 }} className="relative group">
              <div className="absolute inset-0 bg-purple-600 blur-[100px] opacity-10 group-hover:opacity-30 transition-all duration-1000" />
              <div className="relative w-48 h-48 bg-[#0a0a1a] border border-white/5 rounded-[3.5rem] flex items-center justify-center shadow-2xl transition-all group-hover:border-purple-500/30">
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" 
                  alt="Elite Intelligence" 
                  className="w-28 h-28 object-contain filter drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-purple-600 px-4 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow-lg border border-white/20">
                Developer Edition
              </div>
            </motion.div>

            <div className="space-y-4">
              <h1 className="text-6xl font-black tracking-tighter text-white uppercase leading-none">
                System Online, <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">{userName}</span>
              </h1>
              <p className="text-gray-500 text-xl font-medium max-w-lg mx-auto">
                Supreme Study Guardian synchronized. Hardware acceleration enabled.
              </p>
            </div>

            <div className="flex gap-4">
               <button onClick={() => setShowPin(true)} className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 hover:bg-white/10 transition-all font-black text-xs tracking-widest group">
                 <ShieldAlert className="w-5 h-5 text-purple-500 group-hover:rotate-12 transition-transform" /> UNLOCK TERMINAL
               </button>
               <button className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-700 shadow-2xl shadow-purple-500/20 hover:scale-105 transition-all font-black text-xs tracking-widest text-white">
                 <Database className="w-5 h-5 text-white/70" /> VIEW ANALYTICS
               </button>
            </div>
          </div>
        )}

        {/* Intelligence Message Grid */}
        <div className="space-y-12 pb-48">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`group relative p-8 rounded-[2.5rem] max-w-[88%] shadow-2xl border transition-all ${
                  msg.role === 'user' 
                  ? 'bg-gradient-to-br from-purple-900 to-[#1a1a3a] border-purple-500/30 text-white rounded-br-none' 
                  : 'bg-[#0a0a1a] border-white/5 text-gray-200 rounded-bl-none'
                }`}>
                  <div className="flex items-center gap-3 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                    {msg.role === 'user' ? <Fingerprint className="w-4 h-4 text-purple-500" /> : <Code2 className="w-4 h-4 text-blue-500" />}
                    {msg.role === 'user' ? 'Secure Identity' : 'Study Guardian Logic'}
                  </div>
                  <ReactMarkdown className="prose prose-invert prose-sm leading-relaxed font-semibold tracking-tight text-gray-100">
                    {msg.content}
                  </ReactMarkdown>
                  {msg.role === "assistant" && (
                    <div className="flex gap-2 mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => executeCleanSpeech(msg.content)} className="p-3 bg-white/5 rounded-2xl hover:bg-purple-500/20 transition-all">
                        <Volume2 className="h-4 w-4 text-purple-400" />
                      </button>
                      <button className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                        <History className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <div className="flex justify-start">
               <div className="p-8 bg-white/5 border border-white/5 rounded-[2rem] flex items-center gap-4 animate-pulse">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" />
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Processing Intelligence...</span>
               </div>
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>
      </main>

      {/* Floating Tactical Command Input */}
      <footer className="fixed bottom-0 left-0 w-full p-10 z-40 bg-gradient-to-t from-[#020205] via-[#020205]/95 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="group relative flex items-center gap-4 bg-[#0a0a1a]/80 border border-white/10 p-3 rounded-[3rem] shadow-2xl backdrop-blur-3xl focus-within:border-purple-500/50 transition-all">
            <button 
              onClick={handleVoiceInput}
              className={`p-6 rounded-full transition-all ${isListening ? "bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]" : "bg-white/5 text-gray-500 hover:text-white"}`}
            >
              {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </button>
            
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && initiateQuery()} 
              placeholder="Execute academic command..." 
              className="flex-1 bg-transparent border-none outline-none text-white px-2 placeholder:text-gray-700 font-black text-2xl tracking-tighter" 
            />
            
            <button 
              onClick={initiateQuery} 
              disabled={!input.trim() || isLoading} 
              className="p-6 bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-full hover:scale-110 active:scale-95 transition-all shadow-xl shadow-purple-500/30 disabled:opacity-5"
            >
              <Send className="w-7 h-7" />
            </button>
          </div>
          
          {/* Pro Developer Signature */}
          <div className="flex justify-center mt-8">
             <div className="px-8 py-3 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-2xl flex items-center gap-4 text-[11px] font-black tracking-[0.3em] text-gray-500">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                RIZWAN ASHFAQ <span className="text-purple-600">SENIOR WEB DEVELOPER</span>
                <Sparkles className="w-4 h-4 text-yellow-500" />
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Chat;
      
