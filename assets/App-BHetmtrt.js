const e=`import React, { useState, useEffect, useRef, useCallback } from 'react';\r
import { SimulationEngine } from './core/SimulationEngine';\r
import { VectorDB } from './data/VectorDB';\r
import SimulationCanvas from './components/SimulationCanvas';\r
import EntityInspector from './components/EntityInspector';\r
import VectorDBVisualizer from './components/VectorDBVisualizer';\r
import NotificationPanel from './components/NotificationPanel';\r
import ChronosHUD from './components/ChronosHUD';\r
import ApexRegistry from './components/ApexRegistry';\r
import SettingsModal from './components/SettingsModal';\r
import ResetModal from './components/ResetModal';\r
import SensoryDropdown from './components/SensoryDropdown';\r
import Tooltip from './components/Tooltip';\r
import ChatAssistant from './components/ChatAssistant/ChatAssistant';\r
import { SimulationState, Vector2 } from '../types';\r
import { SIM_CONSTANTS, SEASON_THEMES, WORLD_CONSTANTS } from './core/Constants';\r
import { ScaleUtils } from './rendering/ScaleUtils';\r
import './styles/GlobalSpacing.css';\r
\r
/**\r
 * AppLoader — async initialization wrapper.\r
 * Hydrates VectorDB caches from IndexedDB before rendering the main App.\r
 * This ensures getSetting() calls in useState initializers have data.\r
 */\r
const AppLoader: React.FC = () => {\r
    const [ready, setReady] = useState(false);\r
    const [savedState, setSavedState] = useState<any>(null);\r
\r
    useEffect(() => {\r
        (async () => {\r
            await VectorDB.init();\r
            const state = await VectorDB.loadSimState();\r
            setSavedState(state);\r
            setReady(true);\r
        })();\r
    }, []);\r
\r
    if (!ready) return (\r
        <div style={{ background: '#050505', color: '#A2D5AB', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: '0.8rem', opacity: 0.5 }}>\r
            Initializing VectorDB…\r
        </div>\r
    );\r
\r
    return <App savedState={savedState} />;\r
};\r
\r
interface AppProps {\r
    savedState?: any;\r
}\r
\r
const App: React.FC<AppProps> = ({ savedState }) => {\r
    const [engine] = useState(() => {\r
        const worldPx = WORLD_CONSTANTS.WORLD_SIZE_METERS * WORLD_CONSTANTS.PIXELS_PER_METER;\r
        return new SimulationEngine(worldPx, worldPx, savedState || undefined);\r
    });\r
    const [simState, setSimState] = useState<SimulationState>(engine.state);\r
    const [hoveredId, setHoveredId] = useState<string | null>(null);\r
    const [selectedId, setSelectedId] = useState<string | null>(null);\r
    const [isPaused, setIsPaused] = useState(false);\r
    const latestWorkerState = useRef<any>(null); // Cache latest full state for beforeunload\r
    const [showVectorDB, setShowVectorDB] = useState(false);\r
    const [showSettings, setShowSettings] = useState(false);\r
    const [resetConfirm, setResetConfirm] = useState(false);\r
    const [surnameFilter, setSurnameFilter] = useState<string | null>(null);\r
    const [registryFocusId, setRegistryFocusId] = useState<string | null>(null);\r
    const [targetFocus, setTargetFocus] = useState<Vector2 | null>(null);\r
    const [guiScale, setGuiScale] = useState(1.0);\r
    const [neutralScale, setNeutralScale] = useState(() => ScaleUtils.getNeutralizationFactor());\r
    const [autoscaleEnabled, setAutoscaleEnabled] = useState(true);\r
    const [apexExpanded, setApexExpanded] = useState(() => {\r
        return VectorDB.getSetting('apex_expanded', true);\r
    });\r
    const [apexSort, setApexSort] = useState<'LINEAGE' | 'ENERGY' | 'AGE'>('AGE');\r
    const [inspectorPos, setInspectorPos] = useState<Vector2>({ x: window.innerWidth - 300, y: 100 });\r
    const [logPanelPos, setLogPanelPos] = useState<Vector2>({ x: 16, y: window.innerHeight - 250 });\r
    const [logExpanded, setLogExpanded] = useState(true);\r
    const [showVision, setShowVision] = useState(() => {\r
        return VectorDB.getSetting('debug_vision', true);\r
    });\r
    const [showGrid, setShowGrid] = useState(() => {\r
        return VectorDB.getSetting('debug_grid', true);\r
    });\r
    const [showHearing, setShowHearing] = useState(() => {\r
        return VectorDB.getSetting('debug_hearing', true);\r
    });\r
    const [showCommunication, setShowCommunication] = useState(() => {\r
        return VectorDB.getSetting('debug_comm', true);\r
    });\r
    const [showMasterDebug, setShowMasterDebug] = useState(() => {\r
        return VectorDB.getSetting('debug_master', true);\r
    });\r
\r
    useEffect(() => {\r
        VectorDB.setSetting('debug_vision', showVision);\r
    }, [showVision]);\r
\r
    useEffect(() => {\r
        VectorDB.setSetting('debug_grid', showGrid);\r
    }, [showGrid]);\r
\r
    useEffect(() => {\r
        VectorDB.setSetting('debug_hearing', showHearing);\r
    }, [showHearing]);\r
\r
    useEffect(() => {\r
        VectorDB.setSetting('debug_comm', showCommunication);\r
    }, [showCommunication]);\r
\r
    useEffect(() => {\r
        VectorDB.setSetting('debug_master', showMasterDebug);\r
    }, [showMasterDebug]);\r
\r
    useEffect(() => {\r
        VectorDB.setSetting('apex_expanded', apexExpanded);\r
    }, [apexExpanded]);\r
\r
    const [worker, setWorker] = useState<Worker | null>(null);\r
\r
    useEffect(() => {\r
        // Initialize Worker\r
        const w = new Worker(new URL('./worker/sim.worker.ts', import.meta.url), { type: 'module' });\r
        setWorker(w);\r
\r
        w.onmessage = (e) => {\r
            const { type, data } = e.data;\r
            if (type === 'STATE_REFRESH') {\r
                // Light UI state update\r
                setSimState(prev => ({\r
                    ...prev,\r
                    ...data,\r
                }));\r
            } else if (type === 'LOG') {\r
                console.log(\`[SimWorker] \${data}\`);\r
            } else if (type === 'REGISTRY_LOG') {\r
                VectorDB.addHistory(data);\r
            } else if (type === 'REGISTRY_DEATH') {\r
                VectorDB.markDeceased(e.data.id, data);\r
            } else if (type === 'SAVE_REQUIRED') {\r
                latestWorkerState.current = data;\r
                VectorDB.saveSimState(data); // Direct save — no engine middleman\r
            }\r
        };\r
\r
        const handleResize = () => {\r
            setNeutralScale(ScaleUtils.getNeutralizationFactor());\r
        };\r
\r
        window.addEventListener('resize', handleResize);\r
        window.addEventListener('beforeunload', () => {\r
            // Save the freshest worker state available\r
            if (latestWorkerState.current) {\r
                VectorDB.saveSimState(latestWorkerState.current);\r
            } else {\r
                engine.forceSave();\r
            }\r
        });\r
\r
        return () => {\r
            window.removeEventListener('resize', handleResize);\r
            w.terminate();\r
        };\r
    }, [engine]);\r
\r
    useEffect(() => {\r
        worker?.postMessage({ type: 'SET_PAUSED', data: isPaused });\r
    }, [worker, isPaused]);\r
\r
    // Priority: Selected > Hovered\r
    const displayedEntity = simState.selectedEntity || simState.hoveredEntity || null;\r
\r
    const handleMasterReset = () => {\r
        VectorDB.hardReset(); // Clear main thread storage & cache immediately\r
        worker?.postMessage({ type: 'RESET' });\r
        setSimState(engine.state); // Reset local state reference\r
        setResetConfirm(false);\r
        setShowSettings(false);\r
    };\r
\r
    return (\r
        <div className="relative w-full h-screen select-none overflow-hidden" style={{ background: '#050505', color: '#e2e8f0' }}>\r
            {worker && (\r
                <SimulationCanvas\r
                    worker={worker}\r
                    engine={engine}\r
                    onHover={(id) => setHoveredId(id)}\r
                    onSelect={(id) => setSelectedId(id)}\r
                    selectedId={selectedId}\r
                    hoveredId={hoveredId}\r
                    targetFocus={targetFocus}\r
                    showVision={showMasterDebug && showVision}\r
                    showGrid={showMasterDebug && showGrid}\r
                    showHearing={showMasterDebug && showHearing}\r
                    showCommunication={showMasterDebug && showCommunication}\r
                />\r
            )}\r
\r
            {/* GUI Layer - Modular & Native Scaling */}\r
            <div\r
                className="absolute inset-0 z-50 pointer-events-none"\r
                style={{\r
                    fontSize: autoscaleEnabled ? undefined : \`\${guiScale * 12}px\`,\r
                    transform: autoscaleEnabled ? \`scale(\${guiScale})\` : undefined,\r
                    transformOrigin: 'top left',\r
                    width: autoscaleEnabled ? \`\${100 / guiScale}%\` : '100%',\r
                    height: autoscaleEnabled ? \`\${100 / guiScale}%\` : '100%'\r
                }}\r
            >\r
\r
                <div className="absolute" style={{ top: 'var(--fluid-space-sm)', right: 'var(--fluid-space-sm)' }}>\r
                    <div className="hud-shell hud-command-cluster pointer-events-auto" style={{ gap: '0.42rem', padding: '0.34rem', borderRadius: '0.7rem' }}>\r
                        <Tooltip title="Neural Registry" content="Browse the full historical record of every entity that has existed in the simulation." position="left">\r
                            <button\r
                                onClick={() => setShowVectorDB(true)}\r
                                className="hud-shell-strong rounded flex items-center gap-2 transition-all h-full juice-interactive"\r
                                style={{ border: '1px solid rgba(57, 174, 169, 0.3)', padding: '0.52rem 0.78rem', borderRadius: '0.56rem' }}\r
                            >\r
                                <div className="rounded-full shadow-glow" style={{ width: '8px', height: '8px', background: '#39AEA9' }} />\r
                                <span className="text-[0.75rem] font-black tracking-[0.16em] litho-text uppercase">Registry</span>\r
                            </button>\r
                        </Tooltip>\r
\r
                        <div className="pointer-events-auto h-full" style={{ zIndex: 1000 }}>\r
                            <SensoryDropdown\r
                                showMasterDebug={showMasterDebug}\r
                                onToggleMasterDebug={setShowMasterDebug}\r
                                showVision={showVision}\r
                                onToggleVision={setShowVision}\r
                                showHearing={showHearing}\r
                                onToggleHearing={setShowHearing}\r
                                showCommunication={showCommunication}\r
                                onToggleCommunication={setShowCommunication}\r
                                showGrid={showGrid}\r
                                onToggleGrid={setShowGrid}\r
                            />\r
                        </div>\r
\r
                        <Tooltip title="Engine Settings" content="Configure visual scaling, simulation speed, and master reset parameters." position="left">\r
                            <button\r
                                onClick={() => setShowSettings(true)}\r
                                className="hud-shell rounded flex items-center justify-center transition-all h-full juice-interactive"\r
                                style={{ border: '1px solid rgba(162, 213, 171, 0.2)', padding: '0.52rem 0.72rem', borderRadius: '0.56rem' }}\r
                            >\r
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A2D5AB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>\r
                            </button>\r
                        </Tooltip>\r
                    </div>\r
                </div>\r
\r
                {/* Top-Left HUD & Registry */}\r
                <div className="absolute flex flex-row items-start" style={{ top: 'var(--fluid-space-sm)', left: 'var(--fluid-space-sm)', gap: '0.32rem' }}>\r
                    <ChronosHUD\r
                        simState={simState}\r
                        onOpenRegistry={() => setShowVectorDB(true)}\r
                    />\r
                    <ApexRegistry\r
                        simState={simState}\r
                        selectedId={selectedId}\r
                        onSelect={setSelectedId}\r
                        expanded={apexExpanded}\r
                        onToggle={() => {\r
                            const next = !apexExpanded;\r
                            setApexExpanded(next);\r
                            localStorage.setItem('ales_apex_expanded', String(next));\r
                        }}\r
                        sort={apexSort}\r
                        onSortChange={setApexSort}\r
                        onFocus={(id) => {\r
                            const target = simState.organisms.find(o => o.id === id);\r
                            if (target) setTargetFocus({ x: target.position.x, y: target.position.y });\r
                        }}\r
                    />\r
                </div>\r
\r
                {/* Floating Entity Inspector */}\r
                {displayedEntity && !showVectorDB && (\r
                    <EntityInspector\r
                        entity={displayedEntity}\r
                        organisms={[]} // We don't have the full list locally anymore, EntityInspector might need a fallback or message-based detail fetch\r
                        simTime={simState.time}\r
                        events={simState.events}\r
                        onClose={() => { setSelectedId(null); setHoveredId(null); }}\r
                        onOpenMemoryBrowser={(entityId) => {\r
                            setRegistryFocusId(entityId);\r
                            setShowVectorDB(true);\r
                        }}\r
                        onFocus={(id) => {\r
                            const target = simState.organisms.find(o => o.id === id);\r
                            if (target) setTargetFocus({ x: target.position.x, y: target.position.y });\r
                        }}\r
                        position={inspectorPos}\r
                        onPositionChange={setInspectorPos}\r
                    />\r
                )}\r
\r
                {/* Interaction Modals */}\r
                <SettingsModal\r
                    show={showSettings}\r
                    onClose={() => setShowSettings(false)}\r
                    guiScale={guiScale}\r
                    onGuiScaleChange={setGuiScale}\r
                    autoscaleEnabled={autoscaleEnabled}\r
                    onAutoscaleToggle={() => setAutoscaleEnabled(!autoscaleEnabled)}\r
                    onReset={() => setResetConfirm(true)}\r
                />\r
\r
                <ResetModal\r
                    show={resetConfirm}\r
                    onConfirm={handleMasterReset}\r
                    onCancel={() => setResetConfirm(false)}\r
                />\r
\r
                <NotificationPanel\r
                    events={simState.events}\r
                    expanded={logExpanded}\r
                    onToggleExpanded={() => setLogExpanded(prev => !prev)}\r
                    position={logPanelPos}\r
                    onPositionChange={setLogPanelPos}\r
                    onFocus={(pos, entityId) => {\r
                        setTargetFocus(pos);\r
                        if (entityId) setSelectedId(entityId);\r
                    }}\r
                />\r
\r
                {/* Bottom Control Bar */}\r
                <div className="absolute pointer-events-none" style={{ bottom: 'var(--fluid-space-sm)', right: 'var(--fluid-space-sm)' }}>\r
                    <div className="hud-shell hud-control-bar fluid-rounded-lg pointer-events-auto ml-auto" style={{ gap: '0.55rem', padding: '0.44rem 0.72rem', minHeight: '2.45rem' }}>\r
                        <button\r
                            onClick={() => setIsPaused(!isPaused)}\r
                            className="transition-all juice-interactive"\r
                            style={{ color: '#A2D5AB', border: 'none', background: 'none', cursor: 'pointer' }}\r
                        >\r
                            {isPaused ? (\r
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>\r
                            ) : (\r
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>\r
                            )}\r
                        </button>\r
                        <div className="hud-metric-pill text-[var(--text-xs)] litho-text font-black" style={{ color: '#39AEA9', opacity: 0.78, fontFamily: 'monospace', fontSize: '0.5rem', letterSpacing: '0.08em' }}>\r
                            VDB: {VectorDB.saveCount} saves | {VectorDB.lastSaveOrgCount} orgs | {VectorDB.lastSaveMs.toFixed(0)}ms\r
                        </div>\r
                        {simState.lastResetTime && (\r
                            <div className="hud-metric-pill text-[var(--text-xs)] litho-text font-black" style={{ color: '#A2D5AB', opacity: 0.72, fontFamily: 'monospace', fontSize: '0.5rem', letterSpacing: '0.06em' }}>\r
                                RESET: {simState.lastResetTime}\r
                            </div>\r
                        )}\r
                    </div>\r
                </div>\r
\r
                {showVectorDB && (\r
                    <VectorDBVisualizer\r
                        config={(engine as any).config}\r
                        onUpdateConfig={(newConfig) => (engine as any).updateConfig(newConfig)}\r
                        onHardReset={handleMasterReset}\r
                        onClose={() => {\r
                            setShowVectorDB(false);\r
                            setRegistryFocusId(null);\r
                        }}\r
                        initialSurnameFilter={surnameFilter}\r
                        initialSelectedId={registryFocusId}\r
                    />\r
                )}\r
            </div>\r
\r
            {/* Chat Assistant — rendered after GUI layer to ensure correct z-order */}\r
            <ChatAssistant simState={simState} />\r
\r
\r
        </div>\r
    );\r
};\r
\r
export default AppLoader;\r
`;export{e as default};
