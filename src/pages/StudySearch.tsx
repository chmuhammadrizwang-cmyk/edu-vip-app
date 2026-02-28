// File: ./pages/StudySearch.tsx
import { useState } from "react";

const classes = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
const subjects = ["Math", "Physics", "Chemistry", "Biology", "English", "Urdu", "Computer"];

const StudySearch = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [results, setResults] = useState<string[]>([]);

  const handleSearch = () => {
    // Filhal basic mock results, future vich YouTube API ya local data add kar sakde ho
    if (!selectedClass || !selectedSubject || !topic) {
      alert("Please select class, subject and enter topic");
      return;
    }
    setResults([
      `${selectedClass} - ${selectedSubject} - ${topic} Video 1`,
      `${selectedClass} - ${selectedSubject} - ${topic} Video 2`,
      `${selectedClass} - ${selectedSubject} - ${topic} Video 3`,
    ]);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📚 Study Search</h1>

      <div className="flex flex-col gap-4 max-w-md">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="">Select Class</option>
          {classes.map((cls) => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="">Select Subject</option>
          {subjects.map((sub) => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Enter Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="px-3 py-2 border rounded"
        />

        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Search
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Results:</h2>
          <ul className="list-disc list-inside">
            {results.map((res, i) => (
              <li key={i}>{res}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StudySearch;
