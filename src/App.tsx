import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationEngine } from './core/SimulationEngine';
import { VectorDB } from './data/VectorDB';
import SimulationCanvas from './components/SimulationCanvas';
import EntityInspector from './components/EntityInspector';
import VectorDBVisualizer from './components/VectorDBVisualizer';
import NotificationPanel from './components/NotificationPanel';
import ChronosHUD from './components/ChronosHUD';
import ApexRegistry from './components/ApexRegistry';
import SettingsModal from './components/SettingsModal';
import ResetModal from './components/ResetModal';
import SensoryDropdown from './components/SensoryDropdown';
import Tooltip from './components/Tooltip';
import ChatAssistant from './components/ChatAssistant/ChatAssistant';
import { SimulationState, Vector2 } from '../types';
import { SIM_CONSTANTS, SEASON_THEMES, WORLD_CONSTANTS } from './core/Constants';
import { ScaleUtils } from './rendering/ScaleUtils';
import './styles/GlobalSpacing.css';

/**
 * AppLoader — async initialization wrapper.
 * Hydrates VectorDB caches from IndexedDB before rendering the main App.
 * This ensures getSetting() calls in useState initializers have data.
 */
const AppLoader: React.FC = () => {
    const [ready, setReady] = useState(false);
    const [savedState, setSavedState] = useState<any>(null);

    useEffect(() => {
        (async () => {
            await VectorDB.init();
            const state = await VectorDB.loadSimState();
            setSavedState(state);
            setReady(true);
        })();
    }, []);

    if (!ready) return (
        <div style={{ background: '#050505', color: '#A2D5AB', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: '0.8rem', opacity: 0.5 }}>
            Initializing VectorDB…
        </div>
    );

    return <App savedState={savedState} />;
};

interface AppProps {
    savedState?: any;
}

const App: React.FC<AppProps> = ({ savedState }) => {
    const [engine] = useState(() => {
        const worldPx = WORLD_CONSTANTS.WORLD_SIZE_METERS * WORLD_CONSTANTS.PIXELS_PER_METER;
        return new SimulationEngine(worldPx, worldPx, savedState || undefined);
    });
    const [simState, setSimState] = useState<SimulationState>(engine.state);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const latestWorkerState = useRef<any>(null); // Cache latest full state for beforeunload
    const [showVectorDB, setShowVectorDB] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [resetConfirm, setResetConfirm] = useState(false);
    const [surnameFilter, setSurnameFilter] = useState<string | null>(null);
    const [registryFocusId, setRegistryFocusId] = useState<string | null>(null);
    const [targetFocus, setTargetFocus] = useState<Vector2 | null>(null);
    const [guiScale, setGuiScale] = useState(1.0);
    const [neutralScale, setNeutralScale] = useState(() => ScaleUtils.getNeutralizationFactor());
    const [autoscaleEnabled, setAutoscaleEnabled] = useState(true);
    const [apexExpanded, setApexExpanded] = useState(() => {
        return VectorDB.getSetting('apex_expanded', true);
    });
    const [apexSort, setApexSort] = useState<'LINEAGE' | 'ENERGY' | 'AGE'>('LINEAGE');
    const [inspectorPos, setInspectorPos] = useState<Vector2>({ x: window.innerWidth - 300, y: 100 });
    const [showVision, setShowVision] = useState(() => {
        return VectorDB.getSetting('debug_vision', true);
    });
    const [showGrid, setShowGrid] = useState(() => {
        return VectorDB.getSetting('debug_grid', true);
    });
    const [showHearing, setShowHearing] = useState(() => {
        return VectorDB.getSetting('debug_hearing', true);
    });
    const [showCommunication, setShowCommunication] = useState(() => {
        return VectorDB.getSetting('debug_comm', true);
    });
    const [showMasterDebug, setShowMasterDebug] = useState(() => {
        return VectorDB.getSetting('debug_master', true);
    });

    useEffect(() => {
        VectorDB.setSetting('debug_vision', showVision);
    }, [showVision]);

    useEffect(() => {
        VectorDB.setSetting('debug_grid', showGrid);
    }, [showGrid]);

    useEffect(() => {
        VectorDB.setSetting('debug_hearing', showHearing);
    }, [showHearing]);

    useEffect(() => {
        VectorDB.setSetting('debug_comm', showCommunication);
    }, [showCommunication]);

    useEffect(() => {
        VectorDB.setSetting('debug_master', showMasterDebug);
    }, [showMasterDebug]);

    useEffect(() => {
        VectorDB.setSetting('apex_expanded', apexExpanded);
    }, [apexExpanded]);

    const [worker, setWorker] = useState<Worker | null>(null);

    useEffect(() => {
        // Initialize Worker
        const w = new Worker(new URL('./worker/sim.worker.ts', import.meta.url), { type: 'module' });
        setWorker(w);

        w.onmessage = (e) => {
            const { type, data } = e.data;
            if (type === 'STATE_REFRESH') {
                // Light UI state update
                setSimState(prev => ({
                    ...prev,
                    ...data,
                }));
            } else if (type === 'LOG') {
                console.log(`[SimWorker] ${data}`);
            } else if (type === 'REGISTRY_LOG') {
                VectorDB.addHistory(data);
            } else if (type === 'REGISTRY_DEATH') {
                VectorDB.markDeceased(e.data.id, data);
            } else if (type === 'SAVE_REQUIRED') {
                latestWorkerState.current = data;
                VectorDB.saveSimState(data); // Direct save — no engine middleman
            }
        };

        const handleResize = () => {
            setNeutralScale(ScaleUtils.getNeutralizationFactor());
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('beforeunload', () => {
            // Save the freshest worker state available
            if (latestWorkerState.current) {
                VectorDB.saveSimState(latestWorkerState.current);
            } else {
                engine.forceSave();
            }
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            w.terminate();
        };
    }, [engine]);

    useEffect(() => {
        worker?.postMessage({ type: 'SET_PAUSED', data: isPaused });
    }, [worker, isPaused]);

    // Priority: Selected > Hovered
    const displayedEntity = simState.selectedEntity || simState.hoveredEntity || null;

    const handleMasterReset = () => {
        VectorDB.hardReset(); // Clear main thread storage & cache immediately
        worker?.postMessage({ type: 'RESET' });
        setSimState(engine.state); // Reset local state reference
        setResetConfirm(false);
        setShowSettings(false);
    };

    return (
        <div className="relative w-full h-screen select-none overflow-hidden" style={{ background: '#050505', color: '#e2e8f0' }}>
            <ChatAssistant simState={simState} />
            {worker && (
                <SimulationCanvas
                    worker={worker}
                    engine={engine}
                    onHover={(id) => setHoveredId(id)}
                    onSelect={(id) => setSelectedId(id)}
                    selectedId={selectedId}
                    hoveredId={hoveredId}
                    targetFocus={targetFocus}
                    showVision={showMasterDebug && showVision}
                    showGrid={showMasterDebug && showGrid}
                    showHearing={showMasterDebug && showHearing}
                    showCommunication={showMasterDebug && showCommunication}
                />
            )}

            {/* GUI Layer - Modular & Native Scaling */}
            <div
                className="absolute inset-0 z-50 pointer-events-none"
                style={{
                    fontSize: autoscaleEnabled ? undefined : `${guiScale * 12}px`,
                    transform: autoscaleEnabled ? `scale(${guiScale})` : undefined,
                    transformOrigin: 'top left',
                    width: autoscaleEnabled ? `${100 / guiScale}%` : '100%',
                    height: autoscaleEnabled ? `${100 / guiScale}%` : '100%'
                }}
            >

                <div className="absolute flex flex-col items-end gap-3" style={{ top: '1rem', right: '1rem' }}>
                    <div className="flex gap-3 pointer-events-auto items-stretch h-12">
                        <Tooltip title="Neural Registry" content="Browse the full historical record of every entity that has existed in the simulation." position="left">
                            <button
                                onClick={() => setShowVectorDB(true)}
                                className="glass-modular px-5 rounded flex items-center gap-3 transition-all h-full"
                                style={{ border: '1px solid rgba(57, 174, 169, 0.3)' }}
                            >
                                <div className="rounded-full shadow-glow" style={{ width: '8px', height: '8px', background: '#39AEA9' }} />
                                <span className="text-[0.75rem] font-black tracking-[0.2em] litho-text uppercase">Registry</span>
                            </button>
                        </Tooltip>

                        <div className="pointer-events-auto h-full" style={{ zIndex: 1000 }}>
                            <SensoryDropdown
                                showMasterDebug={showMasterDebug}
                                onToggleMasterDebug={setShowMasterDebug}
                                showVision={showVision}
                                onToggleVision={setShowVision}
                                showHearing={showHearing}
                                onToggleHearing={setShowHearing}
                                showCommunication={showCommunication}
                                onToggleCommunication={setShowCommunication}
                                showGrid={showGrid}
                                onToggleGrid={setShowGrid}
                            />
                        </div>

                        <Tooltip title="Engine Settings" content="Configure visual scaling, simulation speed, and master reset parameters." position="left">
                            <button
                                onClick={() => setShowSettings(true)}
                                className="glass-modular px-4 rounded flex items-center justify-center transition-all h-full"
                                style={{ border: '1px solid rgba(162, 213, 171, 0.2)' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A2D5AB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                            </button>
                        </Tooltip>
                    </div>
                </div>

                {/* Top-Left HUD & Registry */}
                <div className="absolute flex flex-row fluid-gap-xs items-start" style={{ top: 'var(--fluid-space-sm)', left: 'var(--fluid-space-sm)' }}>
                    <ChronosHUD
                        simState={simState}
                        onOpenRegistry={() => setShowVectorDB(true)}
                    />
                    <ApexRegistry
                        simState={simState}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        expanded={apexExpanded}
                        onToggle={() => {
                            const next = !apexExpanded;
                            setApexExpanded(next);
                            localStorage.setItem('ales_apex_expanded', String(next));
                        }}
                        sort={apexSort}
                        onSortChange={setApexSort}
                        onFocus={(id) => {
                            const target = simState.organisms.find(o => o.id === id);
                            if (target) setTargetFocus({ x: target.position.x, y: target.position.y });
                        }}
                    />
                </div>

                {/* Floating Entity Inspector */}
                {displayedEntity && !showVectorDB && (
                    <EntityInspector
                        entity={displayedEntity}
                        organisms={[]} // We don't have the full list locally anymore, EntityInspector might need a fallback or message-based detail fetch
                        simTime={simState.time}
                        events={simState.events}
                        onClose={() => { setSelectedId(null); setHoveredId(null); }}
                        onOpenMemoryBrowser={(entityId) => {
                            setRegistryFocusId(entityId);
                            setShowVectorDB(true);
                        }}
                        onFocus={(id) => {
                            const target = simState.organisms.find(o => o.id === id);
                            if (target) setTargetFocus({ x: target.position.x, y: target.position.y });
                        }}
                        position={inspectorPos}
                        onPositionChange={setInspectorPos}
                    />
                )}

                {/* Interaction Modals */}
                <SettingsModal
                    show={showSettings}
                    onClose={() => setShowSettings(false)}
                    guiScale={guiScale}
                    onGuiScaleChange={setGuiScale}
                    autoscaleEnabled={autoscaleEnabled}
                    onAutoscaleToggle={() => setAutoscaleEnabled(!autoscaleEnabled)}
                    onReset={() => setResetConfirm(true)}
                />

                <ResetModal
                    show={resetConfirm}
                    onConfirm={handleMasterReset}
                    onCancel={() => setResetConfirm(false)}
                />

                {/* Bottom Notification Panel */}
                <div className="absolute pointer-events-auto" style={{ bottom: 'var(--fluid-space-sm)', left: 'var(--fluid-space-sm)' }}>
                    <NotificationPanel
                        events={simState.events}
                        onFocus={(pos, entityId) => {
                            setTargetFocus(pos);
                            if (entityId) setSelectedId(entityId);
                        }}
                    />
                </div>

                {/* Control Bar */}
                <div
                    className="absolute glass-modular flex items-center fluid-gap-md fluid-px-lg fluid-py-sm fluid-rounded-md pointer-events-auto"
                    style={{
                        bottom: 'var(--fluid-space-sm)', left: '50%', transform: 'translateX(-50%)',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
                    }}
                >
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className="transition-all juice-interactive"
                        style={{ color: '#A2D5AB', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                        {isPaused ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                        )}
                    </button>
                    <div className="text-[var(--text-xs)] italic litho-text font-black uppercase" style={{ color: '#A2D5AB', opacity: 0.3, letterSpacing: '0.3em' }}>Chronos Engine v6.1</div>
                    {/* VectorDB Status Indicator */}
                    <div className="text-[var(--text-xs)] litho-text font-black" style={{ color: '#39AEA9', opacity: 0.4, fontFamily: 'monospace', fontSize: '0.5rem', letterSpacing: '0.1em' }}>
                        VDB: {VectorDB.saveCount} saves • {VectorDB.lastSaveOrgCount} orgs • {VectorDB.lastSaveMs.toFixed(0)}ms
                    </div>
                </div>

                {showVectorDB && (
                    <VectorDBVisualizer
                        config={(engine as any).config}
                        onUpdateConfig={(newConfig) => (engine as any).updateConfig(newConfig)}
                        onHardReset={handleMasterReset}
                        onClose={() => {
                            setShowVectorDB(false);
                            setRegistryFocusId(null);
                        }}
                        initialSurnameFilter={surnameFilter}
                        initialSelectedId={registryFocusId}
                    />
                )}
            </div>
        </div>
    );
};

export default AppLoader;
