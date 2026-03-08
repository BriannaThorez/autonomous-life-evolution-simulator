const r=`import React from 'react';\r
import { SimulationState } from '../../types';\r
import { SIM_CONSTANTS, SEASON_THEMES } from '../core/Constants';\r
import Tooltip from './Tooltip';\r
\r
interface Props {\r
    simState: SimulationState;\r
    onOpenRegistry: () => void;\r
}\r
\r
const ChronosHUD: React.FC<Props> = ({ simState, onOpenRegistry }) => {\r
    const season = simState.season ?? 1;\r
    const theme = SEASON_THEMES[season - 1];\r
    const daysPerYear = SIM_CONSTANTS.DAYS_PER_SEASON * SIM_CONSTANTS.SEASONS_PER_CYCLE;\r
\r
    const timeTooltipContent = (\r
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--fluid-space-xs)' }}>\r
            <div>• {SIM_CONSTANTS.SECONDS_PER_DAY}s Realtime = 1 Day (24h)</div>\r
            <div>• {(SIM_CONSTANTS.SECONDS_PER_DAY / 24).toFixed(2)}s Realtime = 1 Hour</div>\r
            <div>• {SIM_CONSTANTS.DAYS_PER_SEASON} Days = 1 Season</div>\r
            <div>• {SIM_CONSTANTS.SEASONS_PER_CYCLE} Seasons = 1 Cycle</div>\r
            <div className="opacity-60 italic mt-3 font-black uppercase tracking-widest leading-relaxed" style={{ color: theme.color }}>\r
                Phase: {theme.description}\r
            </div>\r
        </div>\r
    );\r
\r
    return (\r
        <div className="flex flex-col pointer-events-none hud-side-stack" style={{ gap: '0.32rem' }}>\r
            {/* Time Card - Isolated Row */}\r
            <div className="flex">\r
                <Tooltip title="Time Standardization" content={timeTooltipContent} position="right">\r
                    <div\r
                        onClick={onOpenRegistry}\r
                        className="hud-shell fluid-rounded-lg relative group pointer-events-auto cursor-pointer juice-interactive flex flex-col overflow-hidden"\r
                        style={{\r
                            width: '10.15rem',\r
                            minHeight: '9.55rem'\r
                        }}\r
                        onMouseEnter={() => {\r
                            document.body.style.cursor = 'pointer';\r
                        }}\r
                        onMouseLeave={() => {\r
                            document.body.style.cursor = 'default';\r
                        }}\r
                    >\r
                        {/* Compact Header */}\r
                        <div\r
                            className="hud-header-strip fluid-rounded-t h-full w-full"\r
                            style={{ padding: '0.2rem 0.34rem' }}\r
                        >\r
                            <div\r
                                className="relative h-full w-full opacity-30 font-black litho-text uppercase"\r
                                style={{ fontSize: '0.62rem', letterSpacing: '0.2em', color: '#A2D5AB' }}\r
                            >\r
                                Chronos Layer\r
                            </div>\r
                        </div>\r
\r
                        <div className="flex flex-col items-center text-center" style={{ padding: '0.4rem 0.45rem 0.25rem', gap: '0.18rem' }}>\r
                            {/* 24-Hour Clock Visualization - Slightly Scaled Down */}\r
                            <div className="relative flex-col flex-shrink-0 bg-black/20 rounded-full border border-white/5 p-1 w-12 h-12" style={{ width: '8.5rem', height: '8.5rem', maxWidth: '8.5rem', maxHeight: '8.5rem' }}>\r
                                <svg viewBox="0 0 100 100" className="w-full h-full">\r
                                    <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />\r
                                    {Array.from({ length: 24 }).map((_, i) => {\r
                                        const isActive = i < (simState.hour || 0);\r
                                        const isCurrent = i === (simState.hour || 0);\r
                                        let color = 'rgba(255,255,255,0.1)';\r
                                        if (isActive) color = theme.color;\r
                                        if (isCurrent) color = '#ffffff';\r
                                        return (\r
                                            <line\r
                                                key={i}\r
                                                x1="50" y1="18" x2="50" y2="30"\r
                                                stroke={color}\r
                                                strokeWidth={isCurrent ? "6" : "4"}\r
                                                strokeLinecap="round"\r
                                                transform={\`rotate(\${i * 15} 50 50)\`}\r
                                            />\r
                                        );\r
                                    })}\r
                                </svg>\r
                            </div>\r
\r
                            {/* Clock Text Details */}\r
                            <div className="flex flex-col" style={{ gap: '0.08rem' }}>\r
                                <div className="font-bold uppercase text-white/50 leading-none" style={{ fontSize: '0.58rem' }}>\r
                                    Hour {simState.hour}\r
                                </div>\r
                                <div className="font-black uppercase" style={{ fontSize: '0.62rem', marginTop: '0.02rem', color: '#E5EFC1' }}>\r
                                    Day {(simState.day % SIM_CONSTANTS.DAYS_PER_SEASON) + 1} <span style={{ color: '#39AEA9' }}>Season {season}</span>\r
                                </div>\r
                            </div>\r
                        </div>\r
\r
                        {/* Minimal Julian Day Footer */}\r
                        <div\r
                            style={{\r
                                fontSize: '0.55rem', color: '#A2D5AB', opacity: 0.95, fontFamily: 'Lexend Deca', textAlign: 'center', padding: '0 0.4rem 0.35rem'\r
                            }}\r
                        >\r
                            Cycle {simState.cycle} • Julian {(simState.day % daysPerYear) + 1}\r
                        </div>\r
                    </div>\r
                </Tooltip>\r
            </div>\r
\r
            {/* Biosphere Card - Second Row */}\r
            <div className="flex">\r
                <Tooltip title="Biosphere Details" content="Detailed biological metrics and ancestry registry." position="right">\r
                    <div\r
                        onClick={onOpenRegistry}\r
                        className="hud-shell fluid-rounded-lg group relative pointer-events-auto cursor-pointer juice-interactive flex flex-col overflow-hidden"\r
                        style={{ minWidth: '10.15rem' }}\r
                    >\r
                        <div\r
                            className="hud-header-strip fluid-rounded-t"\r
                            style={{ marginBottom: '0.14rem', padding: '0.2rem 0.34rem' }}\r
                        >\r
                            <div className="opacity-30 font-black litho-text uppercase" style={{ color: '#A2D5AB', letterSpacing: '0.24em', fontSize: '0.6rem', lineHeight: 1 }}>\r
                                Biosphere\r
                            </div>\r
                        </div>\r
\r
                        <div style={{ padding: '0.35rem 0.45rem 0.45rem' }}>\r
                            <div className="font-black litho-text uppercase" style={{ color: '#E5EFC1', fontFamily: 'Lexend Deca', fontSize: '0.82rem', lineHeight: 1 }}>\r
                                {simState.popCount ?? 0} <span style={{ color: '#E5EFC1', fontSize: '0.7rem', opacity: 0.7, letterSpacing: '0.2em' }}>Fauna</span>\r
                            </div>\r
                            <div\r
                                className="flex items-center gap-2 litho-text uppercase font-black"\r
                                style={{\r
                                    marginTop: '0.16rem', paddingTop: '0.12rem', borderTop: '1px solid rgba(255,255,255,0.05)',\r
                                    fontSize: '0.74rem', color: '#A2D5AB', opacity: 0.8, lineHeight: 1\r
                                }}\r
                            >\r
                                <span style={{ color: '#E5EFC1' }}>{simState.floraCount ?? 0}</span>\r
                                <span style={{ opacity: 0.7, letterSpacing: '0.2em' }}>Flora</span>\r
\r
                            </div>\r
                        </div>\r
                    </div>\r
                </Tooltip>\r
            </div>\r
        </div>\r
    );\r
};\r
\r
export default ChronosHUD;`;export{r as default};
