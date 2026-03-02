const e=`import React from 'react';
import Markdown from 'react-markdown';

export const ChatInterface = ({ messages, isLoading, onSendMessage, title, welcomeMessage }: any) => {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col h-full w-full">
      <div className="font-bold text-cyan-400 mb-2">{title}</div>
      <div className="flex-1 overflow-y-auto text-sm text-slate-300 pr-2">
        {messages.length === 0 ? <div className="text-slate-500 italic">{welcomeMessage}</div> : null}
        {messages.map((m: any, i: number) => (
          <div key={i} className={\`mb-4 \${m.role === 'user' ? 'text-right text-cyan-300' : 'text-left text-slate-300'}\`}>
            {m.role === 'user' ? (
              m.text
            ) : (
              <div className="prose prose-invert prose-sm max-w-none">
                <Markdown>{m.text}</Markdown>
              </div>
            )}
          </div>
        ))}
        {isLoading && <div className="text-slate-500 italic">Thinking...</div>}
      </div>
      <div className="mt-2 flex gap-2">
        <input 
          type="text" 
          className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white" 
          placeholder="Ask a question..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value) {
              onSendMessage(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
      </div>
    </div>
  );
};
`;export{e as default};
