import React, { useState } from 'react';
import Tooltip from './Tooltip';

interface Props {
    showMasterDebug: boolean;
    onToggleMasterDebug: (val: boolean) => void;
    showVision: boolean;
    onToggleVision: (val: boolean) => void;
    showHearing: boolean;
    onToggleHearing: (val: boolean) => void;
    showCommunication: boolean;
    onToggleCommunication: (val: boolean) => void;
    showGrid: boolean;
    onToggleGrid: (val: boolean) => void;
}

const DebugDropdown: React.FC<Props> = ({
    showMasterDebug, onToggleMasterDebug,
    showVision, onToggleVision,
    showHearing, onToggleHearing,
    showCommunication, onToggleCommunication,
    showGrid, onToggleGrid
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const Toggle = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
        <button
            onClick={onClick}
            className={`w-8 h-4 fluid-rounded-full relative transition-all duration-300 ${active ? 'bg-red-500 shadow-[0_0_10px_#ef444466]' : 'bg-white/5'}`}
        >
            <div className={`absolute top-0.5 left-0.5 w-3 h-3 fluid-rounded-full bg-white transition-all duration-300 ${active ? 'translate-x-4' : ''}`} />
        </button>
    );

    return (
        <Tooltip title="Diagnostic Overlay" content="View hidden simulation data, sensory ranges, and alignment grids." position="bottom">
            <div
                className="relative pointer-events-auto"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
            >
                <button
                    className="glass-modular fluid-p-sm fluid-rounded flex items-center justify-center transition-all"
                    style={{
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        background: showMasterDebug ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.05)',
                        boxShadow: isOpen || showMasterDebug ? '0 0 15px rgba(239, 68, 68, 0.2)' : 'none'
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                    </svg>
                </button>

                {isOpen && (
                    <div
                        className="absolute top-full right-0 glass-modular fluid-p-md fluid-rounded-md flex flex-col fluid-gap-sm animate-in slide-in-from-top-2 duration-200"
                        style={{
                            zIndex: 1001,
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            background: 'rgba(10, 5, 5, 0.95)',
                            minWidth: '220px',
                            marginTop: 'var(--fluid-space-sm)'
                        }}
                    >
                        <div className="flex items-center justify-between border-b border-red-500/10 pb-2 mb-1">
                            <span className="text-[var(--text-xs)] litho-text font-black uppercase tracking-[0.2em] text-red-500/60">Diagnostics</span>
                            <Toggle active={showMasterDebug} onClick={() => onToggleMasterDebug(!showMasterDebug)} />
                        </div>

                        <div className={`flex flex-col fluid-gap-sm transition-all duration-300 ${!showMasterDebug ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                            {/* Vision Toggle */}
                            <div className="flex items-center justify-between fluid-gap-md">
                                <span className="text-[var(--text-xs)] text-white/40 font-black uppercase tracking-widest flex items-center gap-2">👁️ Vision</span>
                                <Toggle active={showVision} onClick={() => onToggleVision(!showVision)} />
                            </div>

                            {/* Hearing Toggle */}
                            <div className="flex items-center justify-between fluid-gap-md">
                                <span className="text-[var(--text-xs)] text-white/40 font-black uppercase tracking-widest flex items-center gap-2">🔊 Audio</span>
                                <Toggle active={showHearing} onClick={() => onToggleHearing(!showHearing)} />
                            </div>

                            {/* Communication Toggle */}
                            <div className="flex items-center justify-between fluid-gap-md">
                                <span className="text-[var(--text-xs)] text-white/40 font-black uppercase tracking-widest flex items-center gap-2">🗣️ Social</span>
                                <Toggle active={showCommunication} onClick={() => onToggleCommunication(!showCommunication)} />
                            </div>

                            {/* Grid Toggle */}
                            <div className="flex items-center justify-between fluid-gap-md">
                                <span className="text-[var(--text-xs)] text-white/40 font-black uppercase tracking-widest flex items-center gap-2">📏 Grid</span>
                                <Toggle active={showGrid} onClick={() => onToggleGrid(!showGrid)} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Tooltip>
    );
};

export default DebugDropdown;
