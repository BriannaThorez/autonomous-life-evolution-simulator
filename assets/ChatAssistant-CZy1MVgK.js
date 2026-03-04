const e=`import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useChat } from './useChat';
import { ChatInterface } from './ChatInterface';
import { ChatFloatingButton } from './ChatFloatingButton';
import { SimulationState } from '../../../types';

const SIMULATION_SYSTEM_INSTRUCTION = \`You are an expert biological simulation assistant and code consultant. 
You have access to the codebase of this "Autonomous Life Evolution Simulator".
Answer questions about how the simulation works, the genetics, the code base, or how to use the interface.
Be concise and helpful. Use markdown for code snippets.\`;

interface ChatAssistantProps {
  simState: SimulationState;
}

export default function ChatAssistant({ simState }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 60, y: window.innerHeight - 60 });
  const [isDragging, setIsDragging] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage, config } = useChat({
    systemInstruction: SIMULATION_SYSTEM_INSTRUCTION,
    simState,
    title: "Simulation Oracle",
    welcomeMessage: "Ask me anything about the simulation logic."
  });

  // Close on lose focus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleDrag = (e: any, info: any) => {
    const newX = Math.min(Math.max(20, position.x + info.delta.x), window.innerWidth - 100);
    const newY = Math.min(Math.max(20, position.y + info.delta.y), window.innerHeight - 60);
    setPosition({ x: newX, y: newY });
  };

  return (
    <div className="fixed z-[100] pointer-events-none inset-0 overflow-hidden">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute pointer-events-auto flex flex-col glass-modular fluid-rounded shadow-2xl overflow-hidden"
            style={{
              left: Math.min(position.x - 400, window.innerWidth - 460),
              top: Math.min(position.y - 440, window.innerHeight - 480),
              width: '25rem',
              height: '28rem',
              border: '1px solid rgba(162, 213, 171, 0.15)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)'
            }}
          >
            <div className="relative h-full w-full">
              <ChatInterface
                messages={messages}
                isLoading={isLoading}
                onSendMessage={sendMessage}
                {...config}
              />
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded-lg transition-colors z-10 text-white/50 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        drag
        dragMomentum={false}
        onDrag={handleDrag}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
        className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
        style={{ left: position.x, top: position.y }}
      >
        <ChatFloatingButton
          isOpen={isOpen}
          onClick={() => !isDragging && setIsOpen(!isOpen)}
          isHovered={isHovered}
          onHoverChange={setIsHovered}
          label="Oracle Assistant"
        />
      </motion.div>
    </div>
  );
}
`;export{e as default};
