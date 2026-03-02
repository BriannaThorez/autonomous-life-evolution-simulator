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

const SensoryDropdown: React.FC<Props> = ({
    showMasterDebug, onToggleMasterDebug,
    showVision, onToggleVision,
    showHearing, onToggleHearing,
    showCommunication, onToggleCommunication,
    showGrid, onToggleGrid
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const Toggle = ({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: string }) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between p-2 rounded transition-all juice-interactive
                ${active ? 'bg-[#39AEA9]/20 border border-[#39AEA9]/40' : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}
        >
            <span className="text-[0.6rem] font-black uppercase tracking-widest text-[#E5EFC1] opacity-80 flex items-center gap-2">
                <span>{icon}</span> {label}
            </span>
            <div className={`w-6 h-3 rounded-full relative transition-all duration-300 ${active ? 'bg-[#39AEA9] shadow-[0_0_8px_#39AEA9]' : 'bg-black/50'}`}>
                <div className={`absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-white transition-all duration-300 ${active ? 'translate-x-3' : ''}`} />
            </div>
        </button>
    );

    return (
        <Tooltip title="Sensory Overlays" content="Toggle global visibility of sensory radiuses. When OFF, senses only appear dynamically when an organism actively uses them." position="bottom">
            <div
                className="relative pointer-events-auto flex items-center h-full"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
            >
                {/* Clean, un-bloated hover trigger button aligned with Registry */}
                <button
                    className="glass-modular rounded flex items-center justify-center transition-all h-full px-4"
                    style={{
                        paddingTop: '0.6rem', paddingBottom: '0.6rem',
                        border: '1px solid rgba(57, 174, 169, 0.4)',
                        background: showMasterDebug ? 'rgba(57, 174, 169, 0.15)' : 'rgba(57, 174, 169, 0.05)',
                        boxShadow: isOpen || showMasterDebug ? '0 0 15px rgba(57, 174, 169, 0.2)' : 'none'
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#39AEA9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                </button>

                {isOpen && (
                    <div
                        className="absolute top-full right-0 glass-modular p-3 rounded-md flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200"
                        style={{
                            zIndex: 1001,
                            border: '1px solid rgba(57, 174, 169, 0.2)',
                            background: 'rgba(5, 5, 5, 0.95)',
                            minWidth: '200px',
                            marginTop: '0.5rem'
                        }}
                    >
                        <div className="flex items-center justify-between border-b border-[#39AEA9]/20 pb-2 mb-1">
                            <span className="text-[0.65rem] litho-text font-black uppercase tracking-[0.2em] text-[#39AEA9]">Global Override</span>
                            <div onClick={() => onToggleMasterDebug(!showMasterDebug)} className="cursor-pointer">
                                <div className={`w-8 h-4 rounded-full relative transition-all duration-300 ${showMasterDebug ? 'bg-[#39AEA9] shadow-[0_0_10px_#39AEA988]' : 'bg-white/10'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300 ${showMasterDebug ? 'translate-x-4' : ''}`} />
                                </div>
                            </div>
                        </div>

                        <div className={`flex flex-col gap-1.5 transition-all duration-300 ${!showMasterDebug ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                            <Toggle active={showVision} onClick={() => onToggleVision(!showVision)} label="Vision Cone" icon="👁️" />
                            <Toggle active={showHearing} onClick={() => onToggleHearing(!showHearing)} label="Audio Waves" icon="🔊" />
                            <Toggle active={showCommunication} onClick={() => onToggleCommunication(!showCommunication)} label="Social Ping" icon="🗣️" />

                            <div className="h-px bg-white/5 my-1" />
                            <Toggle active={showGrid} onClick={() => onToggleGrid(!showGrid)} label="Metric Grid" icon="📏" />
                        </div>
                    </div>
                )}
            </div>
        </Tooltip>
    );
};

export default SensoryDropdown;
