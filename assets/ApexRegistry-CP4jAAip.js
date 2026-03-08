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
    const formatAgeMetric = (ageFrames: number) => {\r
        const daysPerYear = 15 * 4;\r
        const totalDays = Math.floor(ageFrames / (60 * 24));\r
        const years = Math.floor(totalDays / daysPerYear);\r
        const days = totalDays % daysPerYear;\r
        const hours = Math.floor((ageFrames % (60 * 24)) / 60);\r
        return \`\${hours}Hr \${days}D \${years}Y\`;\r
    };\r
\r
    return (\r
        <Tooltip title="Apex Protocols" content="Real-time monitoring of the most successful biological entities based on lineage, energy efficiency, and survival duration." position="right">\r
            <div\r
                className="hud-shell fluid-rounded-lg flex flex-col pointer-events-auto transition-all overflow-hidden"\r
                style={{\r
                    minWidth: '13.6rem',\r
                    width: '13.6rem',\r
                    padding: '0.28rem'\r
                }}\r
                onWheel={(e) => e.stopPropagation()}\r
            >\r
                {/* Header */}\r
                <div\r
                    className="hud-header-strip -m-[0.28rem] mb-0 px-[0.34rem] py-[0.14rem] flex items-center justify-between group select-none cursor-pointer"\r
                    onClick={onToggle}\r
                >\r
                    <h4\r
                        className="font-black litho-text uppercase transition-all group-hover-text-accent"\r
                        style={{\r
                            minWidth: 0,\r
                            fontSize: '0.72rem',\r
                            letterSpacing: '0.12em',\r
                            color: '#E5EFC1',\r
                            lineHeight: 0.92,\r
                            margin: 0,\r
                            padding: 0\r
                        }}\r
                    >\r
                        Leaderboard\r
                    </h4>\r
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
                    <div className="animate-fade-in" style={{ paddingTop: '0.18rem' }}>\r
                        {/* Sort Control */}\r
                        <div className="flex items-center justify-between" style={{ marginBottom: '0.18rem' }}>\r
                            <span className="opacity-40 uppercase font-black" style={{ fontSize: '0.48rem', color: '#A2D5AB', letterSpacing: '0.08em', lineHeight: 1 }}>Sort Protocol</span>\r
                            <div className="relative group">\r
                                <button\r
                                    className="fluid-px-sm fluid-rounded transition-all flex items-center juice-interactive"\r
                                    style={{\r
                                        fontSize: '0.5rem', fontWeight: 900, color: '#39AEA9',\r
                                        textTransform: 'uppercase', letterSpacing: '0.1em',\r
                                        border: '1px solid rgba(57, 174, 169, 0.27)', background: 'rgba(0,0,0,0.2)',\r
                                        paddingTop: '3px', paddingBottom: '3px', gap: '3px'\r
                                    }}\r
                                >\r
                                    {sort} <span style={{ fontSize: '0.5rem', opacity: 0.5 }}>▼</span>\r
                                </button>\r
\r
                                {/* Dropdown */}\r
                                <div\r
                                    className="absolute transition-all group-hover-visible shadow-glow"\r
                                    style={{\r
                                        top: '100%', right: 0, marginTop: '4px', width: '10rem',\r
                                        background: 'rgba(0,0,0,0.95)', border: '1px solid rgba(57, 174, 169, 0.27)',\r
                                        borderRadius: 'var(--fluid-radius)', zIndex: 100, padding: '3px',\r
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
                                                fontSize: '0.52rem', fontWeight: 900, letterSpacing: '0.1em',\r
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
                        <div className="flex flex-col" style={{ gap: '0.12rem' }}>\r
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
                                        className="flex items-center justify-between fluid-px-sm fluid-rounded transition-all cursor-pointer group"\r
                                        style={{\r
                                            background: selectedId === org.id ? 'rgba(57, 174, 169, 0.08)' : 'rgba(255,255,255,0.015)',\r
                                            border: selectedId === org.id ? '1px solid rgba(57, 174, 169, 0.27)' : '1px solid rgba(255,255,255,0.03)',\r
                                            boxShadow: selectedId === org.id ? '0 0 12px rgba(57,174,169,0.08)' : 'none',\r
                                            paddingTop: '0.16rem',\r
                                            paddingBottom: '0.16rem'\r
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
                                        <span style={{ fontSize: '0.52rem', fontFamily: 'monospace', fontWeight: 900, color: '#A2D5AB', opacity: 0.55, marginLeft: '0.35rem', whiteSpace: 'nowrap' }}>\r
                                            {sort === 'LINEAGE' ? \`GEN \${org.generation}\` : sort === 'AGE' ? formatAgeMetric(org.age) : \`\${org.energy.toFixed(0)} NRG\`}\r
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
