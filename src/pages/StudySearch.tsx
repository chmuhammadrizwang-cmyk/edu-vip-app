import { logStudyActivity } from "@/Utils/activityLogger";
import React, { useState } from "react";
import { BookOpen, Search, X, PlayCircle, GraduationCap, Lock, Globe, Youtube, Info } from "lucide-react";
import { toast } from "sonner";

// --- TypeScript Interface ---
interface VideoSnippet {
  id: { videoId: string };
  snippet: {
    title: string;
    thumbnails: { medium: { url: string } };
    channelTitle: string;
    description: string;
  };
}

const StudySearch: React.FC = () => {
  // States for Inputs
  const [className, setClassName] = useState(""); 
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState(""); 
  const [medium, setMedium] = useState<"Urdu" | "English">("Urdu");

  // States for Data & UI
  const [videos, setVideos] = useState<VideoSnippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  // --- Search Logic with Elite Filtering ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!className || !subject) {
      toast.error("Please enter Class and Subject!");
      return;
    }

    setLoading(true);
    // Note: API Key is sensitive, but keeping your original one as requested
    const API_KEY = "AIzaSyCrugpInDzka4F78dDB5yOCLLyXkGDeuec";
    
    /**
     * ELITE FILTERING:
     * 1. No Shorts: Hum 'videoDuration: long' use karenge.
     * 2. Medium focus: Urdu ya English query mein add hoga.
     * 3. Negative keywords: Songs, trailers block.
     */
    const forbidden = "-shorts -music -song -trailer -funny -entertainment -movie -gaming -vlog";
    const focusTags = "full lecture complete lesson classroom tutorial explanation";
    
    // Yahan hum strict medium filter add kar rahe hain
    const mediumQuery = medium === "Urdu" ? "Urdu Medium Hindi" : "English Medium CBSE IGCSE";
    
    const query = `${className} ${subject} ${topic} ${mediumQuery} ${focusTags} ${forbidden}`;
    
    // API URL with videoDuration=long to avoid Shorts
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(
      query
    )}&type=video&videoDuration=long&relevanceLanguage=en&safeSearch=strict&key=${API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        setVideos(data.items);
        toast.success(`Found ${data.items.length} elite lessons!`);
      } else {
        setVideos([]);
        toast.error("No study material found. Try different keywords.");
      }
    } catch (error) {
      console.error("API Error:", error);
      toast.error("Search limit reached or network issue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans p-4 md:p-8">
      
      {/* Elite Header */}
      <header className="text-center mb-12 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -z-10"></div>
        <div className="inline-flex p-4 rounded-3xl bg-blue-600/10 border border-blue-500/20 mb-6 animate-pulse">
          <GraduationCap size={40} className="text-blue-500" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter mb-2">
          Study<span className="text-blue-500 italic">Search</span>
          <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded ml-2 align-middle uppercase tracking-widest">Pro</span>
        </h1>
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm font-bold uppercase tracking-[0.2em]">
          <Lock size={14} className="text-green-500" /> Safe Environment Active
        </div>
      </header>

      {/* VIP Filter Box */}
      <div className="max-w-4xl mx-auto mb-16 bg-[#0f0f0f] border border-[#1a1a1a] p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full"></div>
        
        <form onSubmit={handleSearch} className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Class Level</label>
              <input 
                type="text" 
                placeholder="e.g. 10th Class" 
                value={className} 
                onChange={(e) => setClassName(e.target.value)} 
                className="w-full bg-black border border-[#222] p-4 rounded-2xl focus:border-blue-500 transition-all outline-none text-white font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Subject</label>
              <input 
                type="text" 
                placeholder="e.g. Physics" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                className="w-full bg-black border border-[#222] p-4 rounded-2xl focus:border-blue-500 transition-all outline-none text-white font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Topic (Sabq)</label>
              <input 
                type="text" 
                placeholder="e.g. Newton Laws" 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)} 
                className="w-full bg-black border border-[#222] p-4 rounded-2xl focus:border-blue-500 transition-all outline-none text-white font-bold"
              />
            </div>
          </div>

          {/* Medium Selector & Search Button */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex bg-black p-1.5 rounded-2xl border border-[#222] w-full md:w-auto">
              <button 
                type="button"
                onClick={() => setMedium("Urdu")}
                className={`flex-1 md:px-8 py-3 rounded-xl text-xs font-black transition-all ${medium === "Urdu" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-gray-300"}`}
              >
                URDU MEDIUM
              </button>
              <button 
                type="button"
                onClick={() => setMedium("English")}
                className={`flex-1 md:px-8 py-3 rounded-xl text-xs font-black transition-all ${medium === "English" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-gray-300"}`}
              >
                ENGLISH MEDIUM
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full md:flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 py-4 rounded-2xl text-white font-black tracking-widest shadow-xl shadow-blue-600/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Search size={20} /> FIND ELITE LESSONS</>}
            </button>
          </div>
        </form>
      </div>

      {/* Results Grid with Elite Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {videos.map((video) => (
          <div 
            key={video.id.videoId} 
            onClick={() => {
              logStudyActivity("Video", `Video Watched: ${video.snippet.title}`); 
              setSelectedVideoId(video.id.videoId);
            }} 
            className="group bg-[#0f0f0f] rounded-[35px] overflow-hidden border border-[#1a1a1a] hover:border-blue-500/50 transition-all duration-500 cursor-pointer shadow-2xl hover:translate-y-[-5px]"
          >
            <div className="relative aspect-video">
              <img src={video.snippet.thumbnails.medium.url} alt="thumb" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <PlayCircle size={60} className="text-white drop-shadow-2xl" />
              </div>
              <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-1 rounded text-[10px] font-bold text-blue-400 border border-blue-500/20 uppercase tracking-widest">
                Elite Lesson
              </div>
            </div>
            <div className="p-6">
              <h4 className="text-gray-100 font-bold text-[15px] leading-tight mb-3 line-clamp-2 group-hover:text-blue-400 transition-colors">
                {video.snippet.title}
              </h4>
              <div className="flex items-center gap-2 pt-4 border-t border-[#1a1a1a]">
                <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center">
                  <Youtube size={12} className="text-blue-500" />
                </div>
                <span className="text-[11px] font-black text-gray-500 uppercase tracking-tighter">{video.snippet.channelTitle}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results Placeholder */}
      {!loading && videos.length === 0 && (
        <div className="text-center py-20 opacity-20">
          <BookOpen size={80} className="mx-auto mb-4" />
          <p className="text-xl font-bold italic tracking-tighter">Enter details to fetch premium lectures...</p>
        </div>
      )}

      {/* Elite Video Modal */}
      {selectedVideoId && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[1000] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="w-full max-w-5xl relative">
            <button 
              onClick={() => setSelectedVideoId(null)} 
              className="absolute -top-16 right-0 text-white/50 hover:text-white transition-colors"
            >
              <X size={40} />
            </button>
            <div className="relative aspect-video rounded-[30px] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(37,99,235,0.2)]">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1&rel=0&modestbranding=1`}
                title="Elite Study Player"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              ></iframe>
            </div>
            <div className="mt-6 flex items-center gap-4 text-blue-500/60 font-black text-[10px] tracking-[0.5em] uppercase justify-center">
              <Info size={14} /> Strict Educational Mode Active
            </div>
          </div>
        </div>
      )}

      {/* Rizwan Ashfaq Footer */}
      <footer className="mt-24 mb-10 text-center">
        <div className="inline-block relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative px-12 py-6 bg-black rounded-full border border-blue-900/30 shadow-2xl">
            <p className="text-[9px] font-black text-blue-600 tracking-[0.4em] uppercase mb-1">Architect</p>
            <p className="text-2xl font-black bg-gradient-to-r from-blue-500 via-blue-100 to-blue-600 bg-clip-text text-transparent tracking-tighter">
              Rizwan Ashfaq Web Developer
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudySearch;
                    
