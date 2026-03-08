import React from 'react';
import { SimulationState } from '../../types';
import Tooltip from './Tooltip';

interface Props {
    simState: SimulationState;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onFocus?: (id: string) => void;
    expanded: boolean;
    onToggle: () => void;
    sort: 'LINEAGE' | 'ENERGY' | 'AGE';
    onSortChange: (sort: 'LINEAGE' | 'ENERGY' | 'AGE') => void;
}

const ApexRegistry: React.FC<Props> = ({ simState, selectedId, onSelect, onFocus, expanded, onToggle, sort, onSortChange }) => {
    const formatAgeMetric = (ageFrames: number) => {
        const daysPerYear = 15 * 4;
        const totalDays = Math.floor(ageFrames / (60 * 24));
        const years = Math.floor(totalDays / daysPerYear);
        const days = totalDays % daysPerYear;
        const hours = Math.floor((ageFrames % (60 * 24)) / 60);
        return `${hours}Hr ${days}D ${years}Y`;
    };

    return (
        <Tooltip title="Apex Protocols" content="Real-time monitoring of the most successful biological entities based on lineage, energy efficiency, and survival duration." position="right">
            <div
                className="hud-shell fluid-rounded-lg flex flex-col pointer-events-auto transition-all overflow-hidden"
                style={{
                    minWidth: '13.6rem',
                    width: '13.6rem',
                    padding: '0.28rem'
                }}
                onWheel={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="hud-header-strip -m-[0.28rem] mb-0 px-[0.34rem] py-[0.14rem] flex items-center justify-between group select-none cursor-pointer"
                    onClick={onToggle}
                >
                    <h4
                        className="font-black litho-text uppercase transition-all group-hover-text-accent"
                        style={{
                            minWidth: 0,
                            fontSize: '0.72rem',
                            letterSpacing: '0.12em',
                            color: '#E5EFC1',
                            lineHeight: 0.92,
                            margin: 0,
                            padding: 0
                        }}
                    >
                        Leaderboard
                    </h4>

                    <div className="transition-all opacity-40" style={{ color: '#39AEA9' }}>
                        <div className="group-hover-visible" style={{ opacity: 0.4 }}>
                            {expanded ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            )}
                        </div>
                    </div>
                </div>

                {expanded && (
                    <div className="animate-fade-in" style={{ paddingTop: '0.18rem' }}>
                        {/* Sort Control */}
                        <div className="flex items-center justify-between" style={{ marginBottom: '0.18rem' }}>
                            <span className="opacity-40 uppercase font-black" style={{ fontSize: '0.48rem', color: '#A2D5AB', letterSpacing: '0.08em', lineHeight: 1 }}>Sort Protocol</span>
                            <div className="relative group">
                                <button
                                    className="fluid-px-sm fluid-rounded transition-all flex items-center juice-interactive"
                                    style={{
                                        fontSize: '0.5rem', fontWeight: 900, color: '#39AEA9',
                                        textTransform: 'uppercase', letterSpacing: '0.1em',
                                        border: '1px solid rgba(57, 174, 169, 0.27)', background: 'rgba(0,0,0,0.2)',
                                        paddingTop: '3px', paddingBottom: '3px', gap: '3px'
                                    }}
                                >
                                    {sort} <span style={{ fontSize: '0.5rem', opacity: 0.5 }}>▼</span>
                                </button>

                                {/* Dropdown */}
                                <div
                                    className="absolute transition-all group-hover-visible shadow-glow"
                                    style={{
                                        top: '100%', right: 0, marginTop: '4px', width: '10rem',
                                        background: 'rgba(0,0,0,0.95)', border: '1px solid rgba(57, 174, 169, 0.27)',
                                        borderRadius: 'var(--fluid-radius)', zIndex: 100, padding: '3px',
                                        backdropFilter: 'blur(32px) saturate(200%)', visibility: 'hidden', opacity: 0
                                    }}
                                >
                                    {[
                                        { id: 'LINEAGE', label: 'Longest Lineage' },
                                        { id: 'ENERGY', label: 'Highest Energy' },
                                        { id: 'AGE', label: 'Oldest Living' }
                                    ].map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => onSortChange(s.id as any)}
                                            className="w-full text-left fluid-px-md fluid-py-xs fluid-rounded transition-all uppercase"
                                            style={{
                                                fontSize: '0.52rem', fontWeight: 900, letterSpacing: '0.1em',
                                                marginBottom: '2px', border: 'none', cursor: 'pointer',
                                                background: sort === s.id ? 'rgba(57, 174, 169, 0.13)' : 'transparent',
                                                color: sort === s.id ? '#39AEA9' : '#A2D5AB',
                                                opacity: sort === s.id ? 1 : 0.4
                                            }}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex flex-col" style={{ gap: '0.12rem' }}>
                            {(simState.apexCandidates || [])
                                .slice()
                                .sort((a, b) => {
                                    if (sort === 'LINEAGE') return b.generation - a.generation;
                                    if (sort === 'AGE') return b.age - a.age;
                                    return b.energy - a.energy;
                                })
                                .slice(0, 5)
                                .map((org, i) => (
                                    <div
                                        key={org.id}
                                        className="flex items-center justify-between fluid-px-sm fluid-rounded transition-all cursor-pointer group"
                                        style={{
                                            background: selectedId === org.id ? 'rgba(57, 174, 169, 0.08)' : 'rgba(255,255,255,0.015)',
                                            border: selectedId === org.id ? '1px solid rgba(57, 174, 169, 0.27)' : '1px solid rgba(255,255,255,0.03)',
                                            boxShadow: selectedId === org.id ? '0 0 12px rgba(57,174,169,0.08)' : 'none',
                                            paddingTop: '0.16rem',
                                            paddingBottom: '0.16rem'
                                        }}
                                        onClick={(e) => { e.stopPropagation(); onSelect(org.id); }}
                                        onDoubleClick={(e) => { e.stopPropagation(); onFocus?.(org.id); }}
                                    >
                                        <div className="flex items-center fluid-gap-sm" style={{ minWidth: 0 }}>
                                            <span style={{ color: '#A2D5AB', opacity: 0.2, fontSize: '0.6rem', fontWeight: 900, width: '0.75rem' }}>{i + 1}</span>
                                            <div
                                                className="fluid-rounded-full"
                                                style={{
                                                    width: '8px', height: '8px', flexShrink: 0,
                                                    backgroundColor: org.color, boxShadow: `0 0 8px ${org.color}44`
                                                }}
                                            />
                                            <span
                                                className="text-[var(--text-xs)] font-black truncate litho-text uppercase"
                                                style={{
                                                    letterSpacing: '-0.025em',
                                                    color: selectedId === org.id ? '#39AEA9' : '#E5EFC1'
                                                }}
                                            >
                                                {org.name}
                                            </span>
                                        </div>

                                        <span style={{ fontSize: '0.52rem', fontFamily: 'monospace', fontWeight: 900, color: '#A2D5AB', opacity: 0.55, marginLeft: '0.35rem', whiteSpace: 'nowrap' }}>
                                            {sort === 'LINEAGE' ? `GEN ${org.generation}` : sort === 'AGE' ? formatAgeMetric(org.age) : `${org.energy.toFixed(0)} NRG`}
                                        </span>
                                    </div>
                                ))}

                            {(simState.popCount ?? 0) === 0 && (
                                <div className="fluid-py-md flex justify-center fluid-rounded" style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                                    <span style={{ fontSize: '0.6rem', color: '#A2D5AB', opacity: 0.2, fontStyle: 'italic', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        No entities tracked
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Tooltip>
    );
};

export default ApexRegistry;