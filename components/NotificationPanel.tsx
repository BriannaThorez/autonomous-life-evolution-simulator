
import React from 'react';
import { SimEvent, Vector2 } from '../types';

interface Props {
    events: SimEvent[];
    onFocus: (position: Vector2, entityId?: string) => void;
}

const NotificationPanel: React.FC<Props> = ({ events, onFocus }) => {
    if (!events || events.length === 0) return null;

    return (
        <div className="flex flex-col fluid-gap-xs w-full pointer-events-auto">
            <h5 className="text-[var(--text-sm)] tracking-[0.3em] font-black text-[#689971] opacity-50 mb-1 pl-1 litho-text uppercase">Biosphere Log</h5>
            <div className="flex flex-col fluid-gap-xs max-h-[10rem] overflow-y-auto custom-scrollbar mask-gradient">
                {events.slice(0, 5).map((event, i) => (
                    <div
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); onFocus(event.position, event.entityId); }}
                        style={{ animationDelay: `${i * 50}ms` }}
                        className={`
              group cursor-pointer flex items-center fluid-gap-sm fluid-p-xs fluid-rounded
              bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-[#39AEA933] transition-all
              animate-in slide-in-from-left-4 fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
              ${event.type === 'DEATH' ? 'hover:border-red-900/40 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : ''}
              juice-interactive
            `}
                    >
                        <div
                            className="w-1rem h-1.5rem fluid-rounded-full shadow-[0_0_8px_currentColor]"
                            style={{ color: event.color || (event.type === 'DEATH' ? '#ef4444' : '#E5EFC1') }}
                        />

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-0.5">
                                <span className={`text-[var(--text-xs)] font-black tracking-widest uppercase ${event.type === 'DEATH' ? 'text-red-400' : 'text-[#39AEA9] opacity-80'} litho-text`}>
                                    {event.type}
                                </span>
                                <span className="text-[0.55rem] font-mono font-black text-[#A2D5AB] opacity-20 italic">
                                    {(event.timestamp / 30).toFixed(1)}d
                                </span>
                            </div>
                            <div className="text-[var(--text-sm)] font-medium text-[#E5EFC1] opacity-60 truncate leading-tight group-hover:opacity-100 transition-opacity" title={event.message}>
                                {event.message}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotificationPanel;
