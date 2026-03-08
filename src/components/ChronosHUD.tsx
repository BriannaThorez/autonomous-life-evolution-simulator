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
        <div className="flex flex-col pointer-events-none hud-side-stack" style={{ gap: '0.32rem' }}>
            {/* Time Card - Isolated Row */}
            <div className="flex">
                <Tooltip title="Time Standardization" content={timeTooltipContent} position="right">
                    <div
                        onClick={onOpenRegistry}
                        className="hud-shell fluid-rounded-lg relative group pointer-events-auto cursor-pointer juice-interactive flex flex-col overflow-hidden"
                        style={{
                            width: '10.15rem',
                            minHeight: '9.55rem'
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
                            className="hud-header-strip fluid-rounded-t h-full w-full"
                            style={{ padding: '0.2rem 0.34rem' }}
                        >
                            <div
                                className="relative h-full w-full opacity-30 font-black litho-text uppercase"
                                style={{ fontSize: '0.62rem', letterSpacing: '0.2em', color: '#A2D5AB' }}
                            >
                                Chronos Layer
                            </div>
                        </div>

                        <div className="flex flex-col items-center text-center" style={{ padding: '0.4rem 0.45rem 0.25rem', gap: '0.18rem' }}>
                            {/* 24-Hour Clock Visualization - Slightly Scaled Down */}
                            <div className="relative flex-col flex-shrink-0 bg-black/20 rounded-full border border-white/5 p-1 w-12 h-12" style={{ width: '8.5rem', height: '8.5rem', maxWidth: '8.5rem', maxHeight: '8.5rem' }}>
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
                            <div className="flex flex-col" style={{ gap: '0.08rem' }}>
                                <div className="font-bold uppercase text-white/50 leading-none" style={{ fontSize: '0.58rem' }}>
                                    Hour {simState.hour}
                                </div>
                                <div className="font-black uppercase" style={{ fontSize: '0.62rem', marginTop: '0.02rem', color: '#E5EFC1' }}>
                                    Day {(simState.day % SIM_CONSTANTS.DAYS_PER_SEASON) + 1} <span style={{ color: '#39AEA9' }}>Season {season}</span>
                                </div>
                            </div>
                        </div>

                        {/* Minimal Julian Day Footer */}
                        <div
                            style={{
                                fontSize: '0.55rem', color: '#A2D5AB', opacity: 0.95, fontFamily: 'Lexend Deca', textAlign: 'center', padding: '0 0.4rem 0.35rem'
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
                        className="hud-shell fluid-rounded-lg group relative pointer-events-auto cursor-pointer juice-interactive flex flex-col overflow-hidden"
                        style={{ minWidth: '10.15rem' }}
                    >
                        <div
                            className="hud-header-strip fluid-rounded-t"
                            style={{ marginBottom: '0.14rem', padding: '0.2rem 0.34rem' }}
                        >
                            <div className="opacity-30 font-black litho-text uppercase" style={{ color: '#A2D5AB', letterSpacing: '0.24em', fontSize: '0.6rem', lineHeight: 1 }}>
                                Biosphere
                            </div>
                        </div>

                        <div style={{ padding: '0.35rem 0.45rem 0.45rem' }}>
                            <div className="font-black litho-text uppercase" style={{ color: '#E5EFC1', fontFamily: 'Lexend Deca', fontSize: '0.82rem', lineHeight: 1 }}>
                                {simState.popCount ?? 0} <span style={{ color: '#E5EFC1', fontSize: '0.7rem', opacity: 0.7, letterSpacing: '0.2em' }}>Fauna</span>
                            </div>
                            <div
                                className="flex items-center gap-2 litho-text uppercase font-black"
                                style={{
                                    marginTop: '0.16rem', paddingTop: '0.12rem', borderTop: '1px solid rgba(255,255,255,0.05)',
                                    fontSize: '0.74rem', color: '#A2D5AB', opacity: 0.8, lineHeight: 1
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