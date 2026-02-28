import { logStudyActivity } from "@/Utils/activityLogger";
import React, { useState } from "react";
import { BookOpen, Search, X, PlayCircle, GraduationCap, Lock } from "lucide-react";

// --- 1. TypeScript Interface ---
interface VideoSnippet {
  id: { videoId: string };
  snippet: {
    title: string;
    thumbnails: { medium: { url: string } };
    channelTitle: string;
  };
}

const StudySearch: React.FC = () => {
  // States for Inputs
  const [className, setClassName] = useState(""); 
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState(""); 

  // States for Data & UI
  const [videos, setVideos] = useState<VideoSnippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  // --- 2. Search Logic with Strict Filter ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!className || !subject) {
      alert("Please enter at least Class and Subject!");
      return;
    }

    setLoading(true);
    const API_KEY = "AIzaSyCrugpInDzka4F78dDB5yOCLLyXkGDeuec";
    
    /**
     * STRICT FILTERING: 
     * Humne query mein '-movie -song' wagera lagaya hai taake YouTube 
     * entertainment content ko block kar de.
     */
    const forbidden = "-movie -song -music -trailer -entertainment -gaming -funny";
    const studyFocus = "educational lesson lecture tutorial full chapter";
    
    const query = `${className} ${subject} ${topic} ${studyFocus} ${forbidden}`;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(
      query
    )}&type=video&key=${API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        setVideos(data.items);
      } else {
        setVideos([]);
        alert("No study material found. Please try different keywords.");
      }
    } catch (error) {
      console.error("API Error:", error);
      alert("Technical issue or API Limit reached.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f4f8", fontFamily: "sans-serif", padding: "20px" }}>
      
      {/* Header Section */}
      <header style={{ textAlign: "center", marginBottom: "40px" }}>
        <div style={{ backgroundColor: "#2563eb", width: "60px", height: "60px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", margin: "0 auto 15px" }}>
          <GraduationCap size={35} color="white" />
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#1e293b", margin: "0" }}>
          Study<span style={{ color: "#2563eb" }}>Search</span>
        </h1>
        <p style={{ color: "#64748b", display: "flex", justifyContent: "center", alignItems: "center", gap: "5px" }}>
          <Lock size={14} /> Safe Educational Environment Only
        </p>
      </header>

      {/* 3-Filter VIP Search Form */}
      <div style={{ maxWidth: "850px", margin: "0 auto 40px", backgroundColor: "white", padding: "25px", borderRadius: "20px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
        <form onSubmit={handleSearch} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
          
          <div style={inputBoxStyle}>
            <label style={labelStyle}>Class</label>
            <input type="text" placeholder="e.g. 9th Class" value={className} onChange={(e) => setClassName(e.target.value)} style={inputFieldStyle} />
          </div>

          <div style={inputBoxStyle}>
            <label style={labelStyle}>Subject</label>
            <input type="text" placeholder="e.g. Chemistry" value={subject} onChange={(e) => setSubject(e.target.value)} style={inputFieldStyle} />
          </div>

          <div style={inputBoxStyle}>
            <label style={labelStyle}>Topic (Sabq)</label>
            <input type="text" placeholder="e.g. Exercise 2.4" value={topic} onChange={(e) => setTopic(e.target.value)} style={inputFieldStyle} />
          </div>

          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "Searching..." : "Find Lessons"}
          </button>
        </form>
      </div>

      {/* Results Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", maxWidth: "1100px", margin: "0 auto" }}>
        {videos.map((video) => (
          <div key={video.id.videoId} onClick={() => {logStudyActivity("Video", `Bache ne video dekhi: ${video.snippet.title}`); 
                                                      setSelectedVideoId(video.id.videoId)}} style={cardStyle}>
            <div style={{ position: "relative" }}>
              <img src={video.snippet.thumbnails.medium.url} alt="thumbnail" style={{ width: "100%", height: "160px", objectFit: "cover" }} />
              <div style={playIconStyle}><PlayCircle size={40} color="white" /></div>
            </div>
            <div style={{ padding: "15px" }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "0.95rem", color: "#1e293b", height: "2.6rem", overflow: "hidden" }}>{video.snippet.title}</h4>
              <span style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: "bold" }}>{video.snippet.channelTitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* VIP Video Player Modal */}
      {selectedVideoId && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <button onClick={() => setSelectedVideoId(null)} style={closeButtonStyle}><X size={32} /></button>
            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
              <iframe
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", borderRadius: "10px" }}
                src={`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1&rel=0`}
                title="Study Video"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- VIP Styles ---
const inputBoxStyle = { display: "flex", flexDirection: "column" as const, gap: "5px" };
const labelStyle = { fontSize: "0.8rem", fontWeight: "bold", color: "#475569" };
const inputFieldStyle = { padding: "12px", borderRadius: "10px", border: "2px solid #e2e8f0", outline: "none", fontSize: "1rem" };
const btnStyle = { backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", marginTop: "22px", height: "48px" };
const cardStyle = { backgroundColor: "white", borderRadius: "15px", overflow: "hidden", cursor: "pointer", transition: "0.2s", border: "1px solid #e2e8f0" };
const playIconStyle: React.CSSProperties = { position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.2)" };
const overlayStyle: React.CSSProperties = { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" };
const modalStyle = { width: "100%", maxWidth: "850px", position: "relative" as const };
const closeButtonStyle: React.CSSProperties = { position: "absolute", top: "-45px", right: 0, color: "white", background: "none", border: "none", cursor: "pointer" };

export default StudySearch;
          
