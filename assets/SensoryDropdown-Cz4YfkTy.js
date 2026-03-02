const e=`import React, { useState } from 'react';\r
import Tooltip from './Tooltip';\r
\r
interface Props {\r
    showMasterDebug: boolean;\r
    onToggleMasterDebug: (val: boolean) => void;\r
    showVision: boolean;\r
    onToggleVision: (val: boolean) => void;\r
    showHearing: boolean;\r
    onToggleHearing: (val: boolean) => void;\r
    showCommunication: boolean;\r
    onToggleCommunication: (val: boolean) => void;\r
    showGrid: boolean;\r
    onToggleGrid: (val: boolean) => void;\r
}\r
\r
const SensoryDropdown: React.FC<Props> = ({\r
    showMasterDebug, onToggleMasterDebug,\r
    showVision, onToggleVision,\r
    showHearing, onToggleHearing,\r
    showCommunication, onToggleCommunication,\r
    showGrid, onToggleGrid\r
}) => {\r
    const [isOpen, setIsOpen] = useState(false);\r
\r
    const Toggle = ({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: string }) => (\r
        <button\r
            onClick={onClick}\r
            className={\`w-full flex items-center justify-between p-2 rounded transition-all juice-interactive\r
                \${active ? 'bg-[#39AEA9]/20 border border-[#39AEA9]/40' : 'bg-white/5 border border-white/5 hover:bg-white/10'}\`}\r
        >\r
            <span className="text-[0.6rem] font-black uppercase tracking-widest text-[#E5EFC1] opacity-80 flex items-center gap-2">\r
                <span>{icon}</span> {label}\r
            </span>\r
            <div className={\`w-6 h-3 rounded-full relative transition-all duration-300 \${active ? 'bg-[#39AEA9] shadow-[0_0_8px_#39AEA9]' : 'bg-black/50'}\`}>\r
                <div className={\`absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-white transition-all duration-300 \${active ? 'translate-x-3' : ''}\`} />\r
            </div>\r
        </button>\r
    );\r
\r
    return (\r
        <Tooltip title="Sensory Overlays" content="Toggle global visibility of sensory radiuses. When OFF, senses only appear dynamically when an organism actively uses them." position="bottom">\r
            <div\r
                className="relative pointer-events-auto flex items-center h-full"\r
                onMouseEnter={() => setIsOpen(true)}\r
                onMouseLeave={() => setIsOpen(false)}\r
            >\r
                {/* Clean, un-bloated hover trigger button aligned with Registry */}\r
                <button\r
                    className="glass-modular rounded flex items-center justify-center transition-all h-full px-4"\r
                    style={{\r
                        paddingTop: '0.6rem', paddingBottom: '0.6rem',\r
                        border: '1px solid rgba(57, 174, 169, 0.4)',\r
                        background: showMasterDebug ? 'rgba(57, 174, 169, 0.15)' : 'rgba(57, 174, 169, 0.05)',\r
                        boxShadow: isOpen || showMasterDebug ? '0 0 15px rgba(57, 174, 169, 0.2)' : 'none'\r
                    }}\r
                >\r
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#39AEA9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">\r
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />\r
                    </svg>\r
                </button>\r
\r
                {isOpen && (\r
                    <div\r
                        className="absolute top-full right-0 glass-modular p-3 rounded-md flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200"\r
                        style={{\r
                            zIndex: 1001,\r
                            border: '1px solid rgba(57, 174, 169, 0.2)',\r
                            background: 'rgba(5, 5, 5, 0.95)',\r
                            minWidth: '200px',\r
                            marginTop: '0.5rem'\r
                        }}\r
                    >\r
                        <div className="flex items-center justify-between border-b border-[#39AEA9]/20 pb-2 mb-1">\r
                            <span className="text-[0.65rem] litho-text font-black uppercase tracking-[0.2em] text-[#39AEA9]">Global Override</span>\r
                            <div onClick={() => onToggleMasterDebug(!showMasterDebug)} className="cursor-pointer">\r
                                <div className={\`w-8 h-4 rounded-full relative transition-all duration-300 \${showMasterDebug ? 'bg-[#39AEA9] shadow-[0_0_10px_#39AEA988]' : 'bg-white/10'}\`}>\r
                                    <div className={\`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300 \${showMasterDebug ? 'translate-x-4' : ''}\`} />\r
                                </div>\r
                            </div>\r
                        </div>\r
\r
                        <div className={\`flex flex-col gap-1.5 transition-all duration-300 \${!showMasterDebug ? 'opacity-30 pointer-events-none grayscale' : ''}\`}>\r
                            <Toggle active={showVision} onClick={() => onToggleVision(!showVision)} label="Vision Cone" icon="👁️" />\r
                            <Toggle active={showHearing} onClick={() => onToggleHearing(!showHearing)} label="Audio Waves" icon="🔊" />\r
                            <Toggle active={showCommunication} onClick={() => onToggleCommunication(!showCommunication)} label="Social Ping" icon="🗣️" />\r
\r
                            <div className="h-px bg-white/5 my-1" />\r
                            <Toggle active={showGrid} onClick={() => onToggleGrid(!showGrid)} label="Metric Grid" icon="📏" />\r
                        </div>\r
                    </div>\r
                )}\r
            </div>\r
        </Tooltip>\r
    );\r
};\r
\r
export default SensoryDropdown;\r
`;export{e as default};
