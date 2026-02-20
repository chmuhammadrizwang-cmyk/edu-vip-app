import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PinDialogProps {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

const PinDialog = ({ open, onSuccess, onCancel }: PinDialogProps) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const storedPin = localStorage.getItem("study_guard_pin") || "0000";

  const handleSubmit = () => {
    if (pin === storedPin) {
      setPin("");
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setPin("");
      // Log incident
      const incidents = JSON.parse(localStorage.getItem("study_guard_incidents") || "[]");
      incidents.push({ type: "wrong_pin", timestamp: new Date().toISOString() });
      localStorage.setItem("study_guard_incidents", JSON.stringify(incidents));
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-background/90 backdrop-blur-md flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="glass rounded-2xl p-8 w-80 text-center glow-primary"
          >
            <div className="text-4xl mb-4">🔐</div>
            <h2 className="font-display text-lg font-bold text-foreground mb-2">Parental PIN Required</h2>
            <p className="text-sm text-muted-foreground mb-4">Enter 4-digit PIN to continue</p>
            <input
              type="password"
              maxLength={4}
              inputMode="numeric"
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(false); }}
              onKeyDown={(e) => e.key === "Enter" && pin.length === 4 && handleSubmit()}
              className="w-full text-center text-2xl tracking-[0.5em] py-3 px-4 rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-3"
              autoFocus
            />
            {error && <p className="text-destructive text-sm mb-3">Wrong PIN!</p>}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl bg-muted/50 text-muted-foreground font-medium hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={pin.length !== 4}
                className="flex-1 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Unlock
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PinDialog;
