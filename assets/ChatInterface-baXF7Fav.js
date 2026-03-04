const e=`import React, { useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import Markdown from 'react-markdown';
import { Message } from './types';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  title?: string;
  placeholder?: string;
  welcomeMessage?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  onSendMessage,
  title = "Assistant",
  placeholder = "Type a message...",
  welcomeMessage = "How can I help you today?"
}) => {
  const [input, setInput] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden pointer-events-auto">
      {/* Header */}
      <div className="fluid-p-sm border-b border-white/5 flex items-center justify-between bg-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#E5EFC1] shadow-[0_0_8px_#E5EFC1]" />
          <span className="text-[var(--text-xs)] font-black uppercase tracking-[0.3em] opacity-80 litho-text text-[#E5EFC1]">{title}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-2">
            <MessageSquare size={24} />
            <p className="text-[0.65rem] uppercase tracking-wider">{welcomeMessage}</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={\`flex \${m.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
            <div className={\`max-w-[95%] fluid-p-sm fluid-rounded text-[var(--text-sm)] leading-relaxed \${m.role === 'user'
              ? 'bg-[#39AEA922] border border-[#39AEA944] text-[#E5EFC1]'
              : 'bg-white/[0.03] border border-white/10 text-white/90 shadow-sm'
              }\`}>
              <div className="markdown-body">
                <Markdown>{m.text}</Markdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 p-1.5 rounded-xl flex gap-1">
              <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fluid-p-sm bg-black/40 border-t border-white/5">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={placeholder}
            className="w-full bg-white/[0.02] border border-white/10 fluid-rounded-md fluid-py-sm pl-4 pr-10 text-[var(--text-sm)] text-[#A2D5AB] focus:outline-none focus:border-[#39AEA966] transition-all font-mono"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#39AEA9] hover:text-[#A2D5AB] disabled:opacity-20 transition-all juice-interactive"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
`;export{e as default};
