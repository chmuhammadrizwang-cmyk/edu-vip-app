/**
 * PROJECT: STUDY GUARD (ELITE VERSION)
 * DEVELOPER: RIZWAN ASHFAQ
 * FEATURE: GROQ AI INTEGRATION WITH VOICE CLEANING & SECURITY
 */

import { logStudyActivity } from "@/Utils/activityLogger";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Added AnimatePresence for more lines
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
  BrainCircuit 
} from "lucide-react";

// Message Type Definition
type Msg = { 
  role: "user" | "assistant"; 
  content: string 
};

/**
 * API CONFIGURATION
 * Using Groq for high-speed Llama 3 inference
 */
const GROQ_API_KEY = "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";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const Chat = () => {
  // --- UI STATES ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studyActive, setStudyActive] = useState(isStudyActive());
  const [timerDone, setTimerDone] = useState(false);
  const [remainingTime, setRemainingTime] = useState("");
  const { showOverlay: showFocusOverlay, triggerOverlay } = useFocusOverlay();
  
  // Custom Hook for Locking the Browser
  useStudyLock();

  /**
   * TIMER LOGIC
   * Handles the countdown and session completion
   */
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
   * SECURITY: ANTI-EXIT SYSTEM
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

  // --- CHAT STATES ---
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
   * VOICE SYNTHESIS CLEANER
   * Cleans AI markdown so the voice sounds human and professional
   */
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/#{1,6}\s?/g, "") // Headers
      .replace(/\*{1,3}(.*?)\*{1,3}/g, "$1") // Bold/Italic
      .replace(/_{1,3}(.*?)_{1,3}/g, "$1") // Underline
      .replace(/`{1,3}[^`]*`{1,3}/g, "") // Code blocks
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // Links
      .replace(/^[-*+]\s/gm, "") // Lists
      .replace(/^\d+\.\s/gm, "") // Numbered lists
      .replace(/^>\s?/gm, "") // Quotes
      .replace(/---+/g, "") // Dividers
      .replace(/\n{2,}/g, ". ") // Paragraphs to periods
      .replace(/\n/g, " ") // Single newlines to spaces
      .trim();
  };

  /**
   * ELITE VOICE OUTPUT
   * Triggers the Web Speech API with professional voice settings
   */
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    speechSynthesis.cancel();
    const cleanText = cleanMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = speechSynthesis.getVoices();
    const eliteVoice = voices.find(v => 
      v.name.includes("Google UK English Female") || 
      v.name.includes("Google US English") ||
      v.name.includes("Microsoft Zira")
    ) || voices[0];

    if (eliteVoice) utterance.voice = eliteVoice;
    speechSynthesis.speak(utterance);
  };

  /**
   * SPEECH RECOGNITION (STT)
   * Converts student's voice to text input
   */
  const toggleVoiceInput = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRec) {
      toast.error("Your browser does not support Speech Recognition.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      toast.success("Voice captured successfully!");
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Voice recognition failed. Please try again.");
    };

    recognition.onend = () => setIsListening(true); // Small logic adjustment for better UX

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  /**
   * SHARING LOGIC
   * Simple share button for social growth
   */
  const handleShare = async () => {
    const data = {
      title: "Study Guard",
      text: "Transforming online education with focus tools by Rizwan Ashfaq.",
      url: "https://edu-vip-app.lovable.app",
    };

    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(`${data.text} ${data.url}`);
        toast.success("Project link copied!");
      }
    } catch (err) {
      console.error("Share failed", err);
    }
  };

  /**
   * PARENTAL CONTROL: SESSION OVERRIDE
   * Stops the timer only if the PIN is correct
   */
  const onPinSuccess = () => {
    setShowPin(false);
    localStorage.removeItem("edu_study_session_end");
    setStudyActive(false);
    logStudyActivity("Session", "Study session manually terminated by Parent.");
    toast.success("Session unlocked. Study time ended.");
  };

  /**
   * CORE AI LOGIC: SEND MESSAGE
   * Sends user query to Groq and handles the streaming response
   */
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Log the student's question for parent records
    logStudyActivity("Question", input.trim()); 
    
    const userMsg: Msg = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

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
              content: "You are an Elite Study Guardian. Answer ONLY educational questions for Class 1-12. If the user asks about entertainment, games, or social media, politely say 'I am programmed to help you focus on your bright future.' Keep answers concise and academic." 
            },
            ...updatedMessages
          ],
          stream: true,
          temperature: 0.7,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to Groq AI");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

          const dataStr = trimmedLine.replace("data: ", "");
          if (dataStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            
            if (delta) {
              assistantSoFar += delta;
              setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg?.role === "assistant") {
                  return prev.map((m, idx) => 
                    idx === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch (e) {
            console.error("Parsing error", e);
          }
        }
      }

      // Automatically speak the first 600 characters of the response
      if (assistantSoFar) {
        speakText(assistantSoFar.substring(0, 600));
      }

    } catch (error) {
      toast.error("Network error. AI Guardian is offline.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground font-sans">
      {/* Dynamic Overlays */}
      <FocusOverlay show={showFocusOverlay} />
      <PinDialog 
        open={showPin} 
        onSuccess={onPinSuccess} 
        onCancel={() => setShowPin(false)} 
      />
      
      {/* Navigation Components */}
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AppHeader onMenuClick={() => setSidebarOpen(true)} title="Study Guard AI" />

      {/* Main Chat Interface */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 container max-w-4xl mx-auto">
        
        {/* Session Timer Component */}
        {studyActive && remainingTime && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="glass rounded-3xl p-6 text-center shadow-2xl border border-white/10"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-accent animate-pulse" />
              <span className="text-sm text-muted-foreground font-bold tracking-widest uppercase">Focus Timer</span>
            </div>
            <p className="font-display text-4xl font-black text-gradient-gold glow-text-gold">
              {remainingTime}
            </p>
          </motion.div>
        )}

        {/* Reward Component */}
        {timerDone && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="glass rounded-3xl p-8 text-center glow-cyan border-2 border-accent/20"
          >
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="font-display text-2xl font-black text-gradient-gold">Session Accomplished!</h2>
            <p className="text-muted-foreground mt-2">You maintained elite focus levels today.</p>
          </motion.div>
        )}

        {/* Empty State / Welcome Screen */}
        {messages.length === 0 && !timerDone && (
          <div className="flex-1 flex items-center justify-center min-h-[50vh]">
            <div className="text-center max-w-sm">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-primary glow-primary flex items-center justify-center">
                <BrainCircuit className="h-12 w-12 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-black text-gradient-primary mb-3">
                Hello, {userName}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                I am your AI Study Guardian. Ask me anything about your syllabus.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <button 
                  onClick={handleShare} 
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-muted/40 border border-white/5 text-sm font-bold hover:bg-muted transition-all"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>
                {studyActive && (
                  <button 
                    onClick={() => setShowPin(true)} 
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold hover:bg-destructive/20 transition-all"
                  >
                    <Shield className="h-4 w-4" /> Unlock
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Message Rendering Engine */}
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[85%] rounded-3xl px-6 py-4 shadow-xl ${
                  msg.role === "user" 
                    ? "bg-gradient-primary text-primary-foreground rounded-tr-none" 
                    : "glass border border-white/10 rounded-tl-none"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="flex items-start gap-4">
                    <div className="prose prose-invert prose-sm max-w-none flex-1 leading-relaxed">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    <button 
                      onClick={() => speakText(msg.content)} 
                      className="mt-1 p-2 rounded-xl hover:bg-white/10 transition-all text-secondary"
                    >
                      <Volume2 className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-semibold">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking Indicator */}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl px-6 py-4">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={bottomRef} className="h-10" />
      </main>

      {/* Input Field Section */}
      <footer className="px-4 pb-6 pt-2 bg-gradient-to-t from-background to-transparent">
        <div className="max-w-4xl mx-auto flex gap-3 glass rounded-3xl p-3 border border-white/10 shadow-2xl">
          <button 
            onClick={toggleVoiceInput} 
            className={`p-4 rounded-2xl transition-all ${
              isListening 
                ? "bg-destructive text-destructive-foreground animate-pulse glow-pink" 
                : "hover:bg-muted/50 text-muted-foreground"
            }`}
          >
            {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>
          
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === "Enter" && sendMessage()} 
            placeholder="Ask your AI Study Guardian..." 
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none px-4 font-medium" 
          />
          
          <button 
            onClick={sendMessage} 
            disabled={isLoading || !input.trim()} 
            className="p-4 rounded-2xl bg-gradient-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-30 disabled:hover:scale-100"
          >
            <Send className="h-6 w-6" />
          </button>
        </div>
        <BrandingFooter />
      </footer>
    </div>
  );
};

export default Chat;
  
