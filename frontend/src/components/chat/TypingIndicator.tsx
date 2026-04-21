'use client';
import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
        <span className="text-[9px] font-mono text-[var(--accent)] uppercase tracking-widest mr-2">processing</span>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1 h-1 rounded-full bg-[var(--accent)]"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}