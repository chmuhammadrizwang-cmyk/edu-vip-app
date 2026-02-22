import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import BrandingFooter from "@/components/BrandingFooter";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { Lock, ShieldCheck } from "lucide-react";

const ParentalSecurity = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authPin, setAuthPin] = useState("");
  const [authError, setAuthError] = useState("");

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);
  const hasExistingPin = !!localStorage.getItem("study_guard_pin");

  const handleAuth = () => {
    const storedPin = localStorage.getItem("study_guard_pin");
    if (!storedPin) {
      // No PIN set yet — allow access to set one
      setAuthenticated(true);
      return;
    }
    if (authPin === storedPin) {
      setAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect PIN");
    }
  };

  const handleChangePin = () => {
    const storedPin = localStorage.getItem("study_guard_pin");
    setPinError("");
    setPinSuccess(false);

    if (storedPin && currentPin !== storedPin) {
      setPinError("Current PIN is incorrect");
      return;
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError("New PIN must be 4 digits");
      return;
    }
    localStorage.setItem("study_guard_pin", newPin);
    setCurrentPin("");
    setNewPin("");
    setPinSuccess(true);
    toast.success("PIN updated successfully!");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AppHeader onMenuClick={() => setSidebarOpen(true)} title="Parental Security" />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {!authenticated ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass rounded-2xl p-6 glow-primary">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <h2 className="font-display text-lg font-semibold text-foreground">Enter Parental PIN</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {hasExistingPin
                  ? "Enter your current PIN to access security settings."
                  : "No PIN set yet. Tap below to set your first PIN."}
              </p>
              {hasExistingPin ? (
                <div className="space-y-3">
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    placeholder="Enter PIN"
                    value={authPin}
                    onChange={(e) => { setAuthPin(e.target.value.replace(/\D/g, "")); setAuthError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                    className="w-full py-3 px-4 rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all text-center tracking-[0.5em]"
                  />
                  {authError && <p className="text-destructive text-sm text-center">{authError}</p>}
                  <button
                    onClick={handleAuth}
                    disabled={authPin.length !== 4}
                    className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    Unlock
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAuth}
                  className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                >
                  Set Up PIN
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass rounded-2xl p-6 glow-primary">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-6 w-6 text-primary" />
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {hasExistingPin ? "Change Parental PIN" : "Set Parental PIN"}
                </h2>
              </div>
              <div className="space-y-3">
                {hasExistingPin && (
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    placeholder="Current PIN"
                    value={currentPin}
                    onChange={(e) => { setCurrentPin(e.target.value.replace(/\D/g, "")); setPinError(""); setPinSuccess(false); }}
                    className="w-full py-3 px-4 rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all text-center tracking-[0.5em]"
                  />
                )}
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="New PIN"
                  value={newPin}
                  onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, "")); setPinError(""); setPinSuccess(false); }}
                  className="w-full py-3 px-4 rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all text-center tracking-[0.5em]"
                />
                {pinError && <p className="text-destructive text-sm text-center">{pinError}</p>}
                {pinSuccess && <p className="text-sm text-center" style={{ color: "hsl(145 95% 55%)" }}>PIN updated! ✓</p>}
                <button
                  onClick={handleChangePin}
                  disabled={hasExistingPin ? (currentPin.length !== 4 || newPin.length !== 4) : newPin.length !== 4}
                  className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {hasExistingPin ? "Update PIN" : "Set PIN"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <BrandingFooter />
    </div>
  );
};

export default ParentalSecurity;
