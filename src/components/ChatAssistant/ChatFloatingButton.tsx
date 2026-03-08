import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';

interface ChatFloatingButtonProps {
  isOpen: boolean;
  onClick: () => void;
  isHovered: boolean;
  onHoverChange: (hovered: boolean) => void;
  label?: string;
}

export const ChatFloatingButton: React.FC<ChatFloatingButtonProps> = ({
  isOpen,
  onClick,
  isHovered,
  onHoverChange,
  label = "Assistant"
}) => {
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      animate={{
        scale: isHovered ? 1.05 : 1,
        width: isHovered && !isOpen ? 'auto' : '2.5rem', // Smaller size
        paddingRight: isHovered && !isOpen ? '1rem' : '0rem'
      }}
      className={`h-[2.5rem] ${isOpen ? 'bg-white/10' : 'bg-black/60'} backdrop-blur-md border border-white/10 rounded-full shadow-2xl flex items-center justify-center gap-2 overflow-hidden pointer-events-auto relative group`}
    >
      {/* Glowing Pulse Effect */}
      {!isOpen && (
        <span className="absolute inset-0 rounded-full border border-emerald-500/50 animate-pulse" />
      )}

      <div className="w-[2.5rem] flex-shrink-0 flex items-center justify-center text-emerald-400">
        {isOpen ? <X size={18} /> : <MessageSquare size={18} />}
      </div>
      <AnimatePresence>
        {isHovered && !isOpen && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-xs font-bold whitespace-nowrap text-emerald-100 pr-2"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
