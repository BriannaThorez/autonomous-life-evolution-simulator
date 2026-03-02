const e=`import React, { useState, useEffect, useMemo } from 'react';\r
import { SIM_CONSTANTS, DEFAULT_TRAIT_RANGES, POPULATION_CONSTANTS } from '../core/Constants';\r
import { SimConfig as SimulationConfig, OrganismData as Organism, SimEvent as EvolutionaryEvent, TraitName } from '../../types';\r
import { VectorDB } from '../data/VectorDB';\r
\r
interface Props {\r
    config: SimulationConfig;\r
    onUpdateConfig: (newConfig: SimulationConfig) => void;\r
    onHardReset: () => void;\r
    onClose: () => void;\r
    initialSurnameFilter?: string | null;\r
    initialSelectedId?: string | null;\r
}\r
\r
type ViewMode = 'REGISTRY' | 'STATS' | 'DEFINITION' | 'DOCS' | 'SYSTEM';\r
type SortMetric = 'generation' | 'age' | 'energy' | 'speed' | 'size';\r
\r
const traitDisplayNames: Record<TraitName, string> = {\r
    speed: 'Max Speed',\r
    size: 'Mass Index',\r
    metabolism: 'Energy Drain',\r
    sight_range: 'Vision Range',\r
    sight_fov: 'Field of View',\r
    lifespan: 'Life Span',\r
    audible_range: 'Audible Range',\r
    communicating_range: 'Vocalization Range'\r
};\r
\r
const VectorDBVisualizer: React.FC<Props> = ({ config, onUpdateConfig, onHardReset, onClose, initialSurnameFilter, initialSelectedId }) => {\r
    const [viewMode, setViewMode] = useState<ViewMode>(initialSelectedId || initialSurnameFilter ? 'REGISTRY' : 'SYSTEM');\r
    const [allOrganisms, setAllOrganisms] = useState<Organism[]>([]);\r
    const [allEvents, setAllEvents] = useState<EvolutionaryEvent[]>([]);\r
    const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);\r
    const [sortMetric, setSortMetric] = useState<SortMetric>('generation');\r
    const [filterAlive, setFilterAlive] = useState(true);\r
    const [filterSurname, setFilterSurname] = useState<string | null>(initialSurnameFilter || null);\r
\r
    useEffect(() => {\r
        setAllOrganisms(VectorDB.getHistory());\r
        setAllEvents(VectorDB.getEvents());\r
    }, []);\r
\r
    const filteredOrganisms = useMemo(() => {\r
        let list = [...allOrganisms];\r
        if (filterAlive) list = list.filter(o => (o as any).isAlive);\r
        if (filterSurname) list = list.filter(o => o.surname === filterSurname);\r
\r
        return list.sort((a, b) => {\r
            if (sortMetric === 'generation') return b.generation - a.generation;\r
            if (sortMetric === 'age') return b.age - a.age;\r
            if (sortMetric === 'energy') return b.energy - a.energy;\r
            if (sortMetric === 'speed') return b.expressedStats.speed - a.expressedStats.speed;\r
            if (sortMetric === 'size') return b.expressedStats.size - a.expressedStats.size;\r
            return 0;\r
        });\r
    }, [allOrganisms, filterAlive, sortMetric, filterSurname]);\r
\r
    const selectedOrg = useMemo(() =>\r
        allOrganisms.find(o => o.id === selectedId),\r
        [allOrganisms, selectedId]\r
    );\r
\r
    const assets = VectorDB.getAssets();\r
\r
    return (\r
        <div\r
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-hidden pointer-events-auto select-auto"\r
            style={{ backgroundColor: 'rgb(2, 2, 2)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}\r
            onWheel={(e) => e.stopPropagation()}\r
        >\r
            <div\r
                className="relative flex flex-col border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden"\r
                style={{\r
                    width: '98%',\r
                    height: '96%',\r
                    maxWidth: '1440px',\r
                    maxHeight: '900px',\r
                    background: '#080808',\r
                    borderRadius: '16px',\r
                    color: '#E5EFC1',\r
                    boxShadow: '0 0 0 1000px rgba(0,0,0,1)' // Absolute masking of simulation\r
                }}\r
            >\r
                {/* Header - Ultra Compact */}\r
                <header className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/60">\r
                    <div className="flex items-center gap-4">\r
                        <div className="flex flex-col">\r
                            <h1 className="text-xs font-black uppercase tracking-tighter text-[#39AEA9]">Neural Registry <span className="text-white/20 ml-2">v9.2</span></h1>\r
                        </div>\r
                    </div>\r
\r
                    <nav className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/5">\r
                        {(['REGISTRY', 'STATS', 'DEFINITION', 'DOCS', 'SYSTEM'] as ViewMode[]).map(mode => (\r
                            <button\r
                                key={mode}\r
                                onClick={() => setViewMode(mode)}\r
                                className={\`px-4 py-1 rounded-md text-[8px] font-black uppercase transition-all \${viewMode === mode ? 'bg-[#39AEA9] text-black' : 'text-white/30 hover:text-white hover:bg-white/5'}\`}\r
                            >\r
                                {mode}\r
                            </button>\r
                        ))}\r
                    </nav>\r
\r
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-red-500/20 flex items-center justify-center transition-all text-white/40 hover:text-red-500">\r
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>\r
                    </button>\r
                </header>\r
\r
                <main className="flex-1 flex overflow-hidden">\r
                    <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A]">\r
                        {/* Toolbar - Single Line */}\r
                        <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 bg-black/40">\r
                            <div className="flex items-center gap-2">\r
                                <span className="text-[7px] font-black uppercase opacity-30">Sort</span>\r
                                <select\r
                                    value={sortMetric}\r
                                    onChange={(e) => setSortMetric(e.target.value as SortMetric)}\r
                                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[8px] font-black uppercase text-white/50 outline-none hover:border-[#39AEA9]/40"\r
                                >\r
                                    <option value="generation">Generation</option>\r
                                    <option value="age">Age</option>\r
                                    <option value="energy">Energy</option>\r
                                    <option value="speed">Speed</option>\r
                                    <option value="size">Size</option>\r
                                </select>\r
                            </div>\r
\r
                            <button\r
                                onClick={() => setFilterAlive(!filterAlive)}\r
                                className={\`px-3 py-1 rounded border text-[8px] font-black uppercase transition-all \${filterAlive ? 'bg-[#39AEA9]/10 border-[#39AEA9] text-[#39AEA9]' : 'bg-white/5 border-white/10 text-white/20'}\`}\r
                            >\r
                                {filterAlive ? 'Online Clusters' : 'Archives Only'}\r
                            </button>\r
\r
                            <div className="h-4 w-px bg-white/5" />\r
\r
                            <div className="text-[8px] font-black uppercase opacity-20 tracking-widest">\r
                                <span className="text-[#39AEA9] opacity-100">{filteredOrganisms.length}</span> Active Buffers Found\r
                            </div>\r
                        </div>\r
\r
                        {/* List Area */}\r
                        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">\r
                            {viewMode === 'REGISTRY' && (\r
                                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>\r
                                    {filteredOrganisms.map(org => (\r
                                        <div\r
                                            key={org.id}\r
                                            onClick={() => setSelectedId(org.id)}\r
                                            className={\`group relative p-3 rounded-xl border transition-all cursor-pointer \${selectedId === org.id ? 'bg-[#39AEA9]/10 border-[#39AEA9] ring-1 ring-[#39AEA9]/20' : 'bg-white/[0.02] border-white/[0.03] hover:border-white/20 hover:bg-white/[0.04]'}\`}\r
                                        >\r
                                            <div className="h-16 bg-black/40 rounded-lg flex items-center justify-center mb-3">\r
                                                <div\r
                                                    className="w-6 h-6 rounded-full"\r
                                                    style={{ backgroundColor: org.color, boxShadow: \`0 0 15px \${org.color}33\`, opacity: (org as any).isAlive ? 1 : 0.2 }}\r
                                                />\r
                                            </div>\r
                                            <h3 className="text-[9px] font-black uppercase truncate text-white/80 leading-none mb-1.5">{org.name}</h3>\r
                                            <div className="flex items-center justify-between text-[7px] font-black uppercase opacity-30 tracking-wider">\r
                                                <span>G.{org.generation}</span>\r
                                                <span className="text-[#39AEA9]">{org.surname}</span>\r
                                            </div>\r
                                        </div>\r
                                    ))}\r
                                </div>\r
                            )}\r
\r
                            {viewMode === 'STATS' && (\r
                                <div className="flex flex-col gap-px bg-white/5 border border-white/5 rounded-lg overflow-hidden">\r
                                    <div className="grid grid-cols-[1fr,60px,60px,60px] px-4 py-2 text-[7px] font-black uppercase opacity-30 bg-black/40">\r
                                        <span>Designation</span>\r
                                        <span className="text-center">Gen</span>\r
                                        <span className="text-center">Energy</span>\r
                                        <span className="text-right">Age</span>\r
                                    </div>\r
                                    {filteredOrganisms.map(org => (\r
                                        <div\r
                                            key={org.id}\r
                                            onClick={() => setSelectedId(org.id)}\r
                                            className={\`grid grid-cols-[1fr,60px,60px,60px] px-4 py-2 items-center cursor-pointer transition-all \${selectedId === org.id ? 'bg-[#39AEA9]/20 text-white' : 'hover:bg-white/5 text-white/50 bg-[#0A0A0A]'}\`}\r
                                        >\r
                                            <div className="flex items-center gap-3 min-w-0">\r
                                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: org.color, opacity: (org as any).isAlive ? 1 : 0.3 }} />\r
                                                <span className="text-[9px] font-black uppercase truncate">{org.name}</span>\r
                                            </div>\r
                                            <span className="text-[8px] font-mono text-center">{org.generation}</span>\r
                                            <span className="text-[8px] font-mono text-center text-[#39AEA9]">{Math.round(org.energy)}</span>\r
                                            <span className="text-[8px] font-mono text-right opacity-30">{(org.age / 60).toFixed(1)}m</span>\r
                                        </div>\r
                                    ))}\r
                                </div>\r
                            )}\r
\r
                            {viewMode === 'DEFINITION' && (\r
                                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>\r
                                    {assets.filter(a => a.type === 'Flora_DEFINITION').map(asset => (\r
                                        <div key={asset.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all">\r
                                            <h3 className="text-[10px] font-black uppercase text-white mb-1">{asset.data.title}</h3>\r
                                            <p className="text-[8px] opacity-30 italic mb-4 leading-normal">{asset.data.description}</p>\r
                                            <div className="p-2 bg-black/40 rounded-lg text-[8px] font-black uppercase flex justify-between">\r
                                                <span className="opacity-20">Base NRG</span>\r
                                                <span className="text-[#39AEA9]">+{asset.data.energyBase}</span>\r
                                            </div>\r
                                        </div>\r
                                    ))}\r
                                </div>\r
                            )}\r
\r
                            {viewMode === 'DOCS' && (\r
                                <div className="max-w-xl mx-auto py-8">\r
                                    {assets.filter(a => a.type === 'SYSTEM_DOC').map(doc => (\r
                                        <div key={doc.id} className="mb-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">\r
                                            <h4 className="text-[9px] font-black uppercase text-[#39AEA9] mb-4 tracking-[0.2em]">{doc.data.title}</h4>\r
                                            <p className="text-[10px] leading-relaxed opacity-40 font-medium">{doc.data.content}</p>\r
                                        </div>\r
                                    ))}\r
                                </div>\r
                            )}\r
\r
                            {viewMode === 'SYSTEM' && (\r
                                <div className="max-w-2xl mx-auto py-8 flex flex-col gap-10">\r
                                    <div className="grid grid-cols-2 gap-10">\r
                                        <div className="flex flex-col gap-6">\r
                                            <h2 className="text-xs font-black uppercase tracking-widest text-white/20 mb-4 border-b border-white/5 pb-2">Global Constraints</h2>\r
                                            <div className="flex flex-col gap-6">\r
                                                <div className="flex flex-col gap-2">\r
                                                    <div className="flex justify-between text-[8px] font-black uppercase opacity-40"><span>Target Population</span><span>{config.initialPopulation}</span></div>\r
                                                    <input type="range" min="1" max="250" value={config.initialPopulation} onChange={(e) => onUpdateConfig({ ...config, initialPopulation: parseInt(e.target.value) })} className="w-full accent-[#39AEA9] h-1 bg-white/5 rounded-full appearance-none cursor-pointer" />\r
                                                </div>\r
                                                <div className="flex flex-col gap-2">\r
                                                    <div className="flex justify-between text-[8px] font-black uppercase opacity-40"><span>NRG Ceiling</span><span>{config.initialEnergy[1]}</span></div>\r
                                                    <input type="range" min="100" max="3000" step="50" value={config.initialEnergy[1]} onChange={(e) => onUpdateConfig({ ...config, initialEnergy: [config.initialEnergy[0], parseInt(e.target.value)] })} className="w-full accent-[#39AEA9] h-1 bg-white/5 rounded-full appearance-none cursor-pointer" />\r
                                                </div>\r
                                            </div>\r
                                        </div>\r
                                        <div className="p-5 rounded-2xl bg-black/60 border border-white/5">\r
                                            <h2 className="text-[8px] font-black uppercase tracking-[0.3em] opacity-20 mb-6">Genetic Hard-Caps</h2>\r
                                            <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto scrollbar-thin pr-2">\r
                                                {(Object.keys(DEFAULT_TRAIT_RANGES) as TraitName[]).map(trait => (\r
                                                    <div key={trait} className="flex flex-col gap-1.5">\r
                                                        <div className="flex justify-between text-[7px] font-black uppercase opacity-30"><span>{traitDisplayNames[trait]}</span><span>{config.traitRanges[trait][1].toFixed(1)}</span></div>\r
                                                        <input type="range" min="0.1" max="5.0" step="0.1" value={config.traitRanges[trait][1]} onChange={(e) => {\r
                                                            const nr = { ...config.traitRanges };\r
                                                            nr[trait] = [nr[trait][0], parseFloat(e.target.value)];\r
                                                            onUpdateConfig({ ...config, traitRanges: nr });\r
                                                        }} className="w-full h-0.5 accent-[#39AEA9] opacity-20 appearance-none cursor-pointer" />\r
                                                    </div>\r
                                                ))}\r
                                            </div>\r
                                        </div>\r
                                    </div>\r
                                    <div className="flex justify-end gap-3 pt-6 border-t border-white/5">\r
                                        <button onClick={() => { onHardReset(); setAllOrganisms([]); }} className="px-6 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] font-black uppercase hover:bg-red-500/20 transition-all">Clear Historical Buffer</button>\r
                                    </div>\r
                                </div>\r
                            )}\r
                        </div>\r
                    </div>\r
\r
                    {/* Inspector - Forced Width */}\r
                    {selectedId && selectedOrg && (\r
                        <aside className="w-[300px] shrink-0 border-l border-white/5 bg-[#080808] flex flex-col animate-slide-in-right overflow-hidden">\r
                            <div className="p-6 flex flex-col gap-6 overflow-y-auto scrollbar-thin">\r
                                <header className="relative mb-4">\r
                                    <div className="w-12 h-12 rounded-xl mb-4" style={{ backgroundColor: selectedOrg.color, boxShadow: \`0 0 30px \${selectedOrg.color}44\` }} />\r
                                    <h2 className="text-lg font-black uppercase leading-none text-white truncate">{selectedOrg.name}</h2>\r
                                    <p className="text-[8px] font-black uppercase text-[#39AEA9] mt-2 tracking-widest">{selectedOrg.surname} // GEN {selectedOrg.generation}</p>\r
                                </header>\r
\r
                                <section>\r
                                    <h4 className="text-[7px] font-black uppercase opacity-20 tracking-widest mb-3">Genetic Blueprint</h4>\r
                                    <div className="grid grid-cols-2 gap-2">\r
                                        {(Object.keys(selectedOrg.expressedStats) as TraitName[]).map(trait => (\r
                                            <div key={trait} className="p-2 rounded-lg bg-white/[0.03] border border-white/5">\r
                                                <div className="text-[6px] font-black uppercase opacity-30 mb-1">{traitDisplayNames[trait]}</div>\r
                                                <div className="text-[10px] font-black font-mono text-white leading-none">{selectedOrg.expressedStats[trait].toFixed(2)}</div>\r
                                            </div>\r
                                        ))}\r
                                    </div>\r
                                </section>\r
\r
                                <section>\r
                                    <h4 className="text-[7px] font-black uppercase opacity-20 tracking-widest mb-3">Neural Memories</h4>\r
                                    <div className="flex flex-col gap-1.5">\r
                                        {selectedOrg.memories.slice(-5).reverse().map(mem => (\r
                                            <div key={mem.id} className="p-2 bg-black rounded border-l border-[#39AEA9]/40 text-[8px] leading-snug text-white/40 italic">"{mem.content}"</div>\r
                                        ))}\r
                                        {selectedOrg.memories.length === 0 && <div className="text-[8px] opacity-10 italic p-4 text-center border border-dashed border-white/5 rounded-lg">No memory buffers</div>}\r
                                    </div>\r
                                </section>\r
\r
                                <section>\r
                                    <h4 className="text-[7px] font-black uppercase opacity-20 tracking-widest mb-3">Lineage History</h4>\r
                                    <div className="flex flex-col gap-2">\r
                                        {[selectedOrg.parentA_Id, selectedOrg.parentB_Id].filter(id => id).map((id, idx) => (\r
                                            <button key={id} onClick={() => setSelectedId(id!)} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] transition-all">\r
                                                <div className="w-1 h-1 rounded-full bg-[#39AEA9]" />\r
                                                <span className="text-[8px] font-black uppercase text-white/60">Progenitor {idx + 1}</span>\r
                                            </button>\r
                                        ))}\r
                                        {!selectedOrg.parentA_Id && <div className="text-[8px] opacity-20 italic">Primary Simulation Seed</div>}\r
                                    </div>\r
                                </section>\r
\r
                                <div className="mt-8">\r
                                    <button onClick={() => setSelectedId(null)} className="w-full py-3 rounded-xl bg-white/5 border border-white/5 text-[8px] font-black uppercase text-white/20 hover:text-white hover:bg-white/10 transition-all">Defocus Entity</button>\r
                                </div>\r
                            </div>\r
                        </aside>\r
                    )}\r
                </main>\r
            </div>\r
        </div>\r
    );\r
};\r
\r
export default VectorDBVisualizer;\r
`;export{e as default};
