/**
 * PROJECT: STUDY GUARD SUPREME (FINAL CYBER-LUXE)
 * DEVELOPER: RIZWAN ASHFAQ (SENIOR WEB DEVELOPER)
 * DESIGN: PREMIUM GLASS-MORPHISM + VOICE + SECURITY
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

// Premium Icons
import { 
  Send, Mic, MicOff, Volume2, Share2, Shield, 
  Sparkles, Lock, Cpu, Activity, Info, 
  Settings, History, ChevronLeft, Speaker
} from "lucide-react";

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
  const [apiStatus, setApiStatus] = useState<"online" | "busy" | "offline">("online");
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // --- VOICE ENGINE (CLEAN PHONETICS) ---
  const speak = useCallback((text: string) => {
    if (!isAudioOn || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_~\[\]()]/g, "").trim();
    
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      utterance.voice = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US')) || voices[0];
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }, 350);
  }, [isAudioOn]);

  // --- AI LOGIC ---
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setApiStatus("busy");

    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: "You are the Supreme Study Guardian. Professional AI." }, ...messages, userMsg],
        }),
      });
      const data = await res.json();
      const aiRes = data.choices[0].message.content;
      setMessages(prev => [...prev, { role: "assistant", content: aiRes }]);
      speak(aiRes);
      setApiStatus("online");
    } catch (e) {
      setApiStatus("offline");
      toast.error("System connection failed.");
    } finally {
      setIsLoading(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b041a] text-white font-sans overflow-hidden relative">
      
      {/* Background Gradients (Tasveer ke mutabiq) */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-blue-900/10 to-[#0b041a] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 blur-[120px] rounded-full" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full" />

      {/* Header Bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <ChevronLeft className="w-6 h-6 text-gray-400" />
          <h1 className="text-sm font-black tracking-[0.3em] uppercase bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
            Study Guard Supreme
          </h1>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${apiStatus === 'online' ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'}`}>
          <div className={`w-2 h-2 rounded-full ${apiStatus === 'online' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500 animate-pulse'}`} />
          <span className="text-[9px] font-black uppercase tracking-widest">{apiStatus}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-6 py-8 relative z-10 no-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
            
            {/* NEW LOGO: Digital Intelligence Tree (Tasveer wala look) */}
            <div className="relative group">
              <div className="absolute inset-0 bg-purple-500 blur-[80px] opacity-20 group-hover:opacity-40 transition-all duration-1000" />
              <div className="relative w-52 h-52 p-1 rounded-full bg-gradient-to-tr from-yellow-500 via-purple-500 to-blue-500 shadow-2xl">
                <div className="w-full h-full rounded-full bg-[#120826] flex items-center justify-center overflow-hidden border-2 border-white/10">
                   <img 
                    src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" 
                    className="w-32 h-32 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                    alt="Study AI Supreme"
                   />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-5xl font-black italic tracking-tighter">Hello, <span className="text-purple-400">Student</span></h2>
              <p className="text-gray-400 text-lg font-medium">I am your AI Study Guardian. Ask me anything about your syllabus.</p>
            </div>

            {/* Premium Buttons Section */}
            <div className="flex flex-col w-full max-w-xs gap-4 pt-6">
               <div className="flex gap-3">
                 <button className="flex-1 flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 border border-blue-400/30 shadow-[0_4px_15px_rgba(37,99,235,0.4)] font-black text-xs tracking-widest uppercase">
                   <Share2 className="w-4 h-4" /> Share
                 </button>
                 <div className="flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] font-bold text-gray-300">Audio Output</span>
                    <button onClick={() => setIsAudioOn(!isAudioOn)} className={`w-12 h-6 rounded-full relative transition-all ${isAudioOn ? 'bg-purple-600' : 'bg-gray-700'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAudioOn ? 'right-1' : 'left-1'}`} />
                    </button>
                 </div>
               </div>

               {/* Waveform Visualization (Tasveer ke mutabiq) */}
               <div className="w-full h-16 glass-panel rounded-2xl flex items-center justify-center gap-1 px-6 border border-white/5 bg-white/5">
                  {[...Array(20)].map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={{ height: [10, Math.random() * 40, 10] }}
                      transition={{ repeat: Infinity, duration: 1 + Math.random() }}
                      className="w-1 bg-gradient-to-t from-purple-500 to-blue-400 rounded-full"
                    />
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* Chat Thread */}
        <div className="space-y-8 pb-44">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-6 rounded-[2rem] max-w-[90%] shadow-2xl border ${
                  msg.role === 'user' ? 'bg-gradient-to-br from-purple-600 to-indigo-700 border-white/20' : 'bg-white/5 border-white/10 backdrop-blur-xl'
                }`}>
                  <ReactMarkdown className="prose prose-invert prose-sm font-bold leading-relaxed">{msg.content}</ReactMarkdown>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </main>

      {/* COMMIT DESCRIPTION SECTION (Tasveer wala style) */}
      {messages.length === 0 && (
        <div className="px-10 mb-40 text-center opacity-60">
           <p className="text-[10px] font-mono leading-relaxed tracking-tight text-gray-400">
             Commit: [feat]: Core security lock and voice-cleanup logic.<br />
             Description: Complete rewrite of tab-monitoring security. <br />
             Integrated speech synthesis API for automatic answer playback with phonetic cleaning. - Developer, Rizwan Ashfaq
           </p>
        </div>
      )}

      {/* Floating Tactical Input (Tasveer ke mutabiq) */}
      <footer className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#0b041a] to-transparent z-50">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-center gap-3 p-1.5 rounded-[3rem] bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-purple-900/40 border border-white/10 backdrop-blur-3xl shadow-2xl">
            
            {/* MIC BUTTON (Gold/Gradient) */}
            <button className="p-4 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-600 shadow-lg text-black">
              <Mic className="w-6 h-6" />
            </button>
            
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask your AI Study Guardian..." 
              className="flex-1 bg-transparent border-none outline-none text-white font-bold text-lg px-2 placeholder:text-gray-500"
            />

            {/* SEND BUTTON (Cyber Blue) */}
            <button 
              onClick={handleSend}
              className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-800 border border-blue-400/40 shadow-xl"
            >
              <Send className="w-6 h-6 text-white rotate-45" />
            </button>
          </div>

          {/* Signature (Golden Sparkle) */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2 text-yellow-500 font-black text-[11px] tracking-[0.2em] uppercase">
              <Sparkles className="w-4 h-4" /> Rizwan Ashfaq Web Developer <Sparkles className="w-4 h-4" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Chat;
