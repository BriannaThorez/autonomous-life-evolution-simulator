import React, { useState, useEffect, useMemo } from 'react';
import { SIM_CONSTANTS } from '../src/core/Constants';
import { SimConfig as SimulationConfig, OrganismData as Organism, SimEvent as EvolutionaryEvent, TraitName } from '../types';
import { DEFAULT_TRAIT_RANGES } from '../src/evolution/GeneticsEngine';
import { VectorDB } from '../src/data/VectorDB';

interface Props {
    config: SimulationConfig;
    onUpdateConfig: (newConfig: SimulationConfig) => void;
    onHardReset: () => void;
    onClose: () => void;
    initialSurnameFilter?: string | null;
    initialSelectedId?: string | null;
}

type ViewMode = 'REGISTRY' | 'STATS' | 'DEFINITION' | 'DOCS' | 'SYSTEM';
type SortMetric = 'generation' | 'age' | 'energy' | 'speed' | 'size';

const traitDisplayNames: Record<TraitName, string> = {
    speed: 'Max Speed',
    size: 'Mass Index',
    metabolism: 'Energy Drain',
    sight_range: 'Vision Range',
    sight_fov: 'Field of View',
    lifespan: 'Life Span',
    audible_range: 'Audible Range',
    communicating_range: 'Vocalization Range'
};

const VectorDBVisualizer: React.FC<Props> = ({ config, onUpdateConfig, onHardReset, onClose, initialSurnameFilter, initialSelectedId }) => {
    const [viewMode, setViewMode] = useState<ViewMode>(initialSelectedId || initialSurnameFilter ? 'REGISTRY' : 'SYSTEM');
    const [allOrganisms, setAllOrganisms] = useState<Organism[]>([]);
    const [allEvents, setAllEvents] = useState<EvolutionaryEvent[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);
    const [sortMetric, setSortMetric] = useState<SortMetric>('generation');
    const [filterAlive, setFilterAlive] = useState(true);
    const [filterSurname, setFilterSurname] = useState<string | null>(initialSurnameFilter || null);

    useEffect(() => {
        // Synchronize with VectorDB high-performance API
        setAllOrganisms(VectorDB.getHistory());
        setAllEvents(VectorDB.getEvents());
    }, []);

    const filteredOrganisms = useMemo(() => {
        let list = [...allOrganisms];
        if (filterAlive) list = list.filter(o => o.isAlive);
        if (filterSurname) list = list.filter(o => o.surname === filterSurname);

        return list.sort((a, b) => {
            if (sortMetric === 'generation') return b.generation - a.generation;
            if (sortMetric === 'age') return b.age - a.age;
            if (sortMetric === 'energy') return b.energy - a.energy;
            if (sortMetric === 'speed') return b.expressedStats.speed - a.expressedStats.speed;
            if (sortMetric === 'size') return b.expressedStats.size - a.expressedStats.size;
            return 0;
        });
    }, [allOrganisms, filterAlive, sortMetric, filterSurname]);

    const selectedOrg = useMemo(() =>
        allOrganisms.find(o => o.id === selectedId),
        [allOrganisms, selectedId]
    );

    const assets = VectorDB.getAssets();

    // Premium Palette Sync
    const colors = {
        bg: '#050505',
        text: '#E5EFC1',
        accent: '#39AEA9',
        muted: '#A2D5AB',
        blue: '#3b82f6',
        border: 'rgba(162, 213, 171, 0.1)'
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-3xl fluid-p-sm animate-fade-in overflow-hidden pointer-events-auto"
            style={{ background: 'rgba(0,0,0,0.85)' }}
            onWheel={(e) => e.stopPropagation()}
        >
            <div
                className="relative w-full h-full flex flex-col glass-modular overflow-hidden transition-all shadow-glow"
                style={{
                    width: '95vw', height: '90vh',
                    borderRadius: 'var(--fluid-radius-lg)',
                    boxShadow: '0 0 120px rgba(0,0,0,0.9)',
                    border: `1px solid ${colors.border}`
                }}
            >

                {/* Navigation Bar - Synchronized with Chronos Design */}
                <div
                    className="flex flex-col md:flex-row items-center justify-between fluid-p-sm fluid-gap-xs"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}
                >
                    <div className="flex items-center fluid-gap-sm">
                        <div
                            className="fluid-p-xs fluid-rounded-md"
                            style={{ background: `${colors.accent}22`, color: colors.accent }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>
                        <div>
                            <h1 className="text-[var(--text-lg)] font-black litho-text uppercase flex items-center" style={{ color: colors.text, letterSpacing: '-0.025em', gap: '8px' }}>
                                Biosphere <span style={{ opacity: 0.2, fontWeight: 300 }}>|</span> <span style={{ color: colors.accent }}>Registry</span>
                            </h1>
                            <div className="flex fluid-gap-md" style={{ marginTop: '2px' }}>
                                <span className="text-[0.6rem] tracking-widest font-black uppercase" style={{ color: colors.muted, opacity: 0.3, letterSpacing: '0.2em' }}>Vector Core v7.0</span>
                                <span className="text-[0.6rem] tracking-widest font-black uppercase animate-pulse" style={{ color: colors.accent, letterSpacing: '0.2em', opacity: 0.6 }}>Persistence: Active</span>
                            </div>
                        </div>
                    </div>

                    <div
                        className="flex fluid-rounded-md overflow-x-auto no-scrollbar"
                        style={{ background: 'rgba(0,0,0,0.4)', padding: '2px', border: `1px solid ${colors.border}` }}
                    >
                        {(['REGISTRY', 'STATS', 'DEFINITION', 'DOCS', 'SYSTEM'] as ViewMode[]).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className="fluid-px-md fluid-py-sm fluid-rounded text-[var(--text-xs)] font-black transition-all uppercase juice-interactive"
                                style={{
                                    letterSpacing: '0.1em', border: 'none', cursor: 'pointer',
                                    background: viewMode === mode ? `${colors.accent}22` : 'transparent',
                                    color: viewMode === mode ? colors.accent : colors.muted,
                                    opacity: viewMode === mode ? 1 : 0.4
                                }}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={onClose}
                        className="group fluid-p-md fluid-rounded-md transition-all juice-interactive"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: colors.muted }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Keep 'hidden' here to prevent the whole UI from scrolling */}
                    <div className="flex-1 relative overflow-hidden bg-radial-dark">

                        {/* Toolbar Overlay */}
                        <div
                            className="absolute z-10 flex fluid-gap-xs"
                            style={{ top: 'var(--fluid-space-sm)', left: 'var(--fluid-space-sm)' }}
                        >
                            <select
                                value={sortMetric}
                                onChange={(e) => setSortMetric(e.target.value as SortMetric)}
                                className="fluid-rounded-md fluid-px-lg fluid-py-sm text-[var(--text-xs)] font-black transition-all cursor-pointer uppercase no-select"
                                style={{
                                    background: 'rgba(0,0,0,0.85)', border: `1px solid ${colors.border}`,
                                    color: colors.muted, letterSpacing: '0.1em', outline: 'none'
                                }}
                            >
                                <option value="generation">Protocol: Generation</option>
                                <option value="age">Protocol: Age</option>
                                <option value="energy">Protocol: Energy</option>
                                <option value="speed">Protocol: Locomotion</option>
                                <option value="size">Protocol: Mass</option>
                            </select>

                            <button
                                onClick={() => setFilterAlive(!filterAlive)}
                                className="fluid-px-lg fluid-py-sm fluid-rounded-md text-[var(--text-xs)] font-black transition-all uppercase juice-interactive"
                                style={{
                                    letterSpacing: '0.1em', cursor: 'pointer',
                                    background: filterAlive ? `${colors.accent}11` : 'rgba(0,0,0,0.8)',
                                    border: filterAlive ? `1px solid ${colors.accent}` : `1px solid ${colors.border}`,
                                    color: filterAlive ? colors.accent : colors.muted
                                }}
                            >
                                {filterAlive ? 'Online Filter' : 'Archive Filter'}
                            </button>
                        </div>

                        {/* Replace overflow-y-auto (which can be finicky) with a clear auto style */}
                        <div
                            className="h-full overflow-y-auto custom-scrollbar fluid-p-md"
                            style={{ paddingTop: '5rem', height: '100%' }} // Ensure height is 100%
                        >
                            {viewMode === 'REGISTRY' && (
                                <div className="grid fluid-gap-sm" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                                    {filteredOrganisms.map(org => (
                                        <div
                                            key={org.id}
                                            onClick={() => setSelectedId(org.id)}
                                            className="group relative flex flex-col fluid-p-sm fluid-rounded transition-all cursor-pointer animate-fade-in juice-interactive"
                                            style={{
                                                background: selectedId === org.id ? `${colors.accent}11` : 'rgba(255,255,255,0.02)',
                                                border: selectedId === org.id ? `1px solid ${colors.accent}` : '1px solid rgba(255,255,255,0.05)',
                                                boxShadow: selectedId === org.id ? `0 0 30px ${colors.accent}33` : 'none'
                                            }}
                                        >
                                            <div
                                                className="relative flex items-center justify-center fluid-rounded overflow-hidden"
                                                style={{ height: '7rem', marginBottom: '0.75rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.03)' }}
                                            >
                                                <div
                                                    className="fluid-rounded-full transition-all duration-700"
                                                    style={{
                                                        width: '4rem', height: '4rem',
                                                        backgroundColor: org.color,
                                                        boxShadow: `0 0 40px ${org.color}33`,
                                                        opacity: org.isAlive ? 1 : 0.3,
                                                        transform: selectedId === org.id ? 'scale(1.1)' : 'scale(1)'
                                                    }}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="text-[var(--text-base)] font-black litho-text truncate uppercase" style={{ color: colors.text, letterSpacing: '-0.025em' }}>{org.name}</h3>
                                                    {!org.isAlive && <span className="text-[0.5rem] font-black uppercase px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: colors.muted }}>Archive</span>}
                                                </div>
                                                <div className="text-[0.6rem] font-black uppercase opacity-40 flex justify-between" style={{ color: colors.muted, letterSpacing: '0.1em' }}>
                                                    <span>GEN {org.generation}</span>
                                                    <span style={{ color: colors.accent }}>{org.surname}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {viewMode === 'STATS' && (
                                <div className="flex flex-col fluid-gap-xs">
                                    <div className="text-[var(--text-xs)] font-black uppercase opacity-40 mb-4" style={{ color: colors.muted, letterSpacing: '0.2em' }}>Metric Stream: {allOrganisms.length} Nodes</div>
                                    {filteredOrganisms.map(org => (
                                        <div
                                            key={org.id}
                                            onClick={() => setSelectedId(org.id)}
                                            className="group fluid-p-sm fluid-rounded transition-all cursor-pointer flex items-center justify-between"
                                            style={{
                                                background: selectedId === org.id ? `${colors.accent}11` : 'rgba(255,255,255,0.02)',
                                                border: selectedId === org.id ? `1px solid ${colors.accent}` : '1px solid rgba(255,255,255,0.03)'
                                            }}
                                        >
                                            <div className="flex items-center fluid-gap-sm">
                                                <div className="fluid-rounded" style={{ width: '2rem', height: '2rem', backgroundColor: org.color, opacity: org.isAlive ? 1 : 0.4 }} />
                                                <span className="text-[var(--text-sm)] font-black litho-text uppercase tracking-tight text-white">{org.name}</span>
                                            </div>
                                            <div className="flex fluid-gap-lg text-right">
                                                <div><div className="text-[0.55rem] font-black uppercase opacity-30">Gen</div><div className="text-[var(--text-xs)] font-black">{org.generation}</div></div>
                                                <div><div className="text-[0.55rem] font-black uppercase opacity-30">Energy</div><div className="text-[var(--text-xs)] font-black">{Math.round(org.energy)}</div></div>
                                                <div><div className="text-[0.55rem] font-black uppercase opacity-30">Age</div><div className="text-[var(--text-xs)] font-black">{(org.age / SIM_CONSTANTS.SECONDS_PER_DAY).toFixed(1)}d</div></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {viewMode === 'DEFINITION' && (
                                <div className="grid fluid-gap-md" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                    {assets.filter(a => a.type === 'Flora_DEFINITION').map(asset => (
                                        <div key={asset.id} className="glass-modular fluid-p-lg fluid-rounded flex flex-col items-center text-center group" style={{ border: `1px solid ${colors.border}` }}>
                                            <div className="fluid-rounded-full flex items-center justify-center shadow-glow transition-all group-hover:scale-110" style={{ width: '5rem', height: '5rem', background: `${colors.accent}11`, marginBottom: '1rem', color: colors.accent }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                                            </div>
                                            <h3 className="text-[var(--text-md)] font-black litho-text uppercase tracking-tight text-white">{asset.data.title}</h3>
                                            <p className="text-[var(--text-xs)] italic opacity-40 mb-4">{asset.data.description}</p>
                                            <div className="w-full fluid-p-xs fluid-rounded bg-black/40 border border-white/5 flex justify-between">
                                                <span className="text-[0.6rem] font-black uppercase opacity-60">Energy Yield</span>
                                                <span className="text-[0.6rem] font-black" style={{ color: colors.accent }}>+{asset.data.energyBase} E</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {viewMode === 'DOCS' && (
                                <div className="glass-modular fluid-p-lg fluid-rounded flex flex-col max-w-2xl mx-auto" style={{ border: `1px solid ${colors.border}` }}>
                                    <h2 className="text-[var(--text-lg)] font-black text-white uppercase tracking-tighter mb-8">Registry Protocol v7</h2>
                                    <div className="flex flex-col gap-8">
                                        {assets.filter(a => a.type === 'SYSTEM_DOC').map(doc => (
                                            <div key={doc.id} className="flex flex-col gap-2">
                                                <h4 className="text-[var(--text-xs)] font-black uppercase tracking-widest" style={{ color: colors.accent }}>{doc.data.title}</h4>
                                                <p className="text-[var(--text-sm)] leading-relaxed opacity-60">{doc.data.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {viewMode === 'SYSTEM' && (
                                <div className="glass-modular fluid-p-lg fluid-rounded max-w-3xl mx-auto" style={{ border: `1px solid ${colors.border}`, background: 'rgba(0,0,0,0.3)' }}>
                                    <div className="flex justify-between items-center mb-10">
                                        <div>
                                            <h2 className="text-[var(--text-lg)] font-black text-white uppercase tracking-tighter mb-1">Infrastructure Setup</h2>
                                            <p className="text-[var(--text-xs)] font-black uppercase opacity-40 tracking-widest">Base Config Layer</p>
                                        </div>
                                        <div className="flex fluid-gap-xs">
                                            <button onClick={() => onUpdateConfig({ ...config, traitRanges: { ...DEFAULT_TRAIT_RANGES }, initialPopulation: 40, initialEnergy: [400, 600] })} className="fluid-px-md fluid-py-xs fluid-rounded text-[0.65rem] font-black uppercase border border-white/10 text-white/40 hover:bg-white/5 transition-all">Restore Sync</button>
                                            <button
                                                onClick={() => {
                                                    onHardReset();
                                                    setAllOrganisms([]);
                                                    setAllEvents([]);
                                                    setSelectedId(null);
                                                }}
                                                className="fluid-px-md fluid-py-xs fluid-rounded text-[0.65rem] font-black uppercase bg-red-900/40 border border-red-500/30 text-red-200 shadow-glow shadow-red-500/10 transition-all hover:bg-red-500/20"
                                            >
                                                Purge & Reset
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-10">
                                        <div className="flex flex-col gap-6">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex justify-between text-[0.65rem] font-black uppercase opacity-40"><span>Initialization Density</span><span>{config.initialPopulation} Nodes</span></div>
                                                <input type="range" min="1" max="250" value={config.initialPopulation} onChange={(e) => onUpdateConfig({ ...config, initialPopulation: parseInt(e.target.value) })} className="w-full accent-[#39AEA9] h-1.5 bg-white/5 rounded-full" />
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex justify-between text-[0.65rem] font-black uppercase opacity-40"><span>Energy Priming</span><span>{config.initialEnergy[1]} Max E</span></div>
                                                <input type="range" min="100" max="3000" step="50" value={config.initialEnergy[1]} onChange={(e) => onUpdateConfig({ ...config, initialEnergy: [config.initialEnergy[0], parseInt(e.target.value)] })} className="w-full accent-[#39AEA9] h-1.5 bg-white/5 rounded-full" />
                                            </div>
                                        </div>
                                        <div className="bg-black/40 fluid-p-sm fluid-rounded border border-white/5 max-h-64 overflow-y-auto custom-scrollbar">
                                            <p className="text-[0.55rem] font-black uppercase opacity-20 mb-4 tracking-widest underline">Trait Ceiling Matrix</p>
                                            {(Object.keys(DEFAULT_TRAIT_RANGES) as TraitName[]).map(trait => (
                                                <div key={trait} className="mb-4">
                                                    <div className="flex justify-between text-[0.55rem] font-black uppercase mb-1"><span className="opacity-40">{traitDisplayNames[trait]}</span><span style={{ color: colors.accent }}>{config.traitRanges[trait][1].toFixed(2)}</span></div>
                                                    <input type="range" min="0.1" max="5.0" step="0.1" value={config.traitRanges[trait][1]} onChange={(e) => {
                                                        const nr = { ...config.traitRanges };
                                                        nr[trait] = [nr[trait][0], parseFloat(e.target.value)];
                                                        onUpdateConfig({ ...config, traitRanges: nr });
                                                    }} className="w-full h-1 accent-[#39AEA9] opacity-30" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Deep Inspector - Redesigned for High Fidelity */}
                    <div
                        className="flex flex-col overflow-hidden transition-all backdrop-blur-2xl"
                        style={{
                            width: selectedId ? '26rem' : '0',
                            opacity: selectedId ? 1 : 0,
                            background: 'rgba(5,5,5,0.7)',
                            borderLeft: selectedId ? `1px solid ${colors.border}` : 'none'
                        }}
                    >
                        {selectedOrg ? (
                            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar animate-slide-in-right">
                                <div className="fluid-p-lg" style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="fluid-rounded-md shadow-glow flex items-center justify-center relative" style={{ width: '5.5rem', height: '5.5rem', backgroundColor: selectedOrg.color, border: '2px solid rgba(255,255,255,0.1)' }}>
                                            {!selectedOrg.isAlive && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[0.5rem] font-black uppercase text-white/40">Extinct</div>}
                                            <div className="fluid-rounded-full w-12 h-12 bg-white/20 blur-md animate-pulse" />
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[0.55rem] font-black uppercase opacity-20 mb-1">Index Retrieval</div>
                                            <div className="text-[var(--text-xs)] font-black text-white/60 font-mono">{selectedOrg.id.slice(0, 16).toUpperCase()}</div>
                                        </div>
                                    </div>
                                    <h2 className="text-[var(--text-xl)] font-black text-white uppercase tracking-tighter leading-none mb-2">{selectedOrg.name}</h2>
                                    <p className="text-[0.6rem] font-black uppercase tracking-widest" style={{ color: colors.accent }}>{selectedOrg.surname} LINEAGE • GEN {selectedOrg.generation}</p>
                                </div>

                                <div className="fluid-p-lg flex flex-col gap-10">
                                    <div>
                                        <h4 className="text-[0.55rem] font-black uppercase tracking-widest opacity-20 mb-4">Functional Phenotypes</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(Object.keys(selectedOrg.expressedStats) as TraitName[]).map(trait => (
                                                <div key={trait} className="fluid-p-xs fluid-rounded bg-white/5 border border-white/5">
                                                    <div className="text-[0.5rem] font-black uppercase opacity-40 mb-1">{traitDisplayNames[trait]}</div>
                                                    <div className="text-[var(--text-sm)] font-black font-mono">{selectedOrg.expressedStats[trait].toFixed(2)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[0.55rem] font-black uppercase tracking-widest opacity-20 mb-4">Neural Buffer</h4>
                                        <div className="flex flex-col gap-1">
                                            {selectedOrg.memories.slice().reverse().map(mem => (
                                                <div key={mem.id} className="fluid-p-xs bg-black/40 border-l-2 border-[#39AEA9] text-[0.65rem] opacity-70 italic">{mem.content}</div>
                                            ))}
                                            {selectedOrg.memories.length === 0 && <div className="text-[0.6rem] opacity-20 italic">No imprints found</div>}
                                        </div>
                                    </div>

                                    <div className="mb-10">
                                        <h4 className="text-[0.55rem] font-black uppercase tracking-widest opacity-20 mb-4">Lineage Convergence</h4>
                                        <div className="flex flex-col gap-4">
                                            {[
                                                { id: selectedOrg.parentA_Id, label: 'Apex Source A', color: colors.accent },
                                                { id: selectedOrg.parentB_Id, label: 'Apex Source B', color: '#a855f7' }
                                            ].filter(p => p.id).map(p => (
                                                <div key={p.id} onClick={() => setSelectedId(p.id!)} className="flex items-center gap-3 group cursor-pointer">
                                                    <div className="w-1 h-8 transition-all group-hover:w-2" style={{ background: p.color }} />
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.5rem] font-black uppercase opacity-30">{p.label}</span>
                                                        <span className="text-[var(--text-xs)] font-black uppercase group-hover:text-[#39AEA9] transition-all">{allOrganisms.find(o => o.id === p.id)?.name || 'Ancestral Node'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto fluid-p-lg">
                                    <button onClick={() => setSelectedId(null)} className="w-full fluid-py-sm fluid-rounded border border-white/5 text-[0.6rem] font-black uppercase opacity-40 hover:opacity-100 hover:bg-white/5 transition-all tracking-widest">Defocus Entity</button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VectorDBVisualizer;
