'use client';

import { motion } from 'framer-motion';

interface ModeSelectorProps {
  currentMode: 'text' | 'speech';
  onModeChange: (mode: 'text' | 'speech') => void;
  disabled?: boolean;
}

export default function ModeSelector({ currentMode, onModeChange, disabled }: ModeSelectorProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
      <span className="text-sm text-white/70 font-medium">Mode:</span>
      
      <div className="flex gap-2">
        {/* Text Mode Button */}
        <motion.button
          onClick={() => onModeChange('text')}
          disabled={disabled}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
            currentMode === 'text'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          whileHover={!disabled ? { scale: 1.05 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Text
          </span>
        </motion.button>

        {/* Speech Mode Button */}
        <motion.button
          onClick={() => onModeChange('speech')}
          disabled={disabled}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
            currentMode === 'speech'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          whileHover={!disabled ? { scale: 1.05 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Speech
          </span>
        </motion.button>
      </div>

      {/* Mode Description */}
      <span className="text-xs text-white/50 ml-2">
        {currentMode === 'text' ? 'Text responses only' : 'Avatar speaks responses'}
      </span>
    </div>
  );
}
