import React from 'react';
import { SimulationState } from '../../types';
import { SIM_CONSTANTS, SEASON_THEMES } from '../core/Constants';
import Tooltip from './Tooltip';

interface Props {
    simState: SimulationState;
    onOpenRegistry: () => void;
}

const ChronosHUD: React.FC<Props> = ({ simState, onOpenRegistry }) => {
    const season = simState.season ?? 1;
    const theme = SEASON_THEMES[season - 1];
    const daysPerYear = SIM_CONSTANTS.DAYS_PER_SEASON * SIM_CONSTANTS.SEASONS_PER_CYCLE;

    const timeTooltipContent = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--fluid-space-xs)' }}>
            <div>• {SIM_CONSTANTS.SECONDS_PER_DAY}s Realtime = 1 Day (24h)</div>
            <div>• {(SIM_CONSTANTS.SECONDS_PER_DAY / 24).toFixed(2)}s Realtime = 1 Hour</div>
            <div>• {SIM_CONSTANTS.DAYS_PER_SEASON} Days = 1 Season</div>
            <div>• {SIM_CONSTANTS.SEASONS_PER_CYCLE} Seasons = 1 Cycle</div>
            <div className="opacity-60 italic mt-3 font-black uppercase tracking-widest leading-relaxed" style={{ color: theme.color }}>
                Phase: {theme.description}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col fluid-gap-sm pointer-events-none">
            {/* Time Card - Isolated Row */}
            <div className="flex">
                <Tooltip title="Time Standardization" content={timeTooltipContent} position="right">
                    <div
                        onClick={onOpenRegistry}
                        className="glass-modular fluid-rounded relative group pointer-events-auto cursor-pointer juice-interactive flex flex-col"
                        style={{
                            width: '8rem',
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                        onMouseEnter={() => {
                            document.body.style.cursor = 'pointer';
                        }}
                        onMouseLeave={() => {
                            document.body.style.cursor = 'default';
                        }}
                    >
                        {/* Compact Header */}
                        <div
                            className="fluid-rounded-t fluid-px-sm fluid-py-xs h-full w-full"
                            style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                        >
                            <div className="relative h-full w-full opacity-30 text-[0.7rem] font-black litho-text uppercase tracking-[0.3em]" style={{ color: '#A2D5AB' }}>
                                Chronos Layer
                            </div>
                        </div>

                        <div className="flex flex-col items-center text-center p-2 gap-1">
                            {/* 24-Hour Clock Visualization - Slightly Scaled Down */}
                            <div className="relative flex-col flex-shrink-0 bg-black/20 rounded-full border border-white/5 p-1 w-12 h-12">
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                    <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />
                                    {Array.from({ length: 24 }).map((_, i) => {
                                        const isActive = i < (simState.hour || 0);
                                        const isCurrent = i === (simState.hour || 0);
                                        let color = 'rgba(255,255,255,0.1)';
                                        if (isActive) color = theme.color;
                                        if (isCurrent) color = '#ffffff';
                                        return (
                                            <line
                                                key={i}
                                                x1="50" y1="18" x2="50" y2="30"
                                                stroke={color}
                                                strokeWidth={isCurrent ? "6" : "4"}
                                                strokeLinecap="round"
                                                transform={`rotate(${i * 15} 50 50)`}
                                            />
                                        );
                                    })}
                                </svg>
                            </div>

                            {/* Clock Text Details */}
                            <div className="flex flex-col">
                                <div className="text-[0.65rem] font-bold uppercase text-white/50 leading-none">
                                    Hour {simState.hour}
                                </div>
                                <div className="text-[0.65rem] font-black uppercase mt-1" style={{ color: '#E5EFC1' }}>
                                    Day {(simState.day % SIM_CONSTANTS.DAYS_PER_SEASON) + 1} <span style={{ color: '#39AEA9' }}>Season {season}</span>
                                </div>
                            </div>
                        </div>

                        {/* Minimal Julian Day Footer */}
                        <div
                            className="px-2 pb-2"
                            style={{
                                fontSize: '0.6rem', color: '#A2D5AB', opacity: 1.0, fontFamily: 'Lexend Deca', textAlign: 'center'
                            }}
                        >
                            Cycle {simState.cycle} • Julian {(simState.day % daysPerYear) + 1}
                        </div>
                    </div>
                </Tooltip>
            </div>

            {/* Biosphere Card - Second Row */}
            <div className="flex">
                <Tooltip title="Biosphere Details" content="Detailed biological metrics and ancestry registry." position="right">
                    <div
                        onClick={onOpenRegistry}
                        className="glass-modular fluid-rounded group relative pointer-events-auto cursor-pointer juice-interactive flex flex-col"
                        style={{ minWidth: '9rem', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)' }}
                    >
                        <div
                            className="fluid-rounded-t fluid-p-sm fluid-pb-xs"
                            style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.25rem' }}
                        >
                            <div className="opacity-30 text-[var(--text-xs)] font-black litho-text uppercase" style={{ color: '#A2D5AB', letterSpacing: '0.4em' }}>
                                Biosphere
                            </div>
                        </div>

                        <div className="p-3" style={{ paddingTop: '0.1rem' }}>
                            <div className="text-sm font-black litho-text uppercase" style={{ color: '#E5EFC1', fontFamily: 'Lexend Deca' }}>
                                {simState.popCount ?? 0} <span style={{ color: '#E5EFC1', fontSize: '0.7rem', opacity: 0.7, letterSpacing: '0.2em' }}>Fauna</span>
                            </div>
                            <div
                                className="flex items-center gap-2 litho-text uppercase font-black"
                                style={{
                                    marginTop: '0.25rem', paddingTop: '0.1rem', borderTop: '1px solid rgba(255,255,255,0.05)',
                                    fontSize: '0.85rem', color: '#A2D5AB', opacity: 0.8
                                }}
                            >
                                <span style={{ color: '#E5EFC1' }}>{simState.floraCount ?? 0}</span>
                                <span style={{ opacity: 0.7, letterSpacing: '0.2em' }}>Flora</span>

                            </div>
                        </div>
                    </div>
                </Tooltip>
            </div>
        </div>
    );
};

export default ChronosHUD;