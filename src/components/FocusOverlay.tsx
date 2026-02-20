import { motion, AnimatePresence } from "framer-motion";

const FocusOverlay = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
      >
        <div className="text-center px-8">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="font-display text-3xl font-black text-gradient-primary mb-4 tracking-wider">
            FOCUS MODE ACTIVE
          </h1>
          <p className="text-xl text-foreground font-semibold">Back to studies!</p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default FocusOverlay;
