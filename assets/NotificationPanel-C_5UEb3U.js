const e=`\r
import React from 'react';\r
import { SimEvent, Vector2 } from '../../types';\r
\r
interface Props {\r
    events: SimEvent[];\r
    onFocus: (position: Vector2, entityId?: string) => void;\r
}\r
\r
const NotificationPanel: React.FC<Props> = ({ events, onFocus }) => {\r
    if (!events || events.length === 0) return null;\r
\r
    return (\r
        <div className="flex flex-col gap-1 w-full pointer-events-auto" style={{ maxWidth: '18rem' }}>\r
            <h5 className="text-[0.6rem] tracking-[0.3em] font-black text-[#689971] opacity-50 mb-0 pl-1 litho-text uppercase">Biosphere Log</h5>\r
            <div className="flex flex-col gap-1 max-h-[10rem] overflow-y-auto custom-scrollbar mask-gradient pr-2">\r
                {events.slice(0, 5).map((event, i) => (\r
                    <div\r
                        key={event.id}\r
                        onClick={(e) => { e.stopPropagation(); onFocus(event.position, event.entityId); }}\r
                        style={{ animationDelay: \`\${i * 50}ms\` }}\r
                        className={\`\r
              group cursor-pointer flex items-center gap-2 p-1.5 fluid-rounded\r
              bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-[#39AEA933] transition-all\r
              animate-in slide-in-from-left-4 fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]\r
              \${event.type === 'DEATH' ? 'hover:border-red-900/40 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : ''}\r
              juice-interactive\r
            \`}\r
                    >\r
                        <div\r
                            className="w-1rem h-1.5rem fluid-rounded-full shadow-[0_0_8px_currentColor]"\r
                            style={{ color: event.color || (event.type === 'DEATH' ? '#ef4444' : '#E5EFC1') }}\r
                        />\r
\r
                        <div className="flex-1 min-w-0">\r
                            <div className="flex justify-between items-center mb-0">\r
                                <span className={\`text-[0.55rem] font-black tracking-widest uppercase \${event.type === 'DEATH' ? 'text-red-400' : 'text-[#39AEA9] opacity-80'} litho-text\`}>\r
                                    {event.type}\r
                                </span>\r
                                <span className="text-[0.5rem] font-mono font-black text-[#A2D5AB] opacity-20 italic">\r
                                    {(event.timestamp / 30).toFixed(1)}d\r
                                </span>\r
                            </div>\r
                            <div className="text-[0.65rem] font-medium text-[#E5EFC1] opacity-60 truncate leading-tight group-hover:opacity-100 transition-opacity" title={event.message}>\r
                                {event.message}\r
                            </div>\r
                        </div>\r
                    </div>\r
                ))}\r
            </div>\r
        </div>\r
    );\r
};\r
\r
export default NotificationPanel;\r
`;export{e as default};
