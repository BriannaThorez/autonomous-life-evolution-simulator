import React from 'react';
import { ScaleUtils } from '../src/rendering/ScaleUtils';

interface Props {
    show: boolean;
    onClose: () => void;
    guiScale: number;
    onGuiScaleChange: (val: number) => void;
    autoscaleEnabled: boolean;
    onAutoscaleToggle: () => void;
    onReset: () => void;
}

const SettingsModal: React.FC<Props> = ({
    show, onClose, guiScale, onGuiScaleChange,
    autoscaleEnabled, onAutoscaleToggle, onReset
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto" onClick={onClose} onWheel={(e) => e.stopPropagation()}>
            <div className="glass-modular fluid-p-lg fluid-rounded w-[28rem] max-w-[90vw] animate-in zoom-in-95 duration-300 pointer-events-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                    <h2 className="text-[var(--text-xl)] font-black flex items-center fluid-gap-sm text-white litho-text uppercase tracking-tighter">
                        <div className="fluid-p-sm bg-[#39AEA922] fluid-rounded-md text-[#39AEA9]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                        </div>
                        Config
                    </h2>
                    <button onClick={onClose} className="fluid-p-xs hover:bg-white/5 fluid-rounded text-white/20 hover:text-white transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="space-y-[var(--fluid-space-lg)]">
                    <div className="space-y-[var(--fluid-space-sm)]">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[var(--text-xs)] text-[#A2D5AB] opacity-50 font-black tracking-[0.3em] uppercase">Scale Offset</span>
                            <span className="text-[var(--text-sm)] font-mono font-black text-[#39AEA9] tabular-nums">{(guiScale * 100).toFixed(0)}%</span>
                        </div>
                        <input
                            type="range"
                            min={ScaleUtils.getScaleBounds(window.innerWidth).min}
                            max={ScaleUtils.getScaleBounds(window.innerWidth).max}
                            step="0.05"
                            value={guiScale}
                            onChange={(e) => onGuiScaleChange(parseFloat(e.target.value))}
                            disabled={autoscaleEnabled}
                            className={`w-full accent-[#39AEA9] h-2 bg-white/5 fluid-rounded-full appearance-none cursor-pointer ${autoscaleEnabled ? 'opacity-20 cursor-not-allowed' : ''}`}
                        />

                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <div className="space-y-1">
                                <span className="text-[var(--text-base)] text-[#E5EFC1] font-black tracking-[0.1em] litho-text uppercase">Auto Scaling</span>
                                <p className="text-[var(--text-xs)] text-white/20 font-black tracking-widest uppercase italic leading-relaxed">
                                    {autoscaleEnabled ? 'Active' : 'Disabled'}
                                </p>
                            </div>
                            <button
                                onClick={onAutoscaleToggle}
                                className={`w-12 h-6 fluid-rounded-full relative transition-all duration-300 ${autoscaleEnabled ? 'bg-[#39AEA9] shadow-[0_0_15px_#39AEA966]' : 'bg-white/5'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 fluid-rounded-full bg-white transition-all duration-300 ${autoscaleEnabled ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5">
                        <button
                            onClick={onReset}
                            className="w-full fluid-py-md fluid-rounded border border-red-500/10 bg-red-500/[0.02] text-red-500 text-[var(--text-sm)] font-black tracking-[0.4em] uppercase hover:bg-red-600 hover:text-white transition-all active:scale-[0.98] shadow-sm"
                        >
                            Reset Engine
                        </button>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-[var(--text-xs)] text-white/10 font-black tracking-widest uppercase">Sector 7 OS v8.4.1</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
