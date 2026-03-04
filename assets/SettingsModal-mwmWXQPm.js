const e=`import React from 'react';\r
import { ScaleUtils } from '../rendering/ScaleUtils';\r
import { VectorDB } from '../data/VectorDB';\r
\r
interface Props {\r
    show: boolean;\r
    onClose: () => void;\r
    guiScale: number;\r
    onGuiScaleChange: (val: number) => void;\r
    autoscaleEnabled: boolean;\r
    onAutoscaleToggle: () => void;\r
    onReset: () => void;\r
}\r
\r
const SettingsModal: React.FC<Props> = ({\r
    show, onClose, guiScale, onGuiScaleChange,\r
    autoscaleEnabled, onAutoscaleToggle, onReset\r
}) => {\r
    if (!show) return null;\r
\r
    return (\r
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto" onClick={onClose} onWheel={(e) => e.stopPropagation()}>\r
            <div className="glass-modular fluid-p-lg fluid-rounded w-[28rem] max-w-[90vw] animate-in zoom-in-95 duration-300 pointer-events-auto" onClick={e => e.stopPropagation()}>\r
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">\r
                    <h2 className="text-[var(--text-xl)] font-black flex items-center fluid-gap-sm text-white litho-text uppercase tracking-tighter">\r
                        <div className="fluid-p-sm bg-[#39AEA922] fluid-rounded-md text-[#39AEA9]">\r
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>\r
                        </div>\r
                        Config\r
                    </h2>\r
                    <button onClick={onClose} className="fluid-p-xs hover:bg-white/5 fluid-rounded text-white/20 hover:text-white transition-all">\r
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>\r
                    </button>\r
                </div>\r
\r
                <div className="space-y-[var(--fluid-space-lg)]">\r
                    <div className="space-y-[var(--fluid-space-sm)]">\r
                        <div className="flex justify-between items-center mb-1">\r
                            <span className="text-[var(--text-xs)] text-[#A2D5AB] opacity-50 font-black tracking-[0.3em] uppercase">Scale Offset</span>\r
                            <span className="text-[var(--text-sm)] font-mono font-black text-[#39AEA9] tabular-nums">{(guiScale * 100).toFixed(0)}%</span>\r
                        </div>\r
                        <input\r
                            type="range"\r
                            min={ScaleUtils.getScaleBounds(window.innerWidth).min}\r
                            max={ScaleUtils.getScaleBounds(window.innerWidth).max}\r
                            step="0.05"\r
                            value={guiScale}\r
                            onChange={(e) => onGuiScaleChange(parseFloat(e.target.value))}\r
                            disabled={autoscaleEnabled}\r
                            className={\`w-full accent-[#39AEA9] h-2 bg-white/5 fluid-rounded-full appearance-none cursor-pointer \${autoscaleEnabled ? 'opacity-20 cursor-not-allowed' : ''}\`}\r
                        />\r
\r
                        <div className="flex items-center justify-between pt-6 border-t border-white/5">\r
                            <div className="space-y-1">\r
                                <span className="text-[var(--text-base)] text-[#E5EFC1] font-black tracking-[0.1em] litho-text uppercase">Auto Scaling</span>\r
                                <p className="text-[var(--text-xs)] text-white/20 font-black tracking-widest uppercase italic leading-relaxed">\r
                                    {autoscaleEnabled ? 'Active' : 'Disabled'}\r
                                </p>\r
                            </div>\r
                            <button\r
                                onClick={onAutoscaleToggle}\r
                                className={\`w-12 h-6 fluid-rounded-full relative transition-all duration-300 \${autoscaleEnabled ? 'bg-[#39AEA9] shadow-[0_0_15px_#39AEA966]' : 'bg-white/5'}\`}\r
                            >\r
                                <div className={\`absolute top-1 left-1 w-4 h-4 fluid-rounded-full bg-white transition-all duration-300 \${autoscaleEnabled ? 'translate-x-6' : ''}\`} />\r
                            </button>\r
                        </div>\r
                    </div>\r
\r
                    <div className="pt-8 border-t border-white/5">\r
                        <div className="flex justify-between items-center mb-4">\r
                            <span className="text-[var(--text-xs)] text-[#39AEA9] opacity-50 font-black tracking-[0.3em] uppercase">Neural Oracle Configuration</span>\r
                        </div>\r
                        <div className="space-y-4">\r
                            <div className="flex flex-col gap-2">\r
                                <label className="text-[var(--text-xs)] text-[#E5EFC1] font-black uppercase tracking-widest opacity-60">Gemini API Key</label>\r
                                <input\r
                                    type="password"\r
                                    placeholder="Enter Oracle Key..."\r
                                    value={VectorDB.getSetting('gemini_api_key', '')}\r
                                    onChange={(e) => {\r
                                        VectorDB.setSetting('gemini_api_key', e.target.value);\r
                                    }}\r
                                    className="w-full bg-black/40 border border-white/10 rounded-md py-2 px-3 text-[var(--text-sm)] text-[#A2D5AB] focus:outline-none focus:border-[#39AEA9] transition-colors font-mono"\r
                                />\r
                                <p className="text-[10px] text-white/20 font-black uppercase tracking-tighter">Key is stored locally in the Biosphere Database.</p>\r
                            </div>\r
                        </div>\r
                    </div>\r
\r
                    <div className="pt-8 border-t border-white/5">\r
                        <button\r
                            onClick={onReset}\r
                            className="w-full fluid-py-md fluid-rounded border border-red-500/10 bg-red-500/[0.02] text-red-500 text-[var(--text-sm)] font-black tracking-[0.4em] uppercase hover:bg-red-600 hover:text-white transition-all active:scale-[0.98] shadow-sm"\r
                        >\r
                            Reset Engine\r
                        </button>\r
                    </div>\r
                </div>\r
\r
                <div className="mt-8 pt-6 border-t border-white/5 text-center">\r
                    <p className="text-[var(--text-xs)] text-white/10 font-black tracking-widest uppercase">Sector 7 OS v8.4.1</p>\r
                </div>\r
            </div>\r
        </div>\r
    );\r
};\r
\r
export default SettingsModal;\r
`;export{e as default};
