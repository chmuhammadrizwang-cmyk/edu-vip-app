import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Send, Mic, MicOff, Share2, Sparkles, ChevronLeft, Clock, Play, Pause } from "lucide-react";

// Types
type Message = { role: "user" | "assistant"; content: string };

const GROQ_API_KEY = "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";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // --- TIMER FUNCTIONALITY ---
  const startTimer = (minutes: number) => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    setTimeLeft(minutes * 60);
    setIsTimerRunning(true);
  };

  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerInterval.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (timeLeft === 0 && isTimerRunning) toast.success("Study Session Finished!");
    }
    return () => { if (timerInterval.current) clearInterval(timerInterval.current); };
  }, [isTimerRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- VOICE ENGINE ---
  const speak = useCallback((text: string) => {
    if (!isAudioOn) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`_~]/g, ""));
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }, [isAudioOn]);

  // --- AI LOGIC (FIXED CONNECTION) ---
  const handleSend = async () => {
    const query = input.trim();
    if (!query || isLoading) return;

    const userMsg: Message = { role: "user", content: query };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: "You are Study Guard AI. Helpful and professional." }, ...messages, userMsg],
        })
      });

      if (!response.ok) throw new Error("API Connection Error");
      
      const data = await response.json();
      const aiContent = data.choices[0].message.content;
      
      setMessages(prev => [...prev, { role: "assistant", content: aiContent }]);
      speak(aiContent);
    } catch (error) {
      toast.error("System connection failed. Check Internet/API Key.");
      console.error(error);
    } finally {
      setIsLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0b041a] text-white overflow-hidden relative">
      
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-white/10 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <ChevronLeft className="w-5 h-5 text-purple-400" />
          <h1 className="text-xs font-bold uppercase tracking-widest text-purple-300">Study Guard Supreme</h1>
        </div>
        {isTimerRunning && (
          <div className="bg-purple-600/20 px-3 py-1 rounded-full border border-purple-500/50 flex items-center gap-2">
            <Clock className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] font-mono">{formatTime(timeLeft)}</span>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto px-5 py-6 no-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            
            {/* BRAIN LOGO (FIXED) */}
            <div className="w-40 h-40 mb-8 relative">
              <div className="absolute inset-0 bg-purple-600 blur-[60px] opacity-20" />
              <div className="relative w-full h-full rounded-full border-2 border-purple-500/30 p-4 bg-[#1a0b2e] flex items-center justify-center shadow-2xl">
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/2103/2103633.png" 
                  alt="Brain AI"
                  className="w-24 h-24 object-contain brightness-110"
                />
              </div>
            </div>

            <h2 className="text-4xl font-black mb-2">Hello, <span className="text-purple-400">Student</span></h2>
            <p className="text-gray-400 text-sm max-w-[250px] mx-auto mb-8">Ask me anything about your syllabus and set your study focus.</p>

            {/* QUICK ACTIONS & TIMER (FIXED) */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              <button onClick={() => startTimer(25)} className="bg-white/5 border border-white/10 py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-tighter hover:bg-purple-600 transition-all">
                <Play className="w-3 h-3" /> 25m Focus
              </button>
              <button onClick={() => setIsAudioOn(!isAudioOn)} className={`border py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-tighter transition-all ${isAudioOn ? 'bg-purple-600 border-purple-400' : 'bg-white/5 border-white/10'}`}>
                {isAudioOn ? 'Audio ON' : 'Audio OFF'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-32">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-2xl max-w-[85%] text-sm font-medium leading-relaxed shadow-lg ${
                  msg.role === 'user' ? 'bg-purple-600 border border-purple-400' : 'bg-white/5 border border-white/10 backdrop-blur-md'
                }`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {/* Input Section (Fixed Full Screen & Buttons) */}
      <footer className="p-6 bg-gradient-to-t from-[#0b041a] to-transparent">
        <div className="max-w-2xl mx-auto">
          <div className="relative flex items-center bg-white/5 border border-white/10 rounded-[2rem] p-1.5 backdrop-blur-2xl shadow-2xl">
            <button 
              onClick={() => setIsListening(!isListening)}
              className={`p-4 rounded-full transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-purple-600'}`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Search your syllabus..." 
              className="flex-1 bg-transparent border-none outline-none text-white px-3 text-sm font-semibold"
            />

            <button 
              onClick={handleSend}
              className="p-4 rounded-full bg-blue-600 shadow-lg shadow-blue-900/40"
            >
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5 rotate-45" />}
            </button>
          </div>

          <div className="flex justify-center mt-4">
            <p className="text-yellow-500 font-black text-[9px] tracking-[0.3em] uppercase flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> Rizwan Ashfaq Web Developer <Sparkles className="w-3 h-3" />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Chat;
      
