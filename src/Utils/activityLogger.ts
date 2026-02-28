export const logStudyActivity = (activityType: string, details: string) => {
  try {
    // 1. Purana data uthao
    const history = JSON.parse(localStorage.getItem("study_diary") || "[]");

    // 2. Duplicate Check: Agar wahi kaam 2 second ke andar dubara ho raha hai to save mat karo
    const lastEntry = history[0];
    if (lastEntry && lastEntry.type === activityType && lastEntry.content === details) {
      const timeDiff = Date.now() - lastEntry.id;
      if (timeDiff < 2000) return; 
    }

    // 3. Naya Record banao
    const newRecord = {
      id: Date.now(), // Unique ID
      time: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      date: new Date().toLocaleDateString('en-GB'), // Format: DD/MM/YYYY
      type: activityType, 
      content: details
    };

    // 4. History update karo (Nayi cheez sab se upar)
    const updatedHistory = [newRecord, ...history];

    // 5. Sirf top 100 items rakho taake app heavy na ho
    localStorage.setItem("study_diary", JSON.stringify(updatedHistory.slice(0, 100)));
    
    console.log(`✅ Logged: ${activityType} - ${details}`);
  } catch (error) {
    console.error("❌ Activity Logger Error:", error);
  }
};
