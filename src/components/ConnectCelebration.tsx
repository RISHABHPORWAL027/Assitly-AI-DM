import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PartyPopper, Sparkles } from 'lucide-react';
import { fireInstagramConnectCelebration } from '../lib/celebration';

interface ConnectCelebrationProps {
  show: boolean;
  displayName?: string;
  onComplete?: () => void;
}

export default function ConnectCelebration({
  show,
  displayName,
  onComplete,
}: ConnectCelebrationProps) {
  useEffect(() => {
    if (!show) return;

    fireInstagramConnectCelebration();
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3200);

    return () => clearTimeout(timer);
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            initial={{ scale: 0.4, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="relative bg-white/95 backdrop-blur-md border border-indigo-100 shadow-2xl shadow-indigo-500/20 rounded-3xl px-8 py-7 text-center max-w-sm"
          >
            <motion.div
              className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg mb-4"
              animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <PartyPopper className="w-8 h-8" />
            </motion.div>

            <motion.h2
              className="font-display font-black text-2xl text-slate-900 tracking-tight"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Hurray!
            </motion.h2>

            <motion.p
              className="font-sans text-sm text-slate-600 mt-1.5 font-medium"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Instagram connected successfully
            </motion.p>

                {displayName && (
              <motion.p
                className="font-sans text-xs text-indigo-600 font-bold mt-2 flex items-center justify-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {displayName}
              </motion.p>
            )}

            <motion.div
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 text-white text-[10px] font-black flex items-center justify-center shadow-md"
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: 2, duration: 0.5, delay: 0.3 }}
            >
              ✓
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
