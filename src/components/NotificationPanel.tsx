import React from 'react';
import { SimEvent, Vector2 } from '../../types';

interface Props {
    events: SimEvent[];
    onFocus: (position: Vector2, entityId?: string) => void;
    expanded: boolean;
    onToggleExpanded: () => void;
    position: Vector2;
    onPositionChange: (position: Vector2) => void;
}

const NotificationPanel: React.FC<Props> = ({
    events,
    onFocus,
    expanded,
    onToggleExpanded,
    position,
    onPositionChange,
}) => {
    const [isDragging, setIsDragging] = React.useState(false);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button')) return;
        e.stopPropagation();
        setIsDragging(true);
        const startX = e.clientX;
        const startY = e.clientY;
        const startPos = { ...position };

        const onMouseMove = (moveEvent: MouseEvent) => {
            onPositionChange({
                x: Math.max(10, Math.min(window.innerWidth - 280, startPos.x + (moveEvent.clientX - startX))),
                y: Math.max(10, Math.min(window.innerHeight - 70, startPos.y + (moveEvent.clientY - startY))),
            });
        };

        const onMouseUp = () => {
            setIsDragging(false);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    return (
        <div
            className="hud-shell fluid-rounded-lg pointer-events-auto overflow-hidden"
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: '17.8rem',
                maxWidth: 'calc(100vw - 1rem)',
                border: '1px solid rgba(162, 213, 171, 0.1)',
                boxShadow: '0 18px 42px rgba(0,0,0,0.45)',
                cursor: isDragging ? 'grabbing' : 'default',
                zIndex: 950,
            }}
            onWheel={(e) => e.stopPropagation()}
        >
            <div
                onMouseDown={handleMouseDown}
                className="hud-header-strip flex items-center justify-between select-none"
                style={{
                    padding: '0.22rem 0.34rem',
                    cursor: 'grab',
                    gap: '0.35rem',
                }}
            >
                <h5
                    className="font-black litho-text uppercase"
                    style={{
                        margin: 0,
                        fontSize: '0.62rem',
                        lineHeight: 1,
                        letterSpacing: '0.14em',
                        color: '#E5EFC1',
                    }}
                >
                    Biosphere Log
                </h5>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpanded();
                    }}
                    className="fluid-rounded juice-interactive"
                    style={{
                        border: '1px solid rgba(57, 174, 169, 0.26)',
                        background: 'rgba(57, 174, 169, 0.08)',
                        color: '#39AEA9',
                        width: '1.35rem',
                        height: '1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        lineHeight: 1,
                    }}
                >
                    {expanded ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    )}
                </button>
            </div>

            {expanded && (
                <div style={{ padding: '0.34rem 0.38rem 0.42rem' }}>
                    {events && events.length > 0 ? (
                        <div className="flex flex-col gap-1 max-h-[9rem] overflow-y-auto custom-scrollbar mask-gradient pr-1">
                            {events.slice(0, 5).map((event, i) => (
                                <div
                                    key={event.id}
                                    onClick={(e) => { e.stopPropagation(); onFocus(event.position, event.entityId); }}
                                    style={{ animationDelay: `${i * 50}ms`, padding: '0.32rem 0.38rem' }}
                                    className={`
              group cursor-pointer flex items-center gap-2 fluid-rounded
              bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-[#39AEA933] transition-all
              animate-in slide-in-from-left-4 fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
              ${event.type === 'DEATH' ? 'hover:border-red-900/40 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : ''}
              juice-interactive
            `}
                                >
                                    <div
                                        className="fluid-rounded-full shadow-[0_0_8px_currentColor]"
                                        style={{ color: event.color || (event.type === 'DEATH' ? '#ef4444' : '#E5EFC1'), width: '0.24rem', height: '1.15rem', flexShrink: 0 }}
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center" style={{ marginBottom: '0.08rem' }}>
                                            <span className={`text-[0.52rem] font-black tracking-[0.18em] uppercase ${event.type === 'DEATH' ? 'text-red-400' : 'text-[#39AEA9] opacity-80'} litho-text`}>
                                                {event.type}
                                            </span>
                                            <span className="text-[0.5rem] font-mono font-black text-[#A2D5AB] opacity-20 italic">
                                                {(event.timestamp / 30).toFixed(1)}d
                                            </span>
                                        </div>
                                        <div className="text-[0.62rem] font-medium text-[#E5EFC1] opacity-60 truncate leading-tight group-hover:opacity-100 transition-opacity" title={event.message}>
                                            {event.message}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="fluid-rounded" style={{ padding: '0.46rem 0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                No biosphere events recorded
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;
