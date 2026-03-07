/**
 * PROJECT: STUDY GUARD (ULTRA-ELITE PRO)
 * VERSION: 3.0.1
 * DEVELOPER: RIZWAN ASHFAQ
 * * DESCRIPTION:
 * This is the core chat engine for Study Guard AI. It features:
 * 1. Groq Cloud Llama-3 Integration
 * 2. Automatic AI Voice Synthesis (Text-to-Speech)
 * 3. Anti-Cheat & Focus Monitoring System
 * 4. Advanced Session Timer & Incident Logger
 * 5. Full Parental Control Lock System
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

// Core UI Components
import BrandingFooter from "@/components/BrandingFooter";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import FocusOverlay from "@/components/FocusOverlay";
import PinDialog from "@/components/PinDialog";

// Custom Hooks for Security & Activity
import { logStudyActivity } from "@/Utils/activityLogger";
import { useStudyMonitor } from "@/hooks/useStudyMonitor";
import { useStudyLock, isStudyActive } from "@/hooks/useStudyLock";
import { useFocusOverlay } from "@/hooks/useFocusOverlay";

// Icons for Visual Feedback
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
  Lock,
  MessageSquare,
  AlertTriangle
} from "lucide-react";

// Types Definition
type MessageRole = "user" | "assistant";
interface Message {
  role: MessageRole;
  content: string;
}

// Global Constants
const GROQ_API_KEY = "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";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const Chat = () => {
  // -----------------------------------------------------------------
  // 1. STATE MANAGEMENT
  // -----------------------------------------------------------------
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [studyActive, setStudyActive] = useState<boolean>(isStudyActive());
  const [timerDone, setTimerDone] = useState<boolean>(false);
  const [remainingTime, setRemainingTime] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [showPin, setShowPin] = useState<boolean>(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const userName = localStorage.getItem("study_guard_name") || "Student";

  // -----------------------------------------------------------------
  // 2. SECURITY & MONITORING LOGIC
  // -----------------------------------------------------------------
  const { showOverlay: showFocusOverlay, triggerOverlay } = useFocusOverlay();
  useStudyLock();

  const handleSessionCompletion = useCallback(() => {
    console.log("Session Ended Successfully");
    setStudyActive(false);
    setTimerDone(true);
    setRemainingTime("");
    toast.success("Elite Focus Achieved! Session Complete.");
  }, []);

  useStudyMonitor(handleSessionCompletion, () => {
    triggerOverlay();
    logStudyActivity("Security", "Focus lost! User attempted to switch tabs.");
  });

  // Countdown Timer Processor
  useEffect(() => {
    const runTimer = () => {
      const endTimestamp = localStorage.getItem("edu_study_session_end");
      
      if (!endTimestamp) {
        if (studyActive) setStudyActive(false);
        return;
      }

      const timeLeft = Number(endTimestamp) - Date.now();
      
      if (timeLeft <= 0) {
        setRemainingTime("");
        setStudyActive(false);
        return;
      }

      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      const displayTime = `${hours > 0 ? hours + ':' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      setRemainingTime(displayTime);
    };

    const timerInterval = setInterval(runTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [studyActive]);

  // -----------------------------------------------------------------
  // 3. ANTI-EXIT SYSTEM (HISTORY LOCKING)
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!studyActive) return;

    const preventNavigation = () => {
      window.history.pushState({ lock: true }, "", window.location.href);
    };

    preventNavigation();
    let escapeAttempts = 0;

    const handlePopState = (event: PopStateEvent) => {
      const activeSession = localStorage.getItem("edu_study_session_end");
      
      if (activeSession && Date.now() < Number(activeSession)) {
        event.preventDefault();
        escapeAttempts++;
        
        toast.error(`Access Denied: Study Mode is Active (${escapeAttempts}/3)`);
        
        if (escapeAttempts >= 3) {
          logStudyActivity("Security", "Force exit detected. Auto-shutdown triggered.");
          window.location.replace("about:blank");
        }
        
        preventNavigation();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [studyActive]);

  // -----------------------------------------------------------------
  // 4. ELITE VOICE ENGINE (TTS)
  // -----------------------------------------------------------------
  const processTextForSpeech = (rawText: string): string => {
    return rawText
      .replace(/#{1,6}/g, "") // Headers
      .replace(/\*\*/g, "")   // Bold
      .replace(/\*/g, "")    // Italic
      .replace(/`{1,3}.*?`{1,3}/gs, "") // Code blocks
      .replace(/\[.*?\]\(.*?\)/g, "") // Links
      .trim();
  };

  const speakResponse = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      console.error("Speech Synthesis not supported in this browser.");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const cleanText = processTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Premium Voice Selection
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => 
      v.name.includes("Google UK English Female") || 
      v.name.includes("Natural")
    ) || voices[0];

    utterance.voice = premiumVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
  }, []);

  // Trigger auto-voice when AI message arrives
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        speakResponse(lastMessage.content);
      }
    }
  }, [isLoading, messages, speakResponse]);

  // -----------------------------------------------------------------
  // 5. AI COMMUNICATION (GROQ)
  // -----------------------------------------------------------------
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Log to activity for parents
    logStudyActivity("AI_Query", userMessage.content);

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
              content: "You are Study Guard AI. Only help with education. If asked about fun, say 'Stay focused on your studies!'" 
            },
            ...messages,
            userMessage,
          ],
          temperature: 0.5,
          max_tokens: 1024,
        }),
      });

      const result = await response.json();
      
      if (result.choices && result.choices[0]) {
        const aiResponse: Message = {
          role: "assistant",
          content: result.choices[0].message.content,
        };
        setMessages((prev) => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error("GROQ API Error:", error);
      toast.error("Network Error: AI Guardian is recharging.");
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------------------------------------------
  // 6. SPEECH-TO-TEXT (STT)
  // -----------------------------------------------------------------
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error("Your browser does not support Voice Recognition.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      toast.success("Voice Captured!");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // -----------------------------------------------------------------
  // 7. RENDER COMPONENT
  // -----------------------------------------------------------------
  return (
    <div className="h-screen flex flex-col bg-[#030305] text-white selection:bg-primary/40 font-inter overflow-hidden">
      {/* SECURITY OVERLAYS */}
      <FocusOverlay show={showFocusOverlay} />
      <PinDialog 
        open={showPin} 
        onSuccess={() => { setStudyActive(false); setShowPin(false); }} 
        onCancel={() => setShowPin(false)} 
      />
      
      {/* NAVIGATION */}
      <AppHeader onMenuClick={() => setSidebarOpen(true)} title="STUDY GUARD ELITE" />
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* CHAT INTERFACE */}
      <main className="flex-1 overflow-y-auto px-4 py-8 max-w-5xl mx-auto w-full space-y-8 no-scrollbar scroll-smooth">
        
        {/* TIMER COMPONENT */}
        {studyActive && remainingTime && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-1 rounded-2xl bg-gradient-to-r from-primary/50 to-purple-600/50"
          >
            <div className="bg-black/80 backdrop-blur-md p-4 rounded-2xl flex items-center justify-between border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Clock className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Current Focus Session</p>
                  <p className="text-2xl font-black font-mono text-white leading-none">{remainingTime}</p>
                </div>
              </div>
              <Shield className="w-6 h-6 text-primary/40" />
            </div>
          </motion.div>
        )}

        {/* WELCOME SCREEN */}
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="relative mb-8 group">
                <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full group-hover:bg-primary/50 transition-all duration-500" />
                <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-2xl rotate-3 hover:rotate-0 transition-transform">
                  <BrainCircuit className="w-14 h-14 text-white" />
                </div>
              </div>
              <h2 className="text-4xl font-black mb-4 tracking-tight">Focus Up, {userName}</h2>
              <p className="text-gray-400 max-w-md mx-auto text-lg leading-relaxed">
                Your AI Study Guardian is active. Ask anything from your syllabus to get started.
              </p>
              
              <div className="mt-10 flex gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs text-gray-400">
                  <Lock className="w-3 h-3" /> Secure Session
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs text-gray-400">
                  <Sparkles className="w-3 h-3 text-yellow-500" /> AI Powered
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MESSAGES THREAD */}
        <div className="space-y-8 pb-32">
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: msg.role === "user" ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`group relative max-w-[85%] p-5 rounded-3xl shadow-2xl transition-all ${
                msg.role === "user" 
                  ? "bg-primary text-white rounded-br-none" 
                  : "bg-white/5 border border-white/10 backdrop-blur-xl rounded-bl-none hover:bg-white/10"
              }`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <ReactMarkdown className="prose prose-invert prose-sm leading-relaxed">
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  {msg.role === "assistant" && (
                    <button 
                      onClick={() => speakResponse(msg.content)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-xl transition-all"
                    >
                      <Volume2 className="w-4 h-4 text-primary" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* AI THINKING INDICATOR */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce delay-75" />
                <span className="w-2 h-2 bg-primary/30 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-10" />
        </div>
      </main>

      {/* INPUT SYSTEM */}
      <footer className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/90 to-transparent backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-2 flex items-center gap-2 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-2xl focus-within:border-primary/50 transition-all">
            <button 
              onClick={handleVoiceInput}
              className={`p-4 rounded-2xl transition-all ${
                isListening ? "bg-red-500 text-white animate-pulse" : "text-gray-500 hover:bg-white/5"
              }`}
            >
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your academic question..."
              className="flex-1 bg-transparent border-none outline-none text-white px-2 placeholder:text-gray-600 font-medium"
            />

            <button 
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="p-4 bg-primary text-white rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20 shadow-lg shadow-primary/20"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
          <BrandingFooter />
        </div>
      </footer>
    </div>
  );
};

export default Chat;
      
