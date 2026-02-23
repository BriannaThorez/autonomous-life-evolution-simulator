import React from 'react';

interface Props {
    show: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ResetModal: React.FC<Props> = ({ show, onConfirm, onCancel }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto">
            <div className="glass-modular fluid-p-lg fluid-rounded w-[26rem] max-w-[90vw] text-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-[1.25rem] bg-red-500/20 flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 9-6 6" /><path d="m9 9 6 6" /><circle cx="12" cy="12" r="10" /></svg>
                </div>
                <h3 className="text-[var(--text-xl)] font-black text-white mb-4 litho-text uppercase tracking-tighter">Annihilation Matrix</h3>
                <p className="text-[var(--text-sm)] text-white/40 mb-10 leading-relaxed italic font-medium">"Are you certain? All evolutionary progress, genomes, and history will be purged from existence."</p>
                <div className="flex gap-[var(--fluid-space-sm)]">
                    <button onClick={onCancel} className="flex-1 py-4 fluid-rounded border border-white/5 bg-white/5 text-[var(--text-sm)] font-black tracking-[0.3em] uppercase text-[#A2D5AB] hover:bg-white/10 transition-all">Abort</button>
                    <button onClick={onConfirm} className="flex-1 py-4 fluid-rounded bg-red-600 text-white text-[var(--text-sm)] font-black tracking-[0.3em] uppercase shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:bg-red-700 transition-all active:scale-[0.95]">Confirm Purge</button>
                </div>
            </div>
        </div>
    );
};

export default ResetModal;
