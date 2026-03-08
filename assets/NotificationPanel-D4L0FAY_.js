const e=`import React from 'react';\r
import { SimEvent, Vector2 } from '../../types';\r
\r
interface Props {\r
    events: SimEvent[];\r
    onFocus: (position: Vector2, entityId?: string) => void;\r
    expanded: boolean;\r
    onToggleExpanded: () => void;\r
    position: Vector2;\r
    onPositionChange: (position: Vector2) => void;\r
}\r
\r
const NotificationPanel: React.FC<Props> = ({\r
    events,\r
    onFocus,\r
    expanded,\r
    onToggleExpanded,\r
    position,\r
    onPositionChange,\r
}) => {\r
    const [isDragging, setIsDragging] = React.useState(false);\r
\r
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {\r
        if ((e.target as HTMLElement).closest('button')) return;\r
        e.stopPropagation();\r
        setIsDragging(true);\r
        const startX = e.clientX;\r
        const startY = e.clientY;\r
        const startPos = { ...position };\r
\r
        const onMouseMove = (moveEvent: MouseEvent) => {\r
            onPositionChange({\r
                x: Math.max(10, Math.min(window.innerWidth - 280, startPos.x + (moveEvent.clientX - startX))),\r
                y: Math.max(10, Math.min(window.innerHeight - 70, startPos.y + (moveEvent.clientY - startY))),\r
            });\r
        };\r
\r
        const onMouseUp = () => {\r
            setIsDragging(false);\r
            window.removeEventListener('mousemove', onMouseMove);\r
            window.removeEventListener('mouseup', onMouseUp);\r
        };\r
\r
        window.addEventListener('mousemove', onMouseMove);\r
        window.addEventListener('mouseup', onMouseUp);\r
    };\r
\r
    return (\r
        <div\r
            className="hud-shell fluid-rounded-lg pointer-events-auto overflow-hidden"\r
            style={{\r
                position: 'fixed',\r
                left: \`\${position.x}px\`,\r
                top: \`\${position.y}px\`,\r
                width: '17.8rem',\r
                maxWidth: 'calc(100vw - 1rem)',\r
                border: '1px solid rgba(162, 213, 171, 0.1)',\r
                boxShadow: '0 18px 42px rgba(0,0,0,0.45)',\r
                cursor: isDragging ? 'grabbing' : 'default',\r
                zIndex: 950,\r
            }}\r
            onWheel={(e) => e.stopPropagation()}\r
        >\r
            <div\r
                onMouseDown={handleMouseDown}\r
                className="hud-header-strip flex items-center justify-between select-none"\r
                style={{\r
                    padding: '0.22rem 0.34rem',\r
                    cursor: 'grab',\r
                    gap: '0.35rem',\r
                }}\r
            >\r
                <h5\r
                    className="font-black litho-text uppercase"\r
                    style={{\r
                        margin: 0,\r
                        fontSize: '0.62rem',\r
                        lineHeight: 1,\r
                        letterSpacing: '0.14em',\r
                        color: '#E5EFC1',\r
                    }}\r
                >\r
                    Biosphere Log\r
                </h5>\r
                <button\r
                    type="button"\r
                    onClick={(e) => {\r
                        e.stopPropagation();\r
                        onToggleExpanded();\r
                    }}\r
                    className="fluid-rounded juice-interactive"\r
                    style={{\r
                        border: '1px solid rgba(57, 174, 169, 0.26)',\r
                        background: 'rgba(57, 174, 169, 0.08)',\r
                        color: '#39AEA9',\r
                        width: '1.35rem',\r
                        height: '1.2rem',\r
                        display: 'flex',\r
                        alignItems: 'center',\r
                        justifyContent: 'center',\r
                        padding: 0,\r
                        lineHeight: 1,\r
                    }}\r
                >\r
                    {expanded ? (\r
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>\r
                    ) : (\r
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>\r
                    )}\r
                </button>\r
            </div>\r
\r
            {expanded && (\r
                <div style={{ padding: '0.34rem 0.38rem 0.42rem' }}>\r
                    {events && events.length > 0 ? (\r
                        <div className="flex flex-col gap-1 max-h-[9rem] overflow-y-auto custom-scrollbar mask-gradient pr-1">\r
                            {events.slice(0, 5).map((event, i) => (\r
                                <div\r
                                    key={event.id}\r
                                    onClick={(e) => { e.stopPropagation(); onFocus(event.position, event.entityId); }}\r
                                    style={{ animationDelay: \`\${i * 50}ms\`, padding: '0.32rem 0.38rem' }}\r
                                    className={\`\r
              group cursor-pointer flex items-center gap-2 fluid-rounded\r
              bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-[#39AEA933] transition-all\r
              animate-in slide-in-from-left-4 fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]\r
              \${event.type === 'DEATH' ? 'hover:border-red-900/40 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : ''}\r
              juice-interactive\r
            \`}\r
                                >\r
                                    <div\r
                                        className="fluid-rounded-full shadow-[0_0_8px_currentColor]"\r
                                        style={{ color: event.color || (event.type === 'DEATH' ? '#ef4444' : '#E5EFC1'), width: '0.24rem', height: '1.15rem', flexShrink: 0 }}\r
                                    />\r
\r
                                    <div className="flex-1 min-w-0">\r
                                        <div className="flex justify-between items-center" style={{ marginBottom: '0.08rem' }}>\r
                                            <span className={\`text-[0.52rem] font-black tracking-[0.18em] uppercase \${event.type === 'DEATH' ? 'text-red-400' : 'text-[#39AEA9] opacity-80'} litho-text\`}>\r
                                                {event.type}\r
                                            </span>\r
                                            <span className="text-[0.5rem] font-mono font-black text-[#A2D5AB] opacity-20 italic">\r
                                                {(event.timestamp / 30).toFixed(1)}d\r
                                            </span>\r
                                        </div>\r
                                        <div className="text-[0.62rem] font-medium text-[#E5EFC1] opacity-60 truncate leading-tight group-hover:opacity-100 transition-opacity" title={event.message}>\r
                                            {event.message}\r
                                        </div>\r
                                    </div>\r
                                </div>\r
                            ))}\r
                        </div>\r
                    ) : (\r
                        <div className="fluid-rounded" style={{ padding: '0.46rem 0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>\r
                            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>\r
                                No biosphere events recorded\r
                            </div>\r
                        </div>\r
                    )}\r
                </div>\r
            )}\r
        </div>\r
    );\r
};\r
\r
export default NotificationPanel;\r
`;export{e as default};
