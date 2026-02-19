import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const savedClass = localStorage.getItem("edu_selected_class");
        const savedTime = localStorage.getItem("edu_study_time");
        if (savedClass && savedTime) {
          navigate("/chat");
        } else {
          navigate("/settings");
        }
      } else {
        navigate("/auth");
      }
    });
    return unsub;
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default Index;
