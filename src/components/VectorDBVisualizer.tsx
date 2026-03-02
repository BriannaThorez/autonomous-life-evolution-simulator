import React, { useState, useEffect, useMemo } from 'react';
import { SIM_CONSTANTS, DEFAULT_TRAIT_RANGES, POPULATION_CONSTANTS } from '../core/Constants';
import { SimConfig as SimulationConfig, OrganismData as Organism, SimEvent as EvolutionaryEvent, TraitName } from '../../types';
import { VectorDB } from '../data/VectorDB';

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
        setAllOrganisms(VectorDB.getHistory());
        setAllEvents(VectorDB.getEvents());
    }, []);

    const filteredOrganisms = useMemo(() => {
        let list = [...allOrganisms];
        if (filterAlive) list = list.filter(o => (o as any).isAlive);
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

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-hidden pointer-events-auto select-auto"
            style={{ backgroundColor: 'rgb(2, 2, 2)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onWheel={(e) => e.stopPropagation()}
        >
            <div
                className="relative flex flex-col border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden"
                style={{
                    width: '98%',
                    height: '96%',
                    maxWidth: '1440px',
                    maxHeight: '900px',
                    background: '#080808',
                    borderRadius: '16px',
                    color: '#E5EFC1',
                    boxShadow: '0 0 0 1000px rgba(0,0,0,1)' // Absolute masking of simulation
                }}
            >
                {/* Header - Ultra Compact */}
                <header className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/60">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <h1 className="text-xs font-black uppercase tracking-tighter text-[#39AEA9]">Neural Registry <span className="text-white/20 ml-2">v9.2</span></h1>
                        </div>
                    </div>

                    <nav className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/5">
                        {(['REGISTRY', 'STATS', 'DEFINITION', 'DOCS', 'SYSTEM'] as ViewMode[]).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-4 py-1 rounded-md text-[8px] font-black uppercase transition-all ${viewMode === mode ? 'bg-[#39AEA9] text-black' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                            >
                                {mode}
                            </button>
                        ))}
                    </nav>

                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-red-500/20 flex items-center justify-center transition-all text-white/40 hover:text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </header>

                <main className="flex-1 flex overflow-hidden">
                    <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A]">
                        {/* Toolbar - Single Line */}
                        <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 bg-black/40">
                            <div className="flex items-center gap-2">
                                <span className="text-[7px] font-black uppercase opacity-30">Sort</span>
                                <select
                                    value={sortMetric}
                                    onChange={(e) => setSortMetric(e.target.value as SortMetric)}
                                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[8px] font-black uppercase text-white/50 outline-none hover:border-[#39AEA9]/40"
                                >
                                    <option value="generation">Generation</option>
                                    <option value="age">Age</option>
                                    <option value="energy">Energy</option>
                                    <option value="speed">Speed</option>
                                    <option value="size">Size</option>
                                </select>
                            </div>

                            <button
                                onClick={() => setFilterAlive(!filterAlive)}
                                className={`px-3 py-1 rounded border text-[8px] font-black uppercase transition-all ${filterAlive ? 'bg-[#39AEA9]/10 border-[#39AEA9] text-[#39AEA9]' : 'bg-white/5 border-white/10 text-white/20'}`}
                            >
                                {filterAlive ? 'Online Clusters' : 'Archives Only'}
                            </button>

                            <div className="h-4 w-px bg-white/5" />

                            <div className="text-[8px] font-black uppercase opacity-20 tracking-widest">
                                <span className="text-[#39AEA9] opacity-100">{filteredOrganisms.length}</span> Active Buffers Found
                            </div>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                            {viewMode === 'REGISTRY' && (
                                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                                    {filteredOrganisms.map(org => (
                                        <div
                                            key={org.id}
                                            onClick={() => setSelectedId(org.id)}
                                            className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${selectedId === org.id ? 'bg-[#39AEA9]/10 border-[#39AEA9] ring-1 ring-[#39AEA9]/20' : 'bg-white/[0.02] border-white/[0.03] hover:border-white/20 hover:bg-white/[0.04]'}`}
                                        >
                                            <div className="h-16 bg-black/40 rounded-lg flex items-center justify-center mb-3">
                                                <div
                                                    className="w-6 h-6 rounded-full"
                                                    style={{ backgroundColor: org.color, boxShadow: `0 0 15px ${org.color}33`, opacity: (org as any).isAlive ? 1 : 0.2 }}
                                                />
                                            </div>
                                            <h3 className="text-[9px] font-black uppercase truncate text-white/80 leading-none mb-1.5">{org.name}</h3>
                                            <div className="flex items-center justify-between text-[7px] font-black uppercase opacity-30 tracking-wider">
                                                <span>G.{org.generation}</span>
                                                <span className="text-[#39AEA9]">{org.surname}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {viewMode === 'STATS' && (
                                <div className="flex flex-col gap-px bg-white/5 border border-white/5 rounded-lg overflow-hidden">
                                    <div className="grid grid-cols-[1fr,60px,60px,60px] px-4 py-2 text-[7px] font-black uppercase opacity-30 bg-black/40">
                                        <span>Designation</span>
                                        <span className="text-center">Gen</span>
                                        <span className="text-center">Energy</span>
                                        <span className="text-right">Age</span>
                                    </div>
                                    {filteredOrganisms.map(org => (
                                        <div
                                            key={org.id}
                                            onClick={() => setSelectedId(org.id)}
                                            className={`grid grid-cols-[1fr,60px,60px,60px] px-4 py-2 items-center cursor-pointer transition-all ${selectedId === org.id ? 'bg-[#39AEA9]/20 text-white' : 'hover:bg-white/5 text-white/50 bg-[#0A0A0A]'}`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: org.color, opacity: (org as any).isAlive ? 1 : 0.3 }} />
                                                <span className="text-[9px] font-black uppercase truncate">{org.name}</span>
                                            </div>
                                            <span className="text-[8px] font-mono text-center">{org.generation}</span>
                                            <span className="text-[8px] font-mono text-center text-[#39AEA9]">{Math.round(org.energy)}</span>
                                            <span className="text-[8px] font-mono text-right opacity-30">{(org.age / 60).toFixed(1)}m</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {viewMode === 'DEFINITION' && (
                                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                                    {assets.filter(a => a.type === 'Flora_DEFINITION').map(asset => (
                                        <div key={asset.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                                            <h3 className="text-[10px] font-black uppercase text-white mb-1">{asset.data.title}</h3>
                                            <p className="text-[8px] opacity-30 italic mb-4 leading-normal">{asset.data.description}</p>
                                            <div className="p-2 bg-black/40 rounded-lg text-[8px] font-black uppercase flex justify-between">
                                                <span className="opacity-20">Base NRG</span>
                                                <span className="text-[#39AEA9]">+{asset.data.energyBase}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {viewMode === 'DOCS' && (
                                <div className="max-w-xl mx-auto py-8">
                                    {assets.filter(a => a.type === 'SYSTEM_DOC').map(doc => (
                                        <div key={doc.id} className="mb-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                            <h4 className="text-[9px] font-black uppercase text-[#39AEA9] mb-4 tracking-[0.2em]">{doc.data.title}</h4>
                                            <p className="text-[10px] leading-relaxed opacity-40 font-medium">{doc.data.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {viewMode === 'SYSTEM' && (
                                <div className="max-w-2xl mx-auto py-8 flex flex-col gap-10">
                                    <div className="grid grid-cols-2 gap-10">
                                        <div className="flex flex-col gap-6">
                                            <h2 className="text-xs font-black uppercase tracking-widest text-white/20 mb-4 border-b border-white/5 pb-2">Global Constraints</h2>
                                            <div className="flex flex-col gap-6">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex justify-between text-[8px] font-black uppercase opacity-40"><span>Target Population</span><span>{config.initialPopulation}</span></div>
                                                    <input type="range" min="1" max="250" value={config.initialPopulation} onChange={(e) => onUpdateConfig({ ...config, initialPopulation: parseInt(e.target.value) })} className="w-full accent-[#39AEA9] h-1 bg-white/5 rounded-full appearance-none cursor-pointer" />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex justify-between text-[8px] font-black uppercase opacity-40"><span>NRG Ceiling</span><span>{config.initialEnergy[1]}</span></div>
                                                    <input type="range" min="100" max="3000" step="50" value={config.initialEnergy[1]} onChange={(e) => onUpdateConfig({ ...config, initialEnergy: [config.initialEnergy[0], parseInt(e.target.value)] })} className="w-full accent-[#39AEA9] h-1 bg-white/5 rounded-full appearance-none cursor-pointer" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-black/60 border border-white/5">
                                            <h2 className="text-[8px] font-black uppercase tracking-[0.3em] opacity-20 mb-6">Genetic Hard-Caps</h2>
                                            <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto scrollbar-thin pr-2">
                                                {(Object.keys(DEFAULT_TRAIT_RANGES) as TraitName[]).map(trait => (
                                                    <div key={trait} className="flex flex-col gap-1.5">
                                                        <div className="flex justify-between text-[7px] font-black uppercase opacity-30"><span>{traitDisplayNames[trait]}</span><span>{config.traitRanges[trait][1].toFixed(1)}</span></div>
                                                        <input type="range" min="0.1" max="5.0" step="0.1" value={config.traitRanges[trait][1]} onChange={(e) => {
                                                            const nr = { ...config.traitRanges };
                                                            nr[trait] = [nr[trait][0], parseFloat(e.target.value)];
                                                            onUpdateConfig({ ...config, traitRanges: nr });
                                                        }} className="w-full h-0.5 accent-[#39AEA9] opacity-20 appearance-none cursor-pointer" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                                        <button onClick={() => { onHardReset(); setAllOrganisms([]); }} className="px-6 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] font-black uppercase hover:bg-red-500/20 transition-all">Clear Historical Buffer</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Inspector - Forced Width */}
                    {selectedId && selectedOrg && (
                        <aside className="w-[300px] shrink-0 border-l border-white/5 bg-[#080808] flex flex-col animate-slide-in-right overflow-hidden">
                            <div className="p-6 flex flex-col gap-6 overflow-y-auto scrollbar-thin">
                                <header className="relative mb-4">
                                    <div className="w-12 h-12 rounded-xl mb-4" style={{ backgroundColor: selectedOrg.color, boxShadow: `0 0 30px ${selectedOrg.color}44` }} />
                                    <h2 className="text-lg font-black uppercase leading-none text-white truncate">{selectedOrg.name}</h2>
                                    <p className="text-[8px] font-black uppercase text-[#39AEA9] mt-2 tracking-widest">{selectedOrg.surname} // GEN {selectedOrg.generation}</p>
                                </header>

                                <section>
                                    <h4 className="text-[7px] font-black uppercase opacity-20 tracking-widest mb-3">Genetic Blueprint</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(Object.keys(selectedOrg.expressedStats) as TraitName[]).map(trait => (
                                            <div key={trait} className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                                                <div className="text-[6px] font-black uppercase opacity-30 mb-1">{traitDisplayNames[trait]}</div>
                                                <div className="text-[10px] font-black font-mono text-white leading-none">{selectedOrg.expressedStats[trait].toFixed(2)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-[7px] font-black uppercase opacity-20 tracking-widest mb-3">Neural Memories</h4>
                                    <div className="flex flex-col gap-1.5">
                                        {selectedOrg.memories.slice(-5).reverse().map(mem => (
                                            <div key={mem.id} className="p-2 bg-black rounded border-l border-[#39AEA9]/40 text-[8px] leading-snug text-white/40 italic">"{mem.content}"</div>
                                        ))}
                                        {selectedOrg.memories.length === 0 && <div className="text-[8px] opacity-10 italic p-4 text-center border border-dashed border-white/5 rounded-lg">No memory buffers</div>}
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-[7px] font-black uppercase opacity-20 tracking-widest mb-3">Lineage History</h4>
                                    <div className="flex flex-col gap-2">
                                        {[selectedOrg.parentA_Id, selectedOrg.parentB_Id].filter(id => id).map((id, idx) => (
                                            <button key={id} onClick={() => setSelectedId(id!)} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] transition-all">
                                                <div className="w-1 h-1 rounded-full bg-[#39AEA9]" />
                                                <span className="text-[8px] font-black uppercase text-white/60">Progenitor {idx + 1}</span>
                                            </button>
                                        ))}
                                        {!selectedOrg.parentA_Id && <div className="text-[8px] opacity-20 italic">Primary Simulation Seed</div>}
                                    </div>
                                </section>

                                <div className="mt-8">
                                    <button onClick={() => setSelectedId(null)} className="w-full py-3 rounded-xl bg-white/5 border border-white/5 text-[8px] font-black uppercase text-white/20 hover:text-white hover:bg-white/10 transition-all">Defocus Entity</button>
                                </div>
                            </div>
                        </aside>
                    )}
                </main>
            </div>
        </div>
    );
};

export default VectorDBVisualizer;
