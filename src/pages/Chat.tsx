import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import BrandingFooter from "@/components/BrandingFooter";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { useStudyMonitor } from "@/hooks/useStudyMonitor";
import { useStudyLock, isStudyActive } from "@/hooks/useStudyLock";
import { Send, Mic, MicOff, Volume2 } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const Chat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const studyActive = isStudyActive();
  useStudyMonitor();
  useStudyLock();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/#{1,6}\s?/g, "")
      .replace(/\*{1,3}(.*?)\*{1,3}/g, "$1")
      .replace(/_{1,3}(.*?)_{1,3}/g, "$1")
      .replace(/`{1,3}[^`]*`{1,3}/g, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/^[-*+]\s/gm, "")
      .replace(/^\d+\.\s/gm, "")
      .replace(/^>\s?/gm, "")
      .replace(/---+/g, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .trim();
  };

  const speakText = (text: string) => {
    speechSynthesis.cancel();
    const clean = cleanMarkdown(text);
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = 0.9;
    u.pitch = 1.0;
    // Pick a high-quality voice
    const voices = speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes("Google UK English Female") ||
      v.name.includes("Google Hindi") ||
      v.name.includes("Google US English")
    ) || voices.find(v => v.lang.startsWith("en") && v.name.includes("Female"))
      || voices.find(v => v.lang.startsWith("en"));
    if (preferred) u.voice = preferred;
    speechSynthesis.speak(u);
  };

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Speech recognition not supported"); return; }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) { toast.error("Rate limited, try again later"); }
        else if (resp.status === 402) { toast.error("Credits exhausted"); }
        else { toast.error("AI request failed"); }
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
      // Speak the response
      if (assistantSoFar) speakText(assistantSoFar.slice(0, 500));
    } catch {
      toast.error("Connection error");
    }
    setIsLoading(false);
  };

  return (
    <div className="h-screen flex flex-col">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AppHeader onMenuClick={() => setSidebarOpen(true)} title="AI Chat" />

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center pt-20">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-primary glow-primary flex items-center justify-center">
                <span className="text-3xl">🤖</span>
              </div>
              <h2 className="font-display text-xl font-bold text-gradient-primary mb-2">AI Study Assistant</h2>
              <p className="text-muted-foreground text-sm">Ask me anything about your studies!</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-gradient-primary text-primary-foreground"
                  : "glass"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="flex items-start gap-2">
                  <div className="prose prose-invert prose-sm max-w-none flex-1">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  <button onClick={() => speakText(msg.content)} className="mt-1 p-1 rounded hover:bg-muted/50 transition-colors shrink-0">
                    <Volume2 className="h-4 w-4 text-secondary" />
                  </button>
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
            </div>
          </motion.div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      <div className="px-4 pb-2">
        <div className="flex gap-2 glass rounded-2xl p-2">
          <button
            onClick={toggleVoice}
            className={`p-3 rounded-xl transition-all ${
              isListening ? "bg-destructive text-destructive-foreground glow-pink" : "hover:bg-muted text-muted-foreground"
            }`}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none px-2"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="p-3 rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <BrandingFooter />
      </div>
    </div>
  );
};

export default Chat;
