import React from 'react';
import { SimulationState } from '../types';
import Tooltip from './Tooltip';

interface Props {
    simState: SimulationState;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    expanded: boolean;
    onToggle: () => void;
    sort: 'LINEAGE' | 'ENERGY' | 'AGE';
    onSortChange: (sort: 'LINEAGE' | 'ENERGY' | 'AGE') => void;
}

const ApexRegistry: React.FC<Props> = ({ simState, selectedId, onSelect, expanded, onToggle, sort, onSortChange }) => {
    return (
        <Tooltip title="Apex Protocols" content="Real-time monitoring of the most successful biological entities based on lineage, energy efficiency, and survival duration." position="right">
            <div
                className="glass-modular fluid-p-sm fluid-rounded flex flex-col pointer-events-auto transition-all"
                style={{
                    minWidth: '20rem',
                    width: 'fit-content',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(162, 213, 171, 0.1)'
                }}
                onWheel={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between group select-none cursor-pointer"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 'var(--fluid-space-sm)' }}
                    onClick={onToggle}
                >
                    <div className="flex flex-col">
                        <h4 className="text-[var(--text-sm)] font-black litho-text uppercase transition-all group-hover-text-accent" style={{ letterSpacing: '0.2em', color: '#E5EFC1' }}>
                            Apex Registry
                        </h4>
                        <span className="opacity-40 uppercase font-bold" style={{ fontSize: '0.55rem', color: '#A2D5AB', letterSpacing: '0.15em' }}>
                            Tracking Top 5 Entities
                        </span>
                    </div>

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
                    <div className="animate-fade-in" style={{ paddingTop: '0.5rem' }}>
                        {/* Sort Control */}
                        <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                            <span className="opacity-40 uppercase font-black" style={{ fontSize: '0.6rem', color: '#A2D5AB', letterSpacing: '0.1em' }}>Sort Protocol</span>
                            <div className="relative group">
                                <button
                                    className="fluid-px-sm fluid-rounded transition-all flex items-center juice-interactive"
                                    style={{
                                        fontSize: '0.6rem', fontWeight: 900, color: '#39AEA9',
                                        textTransform: 'uppercase', letterSpacing: '0.1em',
                                        border: '1px solid rgba(57, 174, 169, 0.27)', background: 'rgba(0,0,0,0.2)',
                                        paddingTop: '4px', paddingBottom: '4px', gap: '4px'
                                    }}
                                >
                                    {sort} <span style={{ fontSize: '0.5rem', opacity: 0.5 }}>▼</span>
                                </button>

                                {/* Dropdown */}
                                <div
                                    className="absolute transition-all group-hover-visible shadow-glow"
                                    style={{
                                        top: '100%', right: 0, marginTop: '4px', width: '12rem',
                                        background: 'rgba(0,0,0,0.95)', border: '1px solid rgba(57, 174, 169, 0.27)',
                                        borderRadius: 'var(--fluid-radius)', zIndex: 100, padding: '4px',
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
                                                fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.1em',
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
                        <div className="flex flex-col fluid-gap-xs">
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
                                        className="flex items-center justify-between fluid-p-xs fluid-px-sm fluid-rounded transition-all cursor-pointer group"
                                        style={{
                                            background: selectedId === org.id ? 'rgba(57, 174, 169, 0.07)' : 'rgba(255,255,255,0.01)',
                                            border: selectedId === org.id ? '1px solid rgba(57, 174, 169, 0.27)' : '1px solid rgba(255,255,255,0.03)',
                                            boxShadow: selectedId === org.id ? '0 0 15px rgba(57,174,169,0.1)' : 'none'
                                        }}
                                        onClick={(e) => { e.stopPropagation(); onSelect(org.id); }}
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

                                        <span style={{ fontSize: '0.6rem', fontFamily: 'monospace', fontWeight: 900, color: '#A2D5AB', opacity: 0.4, marginLeft: '0.5rem', whiteSpace: 'nowrap' }}>
                                            {sort === 'LINEAGE' ? `GEN ${org.generation}` : sort === 'AGE' ? `${(org.age / 60).toFixed(0)} HR` : `${org.energy.toFixed(0)} NRG`}
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