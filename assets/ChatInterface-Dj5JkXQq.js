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
    <div className="flex flex-col h-full w-full bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto resize-y min-h-[200px] max-h-[80vh]">
      {/* Header */}
      <div className="p-1.5 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[0.6rem] font-bold uppercase tracking-widest opacity-70">{title}</span>
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
            <div className={\`max-w-[95%] p-2 rounded-xl text-[0.8rem] leading-relaxed \${m.role === 'user'
              ? 'bg-emerald-600/20 border border-emerald-500/20 text-emerald-50'
              : 'bg-white/5 border border-white/10 text-white/90'
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
      <div className="p-1.5 bg-white/5 border-t border-white/5">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={placeholder}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-1.5 pl-3 pr-10 text-[0.8rem] focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-emerald-400 hover:text-emerald-300 disabled:opacity-30 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
`;export{e as default};
