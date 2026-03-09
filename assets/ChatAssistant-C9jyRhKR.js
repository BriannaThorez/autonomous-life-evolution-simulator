const e=`import React, { useState, useRef, useEffect } from 'react';\r
import { motion, AnimatePresence } from 'framer-motion';\r
import { X } from 'lucide-react';\r
import { useChat } from './useChat';\r
import { ChatInterface } from './ChatInterface';\r
import { ChatFloatingButton } from './ChatFloatingButton';\r
\r
const SIMULATION_SYSTEM_INSTRUCTION = \`You are an expert biological simulation assistant and code consultant. \r
You have access to the codebase of this "Autonomous Life Evolution Simulator".\r
Answer questions about how the simulation works, the genetics, the code base, or how to use the interface.\r
Be concise and helpful. Use markdown for code snippets.\`;\r
\r
import { SimulationState } from '../../../types';\r
\r
interface ChatAssistantProps {\r
  simState: SimulationState;\r
}\r
\r
export default function ChatAssistant({ simState }: ChatAssistantProps) {\r
  const [isOpen, setIsOpen] = useState(false);\r
  const [isHovered, setIsHovered] = useState(false);\r
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 });\r
  const [isDragging, setIsDragging] = useState(false);\r
\r
  const chatRef = useRef<HTMLDivElement>(null);\r
\r
  const { messages, isLoading, sendMessage, isConfigured, configurationMessage } = useChat({\r
    systemInstruction: SIMULATION_SYSTEM_INSTRUCTION,\r
    simState\r
  });\r
\r
  // Close on lose focus\r
  useEffect(() => {\r
    const handleClickOutside = (event: MouseEvent) => {\r
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {\r
        setIsOpen(false);\r
      }\r
    };\r
    if (isOpen) {\r
      document.addEventListener('mousedown', handleClickOutside);\r
    }\r
    return () => document.removeEventListener('mousedown', handleClickOutside);\r
  }, [isOpen]);\r
\r
  const handleDrag = (e: any, info: any) => {\r
    const newX = Math.min(Math.max(20, position.x + info.delta.x), window.innerWidth - 160);\r
    const newY = Math.min(Math.max(20, position.y + info.delta.y), window.innerHeight - 60);\r
    setPosition({ x: newX, y: newY });\r
  };\r
\r
  return (\r
    <div className="fixed z-[100] pointer-events-none inset-0 overflow-hidden">\r
      <AnimatePresence>\r
        {isOpen && (\r
          <motion.div\r
            ref={chatRef}\r
            initial={{ opacity: 0, scale: 0.9, y: 20 }}\r
            animate={{ opacity: 1, scale: 1, y: 0 }}\r
            exit={{ opacity: 0, scale: 0.9, y: 20 }}\r
            className="absolute pointer-events-auto flex flex-col overflow-hidden"\r
            style={{\r
              left: Math.min(position.x - 380, window.innerWidth - 440),\r
              top: Math.min(position.y - 420, window.innerHeight - 460),\r
              width: '26.4rem',\r
              height: '28rem',\r
            }}\r
          >\r
            <div className="relative h-full w-full">\r
              <ChatInterface\r
                messages={messages}\r
                isLoading={isLoading}\r
                onSendMessage={sendMessage}\r
                title="Simulation Oracle"\r
                welcomeMessage={isConfigured ? 'Ask me anything about the simulation logic.' : configurationMessage}\r
              />\r
              <button\r
                onClick={() => setIsOpen(false)}\r
                className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded-lg transition-colors z-10 text-white/50 hover:text-white"\r
              >\r
                <X size={14} />\r
              </button>\r
            </div>\r
          </motion.div>\r
        )}\r
      </AnimatePresence>\r
\r
      <motion.div\r
        drag\r
        dragMomentum={false}\r
        onDrag={handleDrag}\r
        onDragStart={() => setIsDragging(true)}\r
        onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}\r
        className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"\r
        style={{ left: position.x, top: position.y }}\r
      >\r
        <ChatFloatingButton\r
          isOpen={isOpen}\r
          onClick={() => !isDragging && setIsOpen(!isOpen)}\r
          isHovered={isHovered}\r
          onHoverChange={setIsHovered}\r
          label="Oracle Assistant"\r
        />\r
      </motion.div>\r
    </div>\r
  );\r
}\r
`;export{e as default};
