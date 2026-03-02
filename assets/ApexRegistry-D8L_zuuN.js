const r=`import React from 'react';\r
import { SimulationState } from '../../types';\r
import Tooltip from './Tooltip';\r
\r
interface Props {\r
    simState: SimulationState;\r
    selectedId: string | null;\r
    onSelect: (id: string | null) => void;\r
    onFocus?: (id: string) => void;\r
    expanded: boolean;\r
    onToggle: () => void;\r
    sort: 'LINEAGE' | 'ENERGY' | 'AGE';\r
    onSortChange: (sort: 'LINEAGE' | 'ENERGY' | 'AGE') => void;\r
}\r
\r
const ApexRegistry: React.FC<Props> = ({ simState, selectedId, onSelect, onFocus, expanded, onToggle, sort, onSortChange }) => {\r
    return (\r
        <Tooltip title="Apex Protocols" content="Real-time monitoring of the most successful biological entities based on lineage, energy efficiency, and survival duration." position="right">\r
            <div\r
                className="glass-modular fluid-p-sm fluid-rounded flex flex-col pointer-events-auto transition-all"\r
                style={{\r
                    minWidth: '20rem',\r
                    width: 'fit-content',\r
                    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',\r
                    border: '1px solid rgba(162, 213, 171, 0.1)'\r
                }}\r
                onWheel={(e) => e.stopPropagation()}\r
            >\r
                {/* Header */}\r
                <div\r
                    className="flex items-center justify-between group select-none cursor-pointer"\r
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 'var(--fluid-space-sm)' }}\r
                    onClick={onToggle}\r
                >\r
                    <div className="flex flex-col">\r
                        <h4 className="text-[var(--text-sm)] font-black litho-text uppercase transition-all group-hover-text-accent" style={{ letterSpacing: '0.2em', color: '#E5EFC1' }}>\r
                            Apex Registry\r
                        </h4>\r
                        <span className="opacity-40 uppercase font-bold" style={{ fontSize: '0.55rem', color: '#A2D5AB', letterSpacing: '0.15em' }}>\r
                            Tracking Top 5 Entities\r
                        </span>\r
                    </div>\r
\r
                    <div className="transition-all opacity-40" style={{ color: '#39AEA9' }}>\r
                        <div className="group-hover-visible" style={{ opacity: 0.4 }}>\r
                            {expanded ? (\r
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>\r
                            ) : (\r
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>\r
                            )}\r
                        </div>\r
                    </div>\r
                </div>\r
\r
                {expanded && (\r
                    <div className="animate-fade-in" style={{ paddingTop: '0.5rem' }}>\r
                        {/* Sort Control */}\r
                        <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>\r
                            <span className="opacity-40 uppercase font-black" style={{ fontSize: '0.6rem', color: '#A2D5AB', letterSpacing: '0.1em' }}>Sort Protocol</span>\r
                            <div className="relative group">\r
                                <button\r
                                    className="fluid-px-sm fluid-rounded transition-all flex items-center juice-interactive"\r
                                    style={{\r
                                        fontSize: '0.6rem', fontWeight: 900, color: '#39AEA9',\r
                                        textTransform: 'uppercase', letterSpacing: '0.1em',\r
                                        border: '1px solid rgba(57, 174, 169, 0.27)', background: 'rgba(0,0,0,0.2)',\r
                                        paddingTop: '4px', paddingBottom: '4px', gap: '4px'\r
                                    }}\r
                                >\r
                                    {sort} <span style={{ fontSize: '0.5rem', opacity: 0.5 }}>▼</span>\r
                                </button>\r
\r
                                {/* Dropdown */}\r
                                <div\r
                                    className="absolute transition-all group-hover-visible shadow-glow"\r
                                    style={{\r
                                        top: '100%', right: 0, marginTop: '4px', width: '12rem',\r
                                        background: 'rgba(0,0,0,0.95)', border: '1px solid rgba(57, 174, 169, 0.27)',\r
                                        borderRadius: 'var(--fluid-radius)', zIndex: 100, padding: '4px',\r
                                        backdropFilter: 'blur(32px) saturate(200%)', visibility: 'hidden', opacity: 0\r
                                    }}\r
                                >\r
                                    {[\r
                                        { id: 'LINEAGE', label: 'Longest Lineage' },\r
                                        { id: 'ENERGY', label: 'Highest Energy' },\r
                                        { id: 'AGE', label: 'Oldest Living' }\r
                                    ].map(s => (\r
                                        <button\r
                                            key={s.id}\r
                                            onClick={() => onSortChange(s.id as any)}\r
                                            className="w-full text-left fluid-px-md fluid-py-xs fluid-rounded transition-all uppercase"\r
                                            style={{\r
                                                fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.1em',\r
                                                marginBottom: '2px', border: 'none', cursor: 'pointer',\r
                                                background: sort === s.id ? 'rgba(57, 174, 169, 0.13)' : 'transparent',\r
                                                color: sort === s.id ? '#39AEA9' : '#A2D5AB',\r
                                                opacity: sort === s.id ? 1 : 0.4\r
                                            }}\r
                                        >\r
                                            {s.label}\r
                                        </button>\r
                                    ))}\r
                                </div>\r
                            </div>\r
                        </div>\r
\r
                        {/* List */}\r
                        <div className="flex flex-col fluid-gap-xs">\r
                            {(simState.apexCandidates || [])\r
                                .slice()\r
                                .sort((a, b) => {\r
                                    if (sort === 'LINEAGE') return b.generation - a.generation;\r
                                    if (sort === 'AGE') return b.age - a.age;\r
                                    return b.energy - a.energy;\r
                                })\r
                                .slice(0, 5)\r
                                .map((org, i) => (\r
                                    <div\r
                                        key={org.id}\r
                                        className="flex items-center justify-between fluid-p-xs fluid-px-sm fluid-rounded transition-all cursor-pointer group"\r
                                        style={{\r
                                            background: selectedId === org.id ? 'rgba(57, 174, 169, 0.07)' : 'rgba(255,255,255,0.01)',\r
                                            border: selectedId === org.id ? '1px solid rgba(57, 174, 169, 0.27)' : '1px solid rgba(255,255,255,0.03)',\r
                                            boxShadow: selectedId === org.id ? '0 0 15px rgba(57,174,169,0.1)' : 'none'\r
                                        }}\r
                                        onClick={(e) => { e.stopPropagation(); onSelect(org.id); }}\r
                                        onDoubleClick={(e) => { e.stopPropagation(); onFocus?.(org.id); }}\r
                                    >\r
                                        <div className="flex items-center fluid-gap-sm" style={{ minWidth: 0 }}>\r
                                            <span style={{ color: '#A2D5AB', opacity: 0.2, fontSize: '0.6rem', fontWeight: 900, width: '0.75rem' }}>{i + 1}</span>\r
                                            <div\r
                                                className="fluid-rounded-full"\r
                                                style={{\r
                                                    width: '8px', height: '8px', flexShrink: 0,\r
                                                    backgroundColor: org.color, boxShadow: \`0 0 8px \${org.color}44\`\r
                                                }}\r
                                            />\r
                                            <span\r
                                                className="text-[var(--text-xs)] font-black truncate litho-text uppercase"\r
                                                style={{\r
                                                    letterSpacing: '-0.025em',\r
                                                    color: selectedId === org.id ? '#39AEA9' : '#E5EFC1'\r
                                                }}\r
                                            >\r
                                                {org.name}\r
                                            </span>\r
                                        </div>\r
\r
                                        <span style={{ fontSize: '0.6rem', fontFamily: 'monospace', fontWeight: 900, color: '#A2D5AB', opacity: 0.4, marginLeft: '0.5rem', whiteSpace: 'nowrap' }}>\r
                                            {sort === 'LINEAGE' ? \`GEN \${org.generation}\` : sort === 'AGE' ? \`\${(org.age / 60).toFixed(0)} HR\` : \`\${org.energy.toFixed(0)} NRG\`}\r
                                        </span>\r
                                    </div>\r
                                ))}\r
\r
                            {(simState.popCount ?? 0) === 0 && (\r
                                <div className="fluid-py-md flex justify-center fluid-rounded" style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>\r
                                    <span style={{ fontSize: '0.6rem', color: '#A2D5AB', opacity: 0.2, fontStyle: 'italic', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>\r
                                        No entities tracked\r
                                    </span>\r
                                </div>\r
                            )}\r
                        </div>\r
                    </div>\r
                )}\r
            </div>\r
        </Tooltip>\r
    );\r
};\r
\r
export default ApexRegistry;`;export{r as default};
