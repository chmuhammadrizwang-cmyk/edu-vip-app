import React, { useState } from "react";
import { BookOpen } from "lucide-react";

// 1. Interface (Sahi hai)
interface VideoSnippet {
  id: { videoId: string };
  snippet: {
    title: string;
    thumbnails: { medium: { url: string } };
    channelTitle: string;
  };
}

const StudySearch: React.FC = () => {
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  
  // FIXED: Yahan interface specify karna zaroori hai
  const [videos, setVideos] = useState<VideoSnippet[]>([]); 
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className || !subject) return;

    setLoading(true);

    // Note: Is key ko .env file mein rakhein
    const API_KEY = "AIzaSyCrugpInDzka4F78dDB5yOCLLyXkGDeuec";
    const query = `${className} ${subject} lesson tutorial chapter class`;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(
      query
    )}&type=video&key=${API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      // Check agar data sahi mila hai
      if (data.items) {
        setVideos(data.items);
      } else {
        alert("No videos found or API limit reached.");
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    // FIXED: Main container wrapper zaroori hai
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      
      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", fontSize: "2.5rem", color: "#1e293b" }}>
          <BookOpen size={36} color="#2563eb" /> StudySearch
        </h1>
        <p style={{ color: "#64748b" }}>Search lessons by Class & Subject only.</p>
      </header>

      {/* Search Form */}
      <form
        onSubmit={handleSearch}
        style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "40px" }}
      >
        <input
          type="text"
          placeholder="Class (e.g. 10th)"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #ddd", minWidth: "200px" }}
        />
        <input
          type="text"
          placeholder="Subject (e.g. Biology)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #ddd", minWidth: "200px" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 24px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: loading ? "#94a3b8" : "#2563eb",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Searching..." : "Find Lessons"}
        </button>
      </form>

      {/* Video Results Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {videos.map((video) => (
          <a
            key={video.id.videoId}
            href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: "none",
              color: "inherit",
              border: "1px solid #eee",
              borderRadius: "12px",
              overflow: "hidden",
              transition: "transform 0.2s",
              display: "block", // Ensure link takes full space
              backgroundColor: "#fff"
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <img
              src={video.snippet.thumbnails.medium.url}
              alt={video.snippet.title}
              style={{ width: "100%", height: "180px", objectFit: "cover" }}
            />
            <div style={{ padding: "15px" }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "1rem", color: "#1e293b", height: "45px", overflow: "hidden" }}>
                {video.snippet.title}
              </h4>
              <p style={{ fontSize: "0.85rem", color: "#64748b" }}>{video.snippet.channelTitle}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Empty State */}
      {!loading && videos.length === 0 && (
        <div style={{ textAlign: "center", color: "#94a3b8", marginTop: "50px" }}>
          No videos to show. Enter details and search.
        </div>
      )}
    </div>
  );
};

export default StudySearch;
