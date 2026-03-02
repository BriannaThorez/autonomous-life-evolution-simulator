const e=`import React from 'react';
import { MessageCircle } from 'lucide-react';

export const ChatFloatingButton = ({ isOpen, onClick, isHovered, onHoverChange, label }: any) => {
  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      className={\`p-4 rounded-full shadow-lg transition-all \${isOpen ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-cyan-400 hover:bg-slate-700 border border-slate-700'}\`}
      title={label}
    >
      <MessageCircle size={24} />
    </button>
  );
};
`;export{e as default};
