const r=`import React from 'react';\r
import { createPortal } from 'react-dom';\r
import { OrganismData, FloraData, EntityData, TraitName, SimEvent, Vector2, Memory } from '../../types';\r
import { SIM_CONSTANTS, POPULATION_CONSTANTS, UNIT_UTILS } from '../core/Constants';\r
import { getSymbol, getSyntax } from '../entities/Fauna/Cognition/SymbolMap';\r
import { VectorDB } from '../data/VectorDB';\r
import Tooltip from './Tooltip';\r
\r
interface Props {\r
  entity: EntityData;\r
  organisms: OrganismData[];\r
  events: SimEvent[];\r
  simTime: number;\r
  onClose: () => void;\r
  onOpenMemoryBrowser: (entityId: string) => void;\r
  onFocus: (entityId: string | null) => void;\r
  position: Vector2;\r
  onPositionChange: (pos: Vector2) => void;\r
}\r
\r
const EntityInspector: React.FC<Props> = ({ entity, organisms, events, simTime, onClose, onOpenMemoryBrowser, onFocus, position, onPositionChange }) => {\r
  const [isDragging, setIsDragging] = React.useState(false);\r
  const [expandedSection, setExpandedSection] = React.useState<string | null>('traits');\r
  const [activeMemoryPopover, setActiveMemoryPopover] = React.useState<null | {\r
    key: string;\r
    x: number;\r
    y: number;\r
    title: string;\r
    summary: string;\r
    names: string[];\r
    notes: string[];\r
  }>(null);\r
  const inspectorRef = React.useRef<HTMLDivElement>(null);\r
  const activeMemoryPopoverRef = React.useRef<HTMLDivElement>(null);\r
\r
  // Drawer Toggle Logic\r
  const toggleSection = (id: string) => setExpandedSection(expandedSection === id ? null : id);\r
\r
  //  Type Detection\r
  const isFlora = 'growthState' in entity && (entity as any).growthState !== undefined;\r
  //const isFauna = !isFlora;\r
  const isFauna = 'memories' in entity && Array.isArray((entity as any).memories);\r
\r
\r
  // Time / Seasonal Logic\r
  const ageFrames = isFauna ? (entity as OrganismData).age : 0;\r
  const DAYS_PER_YEAR = SIM_CONSTANTS.DAYS_PER_SEASON * SIM_CONSTANTS.SEASONS_PER_CYCLE;\r
  const totalDays = Math.floor(UNIT_UTILS.toDays(ageFrames));\r
  const years = Math.floor(totalDays / DAYS_PER_YEAR);\r
  const daysInCurrentYear = totalDays % DAYS_PER_YEAR;\r
  // Assuming 'currentTick' is the total simulation time or organism age\r
  const birthDayTotal = Math.floor(UNIT_UTILS.toDays(isFauna ? ((entity as OrganismData).timestamp || 0) : 0));\r
  const birthDay = (birthDayTotal % SIM_CONSTANTS.DAYS_PER_SEASON) + 1;\r
  const birthSeason = Math.floor((birthDayTotal / SIM_CONSTANTS.DAYS_PER_SEASON) % SIM_CONSTANTS.SEASONS_PER_CYCLE) + 1;\r
\r
  // 1. Get frames passed ONLY in the current day (0 - 1799)\r
  const framesIntoDay = ageFrames % SIM_CONSTANTS.FRAMES_PER_DAY;\r
  // 2. Convert those frames into hours (0 - 23)\r
  const currentHour = Math.floor(framesIntoDay / SIM_CONSTANTS.FRAMES_PER_HOUR);\r
\r
  const formatGenerationOrdinal = React.useCallback((generation: number) => {\r
    const mod100 = generation % 100;\r
    if (mod100 >= 11 && mod100 <= 13) return \`\${generation}th gen\`;\r
\r
    const mod10 = generation % 10;\r
    if (mod10 === 1) return \`\${generation}st gen\`;\r
    if (mod10 === 2) return \`\${generation}nd gen\`;\r
    if (mod10 === 3) return \`\${generation}rd gen\`;\r
    return \`\${generation}th gen\`;\r
  }, []);\r
\r
  const formatAgeReadout = React.useCallback((frames: number) => {\r
    const totalWholeDays = Math.floor(UNIT_UTILS.toDays(frames));\r
    const ageYears = Math.floor(totalWholeDays / DAYS_PER_YEAR);\r
    const ageDays = totalWholeDays % DAYS_PER_YEAR;\r
    const ageHours = Math.floor((frames % SIM_CONSTANTS.FRAMES_PER_DAY) / SIM_CONSTANTS.FRAMES_PER_HOUR);\r
    return \`\${ageHours} Hr \${ageDays} D \${ageYears} Y\`;\r
  }, [DAYS_PER_YEAR]);\r
\r
  const lifespanFrames = isFauna ? (((entity as OrganismData).expressedStats as any)?.lifespan ?? 0) : 0;\r
  const lifespanRemainingRatio = isFauna && lifespanFrames > 0\r
    ? Math.max(0, Math.min(1, 1 - (ageFrames / lifespanFrames)))\r
    : 0;\r
\r
  const nameLines = React.useMemo(() => {\r
    const trimmedName = (entity.name || '').trim();\r
    if (!trimmedName) return { firstLine: '', secondLine: '' };\r
\r
    const parts = trimmedName.split(/\\s+/);\r
    if (parts.length === 1) return { firstLine: parts[0], secondLine: '' };\r
\r
    return {\r
      firstLine: parts[0],\r
      secondLine: parts.slice(1).join(' ')\r
    };\r
  }, [entity.name]);\r
\r
  // Energy Calculation figures\r
  const stats = isFauna ? (entity as OrganismData).expressedStats : {};\r
  const m = (stats as any).metabolism ?? 0;\r
  const s = (stats as any).speed ?? 0;\r
  const z = (stats as any).size ?? 0;\r
  const drainTotal = (m * s * z).toFixed(2);\r
  // Get Long term memory count\r
  const ltMemoryCount = React.useMemo(() => {\r
    if (!isFauna) return 0;\r
    // Use a direct query if your VectorDB supports it, otherwise find\r
    const history = VectorDB.getHistory().find(o => o.id === entity.id);\r
    return history?.memories?.length || 0;\r
  }, [entity.id, simTime]); // simTime trigger ensures it updates as sim ticks\r
\r
  // 1. Refactor the Memoization Logic\r
  const relatives = React.useMemo(() => {\r
    if (isFlora) return [];\r
    const fauna = entity as OrganismData;\r
    if (!fauna.surname) return [];\r
\r
    // Fallback: if 'organisms' is empty (common when worker handles physics), use VectorDB history\r
    const sourcePool = (organisms && organisms.length > 0) ? organisms : (VectorDB.getHistory() as OrganismData[]);\r
\r
    return sourcePool\r
      .filter(other => {\r
        // Robust check: Ensure we aren't comparing to self, and match surnames (case-insensitive)\r
        const matchesSurname = other.surname?.toLowerCase() === fauna.surname.toLowerCase();\r
        return other.id !== fauna.id && matchesSurname;\r
      })\r
      // Sort by age to show the "elders" of the relatives first, then slice\r
      .sort((a, b) => b.age - a.age)\r
      .slice(0, 10); // Expanded to 10 for better visibility\r
  }, [entity.id, (entity as OrganismData).surname, organisms, isFlora]);\r
\r
  React.useEffect(() => {\r
    if (!activeMemoryPopover) return;\r
\r
    const handlePointerDown = (event: MouseEvent) => {\r
      const target = event.target as Node | null;\r
      if (activeMemoryPopoverRef.current?.contains(target)) return;\r
      if (inspectorRef.current?.contains(target)) {\r
        const interactive = target instanceof HTMLElement ? target.closest('[data-memory-popover-trigger="true"]') : null;\r
        if (interactive) return;\r
      }\r
      setActiveMemoryPopover(null);\r
    };\r
\r
    const handleEscape = (event: KeyboardEvent) => {\r
      if (event.key === 'Escape') setActiveMemoryPopover(null);\r
    };\r
\r
    window.addEventListener('mousedown', handlePointerDown);\r
    window.addEventListener('keydown', handleEscape);\r
    return () => {\r
      window.removeEventListener('mousedown', handlePointerDown);\r
      window.removeEventListener('keydown', handleEscape);\r
    };\r
  }, [activeMemoryPopover]);\r
\r
  const handleMouseDown = (e: React.MouseEvent) => {\r
    if ((e.target as HTMLElement).closest('button')) return;\r
    e.stopPropagation();\r
    setIsDragging(true);\r
    const startX = e.clientX;\r
    const startY = e.clientY;\r
    const startPos = { ...position };\r
\r
    const onMouseMove = (moveEvent: MouseEvent) => {\r
      onPositionChange({\r
        x: startPos.x + (moveEvent.clientX - startX),\r
        y: startPos.y + (moveEvent.clientY - startY)\r
      });\r
    };\r
\r
    const onMouseUp = () => {\r
      setIsDragging(false);\r
      window.removeEventListener('mousemove', onMouseMove);\r
      window.removeEventListener('mouseup', onMouseUp);\r
    };\r
\r
    window.addEventListener('mousemove', onMouseMove);\r
    window.addEventListener('mouseup', onMouseUp);\r
  };\r
  // --- traitConfig ---\r
  const traitConfig: Record<TraitName, { name: string, unit: string, icon: string, desc: string }> = {\r
    speed: { name: "Speed", unit: "meter/s", icon: "⚡", desc: "Maximum movement velocity. Higher speed consumes more energy per tick." },\r
    size: { name: "Size", unit: "centimeter", icon: "📐", desc: "Physical diameter. Larger organisms have higher metabolic costs but can dominate interactions." },\r
    metabolism: { name: "Metabolism", unit: "% efficiency", icon: "💎", desc: "Energy conversion efficiency. Lower percentage means higher energy burn rate." },\r
    sight_range: { name: "Vision Range", unit: "meter", icon: "👁️", desc: "Maximum distance at which the entity can detect visual stimuli." },\r
    sight_fov: { name: "Vision FoV", unit: "degrees", icon: "🔭", desc: "Field of View angle. Wider angles allow seeing more but may reduce focus." },\r
    lifespan: { name: "Lifespan", unit: "Days", icon: "⌛", desc: "Biological limit of the organism's existence in simulation days." },\r
    audible_range: { name: "Hearing", unit: "meter", icon: "🔊", desc: "Radius for detecting sound events from other entities." },\r
    communicating_range: { name: "Vocalization", unit: "meter", icon: "🗣️", desc: "Transmission radius for social interactions and data sharing." },\r
  };\r
\r
  const getMemorySyntaxStr = (memory: Memory) => {\r
    const isGroup = (memory.entityIds?.length || 0) > 1;\r
    return getSyntax(memory.type, memory.content, memory.isFamiliar, isGroup);\r
  };\r
\r
  const getMemoryNames = React.useCallback((memory: Memory) => {\r
    const names = new Set<string>();\r
\r
    if (memory.data?.name) names.add(memory.data.name);\r
    if (memory.content && !memory.content.startsWith('Ate ')) names.add(memory.content);\r
    if (memory.content?.startsWith('Ate ')) names.add(memory.content.replace('Ate ', ''));\r
\r
    for (const entityId of memory.entityIds || []) {\r
      const organism = organisms.find(o => o.id === entityId);\r
      if (organism?.name) names.add(organism.name);\r
    }\r
\r
    return Array.from(names).filter(Boolean);\r
  }, [organisms]);\r
\r
  const getGroupNamesTooltip = (memory: Memory) => {\r
    const names = getMemoryNames(memory);\r
    return names.length > 0 ? names.join(', ') : memory.content;\r
  };\r
\r
  const getMemoryDetailText = React.useCallback((row: {\r
    memory: Memory;\r
    stackedCount: number;\r
    pinned: boolean;\r
    occurrences: number;\r
    names: string[];\r
    notes: string[];\r
  }) => {\r
    const { memory, stackedCount, pinned, names, notes } = row;\r
    const primaryName = names[0] || memory.content;\r
\r
    if (memory.type === 'Food') {\r
      return \`\${getMemorySyntaxStr(memory)} I found food at \${stackedCount > 1 ? \`\${stackedCount} recent locations\` : primaryName}.\`;\r
    }\r
\r
    if (memory.type === 'Flora') {\r
      return \`\${getMemorySyntaxStr(memory)} I ate \${stackedCount > 1 ? \`\${stackedCount} nearby food sources recently\` : primaryName}.\`;\r
    }\r
\r
    if (memory.type === 'Fauna' && memory.isFamiliar) {\r
      return \`\${getMemorySyntaxStr(memory)} I met \${primaryName} again; we are already familiar to one another.\`;\r
    }\r
\r
    if (memory.type === 'Fauna' && (memory.entityIds?.length || 0) > 1) {\r
      return \`\${getMemorySyntaxStr(memory)} I encountered a group of fauna, including \${names.slice(0, 3).join(', ')}\${names.length > 3 ? ', and others' : ''}.\`;\r
    }\r
\r
    if (memory.type === 'Fauna') {\r
      return \`\${getMemorySyntaxStr(memory)} I noticed \${stackedCount > 1 ? \`\${stackedCount} fauna encounters\` : primaryName}.\`;\r
    }\r
\r
    if (memory.type === 'THREAT') {\r
      return \`\${getMemorySyntaxStr(memory)} I detected a threat nearby.\`;\r
    }\r
\r
    if (memory.type === 'MATE') {\r
      return \`\${getMemorySyntaxStr(memory)} I identified a potential mate.\`;\r
    }\r
\r
    if (memory.type === 'SectorScan') {\r
      return \`\${getMemorySyntaxStr(memory)} I completed a scan of the nearby sector.\`;\r
    }\r
\r
    return \`\${getMemorySyntaxStr(memory)} \${notes[0] || memory.content}\`;\r
  }, []);\r
\r
  const stackWindowFrames = SIM_CONSTANTS.FRAMES_PER_DAY;\r
\r
  const isPinnedMemory = React.useCallback((memory: Memory) => {\r
    // Keep bonding/familiar social memories pinned until the user chooses the final important-memory set.\r
    return memory.type === 'Fauna' && !!memory.isFamiliar;\r
  }, []);\r
\r
  const getStackSignature = React.useCallback((memory: Memory) => {\r
    if (isPinnedMemory(memory)) {\r
      const entityIdsKey = [...(memory.entityIds || [])].sort().join('|');\r
      const targetId = memory.data?.id || '';\r
      return ['PINNED', memory.type, targetId, entityIdsKey, memory.isFamiliar ? '1' : '0'].join('::');\r
    }\r
\r
    if (memory.type === 'Food') return 'QUEUE::Food::visible-food';\r
    if (memory.type === 'Flora') return 'QUEUE::Flora::consumed-flora';\r
    if (memory.type === 'Fauna') {\r
      return (memory.entityIds?.length || 0) > 1\r
        ? 'QUEUE::Fauna::group-encounter'\r
        : 'QUEUE::Fauna::ambient-encounter';\r
    }\r
\r
    if (memory.type === 'SectorScan') return 'QUEUE::SectorScan::scan';\r
    if (memory.type === 'THREAT') return 'QUEUE::THREAT::threat';\r
    if (memory.type === 'MATE') return 'QUEUE::MATE::mate';\r
\r
    return \`QUEUE::\${memory.type}::generic\`;\r
  }, [isPinnedMemory]);\r
\r
  const openMemoryPopover = React.useCallback((event: React.MouseEvent<HTMLButtonElement>, row: {\r
    key: string;\r
    memory: Memory;\r
    stackedCount: number;\r
    pinned: boolean;\r
    occurrences: number;\r
    names: string[];\r
    notes: string[];\r
  }) => {\r
    if (row.names.length === 0) return;\r
\r
    const rect = event.currentTarget.getBoundingClientRect();\r
    const preferredX = rect.left - 8;\r
    const preferredY = rect.bottom + 8;\r
    const width = 260;\r
    const height = 220;\r
\r
    setActiveMemoryPopover({\r
      key: row.key,\r
      x: Math.max(12, Math.min(preferredX, window.innerWidth - width - 12)),\r
      y: Math.max(12, Math.min(preferredY, window.innerHeight - height - 12)),\r
      title: row.pinned ? 'Pinned Memory Detail' : row.stackedCount > 1 ? 'Stacked Memory Detail' : 'Memory Detail',\r
      summary: getMemoryDetailText(row),\r
      names: row.names,\r
      notes: row.notes,\r
    });\r
  }, [getMemoryDetailText]);\r
\r
\r
\r
  const memoryDisplayRows = React.useMemo(() => {\r
    if (!isFauna) return [];\r
\r
    const rows: Array<{\r
      key: string;\r
      memory: Memory;\r
      occurrences: number;\r
      stackedCount: number;\r
      pinned: boolean;\r
      newestTimestamp: number;\r
      names: Set<string>;\r
      notes: Set<string>;\r
    }> = [];\r
\r
    const memories = (entity as OrganismData).memories\r
      .slice()\r
      .sort((a, b) => a.timestamp - b.timestamp);\r
\r
    for (const memory of memories) {\r
      const signature = getStackSignature(memory);\r
      const stackWindow = stackWindowFrames;\r
      const baseCount = Math.max(1, memory.count || 1);\r
\r
      let matchedRow = null;\r
      for (let i = rows.length - 1; i >= 0; i--) {\r
        const row = rows[i];\r
        if (!row.pinned && row.key === signature && (memory.timestamp - row.newestTimestamp) <= stackWindow) {\r
          matchedRow = row;\r
          break;\r
        }\r
      }\r
\r
      if (matchedRow) {\r
        matchedRow.memory = memory;\r
        matchedRow.newestTimestamp = memory.timestamp;\r
        matchedRow.occurrences += 1;\r
        matchedRow.stackedCount += baseCount;\r
        for (const name of getMemoryNames(memory)) matchedRow.names.add(name);\r
        matchedRow.notes.add(memory.content);\r
      } else {\r
        rows.push({\r
          key: signature,\r
          memory,\r
          occurrences: 1,\r
          stackedCount: baseCount,\r
          pinned: isPinnedMemory(memory),\r
          newestTimestamp: memory.timestamp,\r
          names: new Set(getMemoryNames(memory)),\r
          notes: new Set(memory.content ? [memory.content] : []),\r
        });\r
      }\r
    }\r
\r
    return rows\r
      .sort((a, b) => {\r
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;\r
        if (a.newestTimestamp !== b.newestTimestamp) return b.newestTimestamp - a.newestTimestamp;\r
        return b.stackedCount - a.stackedCount;\r
      })\r
      .map(row => ({\r
        ...row,\r
        names: Array.from(row.names),\r
        notes: Array.from(row.notes),\r
      }));\r
  }, [entity, getMemoryNames, getStackSignature, isFauna, isPinnedMemory, stackWindowFrames]);\r
\r
  return (\r
    <div\r
      ref={inspectorRef}\r
      style={{\r
        left: \`\${Math.max(10, Math.min(position.x, window.innerWidth - 300))}px\`,\r
        top: \`\${Math.max(10, Math.min(position.y, window.innerHeight - 100))}px\`,\r
        position: 'fixed',\r
        width: '16rem', // Stabilized width to prevent layout jitter on expansion\r
        height: 'fit-content', // Changed from fit-content for reliable expansion\r
        minWidth: '16rem', // Fixed invalid 'content' keyword\r
        maxWidth: '16rem',\r
        maxHeight: '90vh', // Root level safety cap\r
        zIndex: 999,\r
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',\r
        border: '1px solid rgba(162, 213, 171, 0.15)',\r
        cursor: isDragging ? 'grabbing' : 'default'\r
      }}\r
      className="glass-modular fluid-rounded flex flex-col pointer-events-auto"\r
      onWheel={(e) => e.stopPropagation()}\r
    >\r
      {/* Header: Name with Hanging Indent */}\r
      <div\r
        className="fluid-rounded-t flex flex-col overflow-hidden"\r
        style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}\r
      >\r
        <div\r
          onMouseDown={handleMouseDown}\r
          className="fluid-p-md flex items-start justify-between"\r
          style={{ cursor: 'grab' }}\r
        >\r
          {/* Entity Observer */}\r
          <div className="flex flex-col select-none w-full" style={{ marginRight: '0.75rem', minWidth: 0 }}>\r
            <div className="flex items-start justify-between" style={{ gap: '0.45rem', marginBottom: '0.5rem' }}>\r
              {/* ANNOTATED SECTION: Organism Name Display */}\r
              <Tooltip\r
                title="Species Details"\r
                content={\`Information about \${entity.name}. Carrying a unique genetic blueprint focused on survival and adaptation within the simulation.\`}\r
                position="right"\r
              >\r
                <div\r
                  className="text-[var(--text-xl)] font-bold litho-text relative group"\r
                  style={{\r
                    color: isFlora ? '#A2D5AB' : '#ccde89ff',\r
                    lineHeight: '1.05rem',\r
                    flex: 1,\r
                    minWidth: 0,\r
                    whiteSpace: 'normal',\r
                    cursor: 'help',\r
                    display: 'flex',\r
                    alignItems: 'flex-start',\r
                    gap: '0.5rem'\r
                  }}\r
                >\r
                  <span\r
                    className="fluid-rounded-full"\r
                    style={{\r
                      display: 'inline-block', width: '1rem', height: '0.5rem',\r
                      background: entity.color || '#39AEA9', marginTop: '0.22rem', flexShrink: 0,\r
                      boxShadow: \`0 0 10px \${entity.color || '#39AEA9'}\`\r
                    }}\r
                  />\r
                  <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'visible' }}>\r
                    <span style={{ whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'clip' }}>{nameLines.firstLine}</span>\r
                    {nameLines.secondLine ? (\r
                      <span style={{ whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'clip' }}>{nameLines.secondLine}</span>\r
                    ) : null}\r
                  </span>\r
                </div>\r
              </Tooltip>\r
              <div className="flex items-center" style={{ gap: '0.35rem', flexShrink: 0 }}>\r
                <button\r
                  onClick={(e) => { e.stopPropagation(); toggleSection('bio'); }}\r
                  className="transition-all juice-interactive fluid-rounded"\r
                  style={{\r
                    fontSize: '0.68rem',\r
                    fontWeight: 800,\r
                    color: '#39AEA9',\r
                    display: 'flex',\r
                    alignItems: 'center',\r
                    gap: '0.32rem',\r
                    border: '1px solid rgba(57, 174, 169, 0.38)',\r
                    background: 'rgba(57, 174, 169, 0.08)',\r
                    boxShadow: '0 0 14px rgba(57, 174, 169, 0.14)',\r
                    padding: '0.28rem 0.38rem',\r
                    textTransform: 'none',\r
                    lineHeight: 1\r
                  }}\r
                >\r
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">\r
                    <path d="M12 7v14" />\r
                    <path d="M16 12h2" />\r
                    <path d="M16 8h2" />\r
                    <path d="M3 18V6a2 2 0 0 1 2-2h7a4 4 0 0 1 4 4v12a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" />\r
                    <path d="M16 18a2 2 0 0 1 2-2h3V4h-3a2 2 0 0 0-2 2" />\r
                  </svg>\r
                  <span>Bio</span>\r
                </button>\r
                <button\r
                  onClick={(e) => { e.stopPropagation(); onClose(); }}\r
                  className="fluid-rounded transition-all juice-interactive"\r
                  style={{\r
                    border: '1px solid rgba(57, 174, 169, 0.38)',\r
                    background: 'rgba(57, 174, 169, 0.08)',\r
                    boxShadow: '0 0 14px rgba(57, 174, 169, 0.14)',\r
                    cursor: 'pointer',\r
                    color: '#39AEA9',\r
                    display: 'flex',\r
                    alignItems: 'center',\r
                    justifyContent: 'center',\r
                    width: '1.65rem',\r
                    height: '1.65rem',\r
                    padding: 0,\r
                    lineHeight: 1\r
                  }}\r
                >\r
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>\r
                </button>\r
              </div>\r
            </div>\r
            {/* Sub-header row: Age (Left) */}\r
            <div className="flex items-start justify-between w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', gap: '0.6rem' }}>\r
\r
              <div className="flex flex-col justify-start" style={{ flex: 1, alignSelf: 'stretch', minWidth: 0, gap: '0.24rem' }}>\r
                <div className="opacity-60 font-black" style={{ fontSize: 'var(--text-lg)', color: isFlora ? '#39AEA9' : '#A2D5AB', lineHeight: 1, marginTop: 0 }}>\r
                  {isFauna ? formatAgeReadout(ageFrames) : 'Biological Organism'}\r
                </div>\r
                {isFauna && (\r
                  <div className="w-full fluid-rounded-full overflow-hidden" style={{ height: '0.26rem', background: 'rgba(255,255,255,0.08)' }}>\r
                    <div\r
                      className="h-full transition-all duration-500"\r
                      style={{\r
                        width: \`\${lifespanRemainingRatio * 100}%\`,\r
                        background: lifespanRemainingRatio > 0.5 ? '#A2D5AB' : lifespanRemainingRatio > 0.2 ? '#E5EFC1' : '#39AEA9'\r
                      }}\r
                    />\r
                  </div>\r
                )}\r
              </div>\r
            </div>\r
          </div>\r
        </div>\r
        {/* \r
            PURPOSE: BIOLOGICAL NARRATIVE (Bio)\r
            Provides a generated backstory or ecological context for the entity.\r
            INTERACTION: Auto-closes on mouse exit to reduce visual clutter.\r
        */}\r
        {expandedSection === 'bio' && (\r
          <div\r
            onMouseLeave={() => setExpandedSection(null)}\r
            className="fluid-px-sm fluid-pb-sm animate-fade-in"\r
            style={{ fontSize: 'var(--text-xs)', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}\r
          >\r
            <div className="opacity-60 font-bold" style={{ color: '#A2D5AB', marginBottom: '4px', fontSize: '0.55rem' }}>\r
              {isFauna ? \`Origin: Day \${birthDay} • Season \${birthSeason}\` : 'Origin: Spontaneous Bloom'}\r
            </div>\r
            <p className="italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)', whiteSpace: 'normal', margin: 0 }}>\r
              {isFauna\r
                ? "An entity of quiet calculation. It carries the biological markers of a lineage that thrives in the twilight hours of the simulation."\r
                : "A silent architect of the simulation's atmosphere. This organism converts raw energy into a nutrient-dense cache through slow, algorithmic maturity."\r
              }\r
            </p>\r
          </div>\r
        )}\r
      </div>\r
\r
      {/* \r
          PURPOSE: MAIN DATA MODULES\r
          Houses the primary scrollable content including lineage, metabolism, traits, and memories.\r
      */}\r
      <div className="fluid-p-sm flex flex-col gap-2 overflow-y-auto custom-scrollbar">\r
\r
        {/* \r
            PURPOSE: CLAN & LINEAGE (House)\r
            Displays generational depth and family name. \r
            Fallbacks to VectorDB if active physics are offloaded.\r
        */}\r
        {isFauna && (\r
          <div\r
            className="fluid-rounded transition-all"\r
            style={{\r
              border: expandedSection === 'relatives' ? '1px solid rgba(162, 213, 171, 0.27)' : '1px solid rgba(255,255,255,0.05)',\r
              background: expandedSection === 'relatives' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.02)'\r
            }}\r
          >\r
            <button\r
              onClick={() => toggleSection('relatives')}\r
              className="w-full fluid-p-sm flex flex-col fluid-gap-xs"\r
              style={{ border: 'none', background: 'none', cursor: 'pointer' }}\r
            >\r
              <div className="flex justify-between items-center w-full">\r
                <div className="flex flex-col items-start" style={{ minWidth: 0, flex: 1, gap: '0.1rem' }}>\r
                  <Tooltip\r
                    title="House Lineage"\r
                    content="The generational count and house surname of this organism's lineage."\r
                    position="top"\r
                  >\r
                    <span className="text-[var(--text-xs)] font-black whitespace-nowrap" style={{ color: 'rgba(109, 242, 235, 1)', textTransform: 'uppercase', cursor: 'help' }}>\r
                      Lineage\r
                    </span>\r
                  </Tooltip>\r
                  <span className="text-[var(--text-sm)] font-black whitespace-nowrap" style={{ color: '#E5EFC1', fontFamily: 'monospace', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>\r
                    {formatGenerationOrdinal((entity as OrganismData).generation)} | {(entity as OrganismData).surname}\r
                  </span>\r
                </div>\r
              </div>\r
              <div className="w-full fluid-rounded-full overflow-hidden" style={{ height: '6px', background: 'rgba(255,255,255,0.05)' }}>\r
                <div\r
                  className="h-full transition-all duration-500 shadow-glow"\r
                  style={{\r
                    width: \`\${Math.min(100, ((entity as OrganismData).energy / POPULATION_CONSTANTS.BIRTH_COST_BASE) * 100)}%\`,\r
                    // Changes to a pinkish/gold glow when threshold is met\r
                    background: (entity as OrganismData).energy >= POPULATION_CONSTANTS.BIRTH_COST_BASE\r
                      ? 'rgba(255, 105, 180, 1)'\r
                      : 'rgba(109, 242, 235, 1)'\r
                  }}\r
                />\r
              </div>\r
            </button>\r
            {expandedSection === 'relatives' && (\r
              <div\r
                className="fluid-px-sm fluid-pb-sm flex flex-col gap-1 animate-fade-in"\r
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem' }}\r
              >\r
                {relatives.length > 0 ? relatives.map(rel => (\r
                  <div\r
                    key={rel.id}\r
                    onClick={() => onFocus(rel.id)}\r
                    className="flex justify-between items-center fluid-p-xxs px-3 fluid-rounded opacity-60 hover:opacity-100 cursor-pointer text-[11px]"\r
                    style={{\r
                      background: 'rgba(255,255,255,0.01)',\r
                      border: '1px solid rgba(255,255,255,0.03)',\r
                      color: 'rgba(109, 242, 235, 1)'\r
                    }}\r
                  >\r
                    <span className="flex items-center gap-1">\r
                      <span className="opacity-40">•</span>\r
                      {rel.name}\r
                    </span>\r
                    <span className="text-[0.55rem] font-black opacity-30 tracking-widest">VIEW</span>\r
                  </div>\r
                )) : (\r
                  <div className="text-center opacity-20 italic text-[0.6rem] py-2 uppercase tracking-widest">No living members found</div>\r
                )}\r
              </div>\r
            )}\r
          </div>\r
        )}\r
\r
        {/* \r
            PURPOSE: METABOLISM & ENERGY SINK\r
            Calculates real-time energy drain (Fauna) or maturity yield (Flora).\r
        */}\r
        <div\r
          className="fluid-rounded transition-all"\r
          style={{\r
            border: expandedSection === 'energy' ? '1px solid rgba(57, 174, 169, 0.27)' : '1px solid rgba(255,255,255,0.05)',\r
            background: expandedSection === 'energy' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.02)'\r
          }}\r
        >\r
          <button\r
            onClick={() => toggleSection('energy')}\r
            className="w-full fluid-p-sm flex flex-col fluid-gap-xs"\r
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}\r
          >\r
            <div className="flex justify-between items-center w-full">\r
              <div className="flex flex-col items-start">\r
                <Tooltip\r
                  title={isFlora ? "Maturation Threshold" : "Metabolic Efficiency"}\r
                  content={isFlora ? "Plants yield energy based on their current growth state. 1.0 = Max Nutrients." : "Energy consumption is calculated as (Metabolism % × Current Speed × Body Size)."}\r
                  position="top"\r
                >\r
                  <span className="text-[var(--text-xs)] font-black" style={{ color: 'rgba(109, 242, 235, 1)', textTransform: 'uppercase', cursor: 'help' }}>\r
                    {isFlora ? "Yield Potential" : "Metabolism"}\r
                  </span>\r
                </Tooltip>\r
                <span className="text-[var(--text-sm)] font-black" style={{ color: 'rgba(109, 242, 235, 1)', fontFamily: 'monospace' }}>\r
                  {isFlora\r
                    ? (Math.floor((entity as FloraData).energyValue * (entity as FloraData).growthState))\r
                    : drainTotal\r
                  }\r
                  <span style={{ fontSize: 'var(--text-xs)', opacity: 0.5 }}>{isFlora ? " Energy" : " E/s"}</span>\r
                </span>\r
              </div>\r
              <div className="text-right">\r
                <span className="text-[var(--text-xs)] font-black" style={{ color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', paddingRight: '0.3rem' }}>\r
                  {isFlora ? "Maturity" : "Energy"}\r
                </span>\r
                <span className="text-[var(--text-sm)] font-black" style={{ color: '#E5EFC1', fontFamily: 'monospace' }}>\r
                  {isFlora\r
                    ? ((entity as FloraData).growthState * 100).toFixed(0) + "%"\r
                    : Math.floor((entity as OrganismData).energy)\r
                  }\r
                </span>\r
              </div>\r
            </div>\r
            <div className="w-full fluid-rounded-full overflow-hidden" style={{ height: '6px', background: 'rgba(255,255,255,0.05)' }}>\r
              <div\r
                className="h-full transition-all duration-500 shadow-glow"\r
                style={{\r
                  width: \`\${isFlora ? ((entity as FloraData).growthState * 100) : Math.min(100, ((entity as OrganismData).energy / 30000) * 100)}%\`,\r
                  background: isFlora ? '#A2D5AB' : '#39AEA9'\r
                }}\r
              />\r
            </div>\r
          </button>\r
          {expandedSection === 'energy' && (\r
            <div\r
              className="fluid-px-sm fluid-pb-sm animate-fade-in"\r
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}\r
            >\r
              {isFauna ? (\r
                <div className="grid grid-cols-1 font-bold" style={{ gap: '4px', fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.3)' }}>\r
                  <div className="flex justify-between"><span>Metabolism (M)</span><span style={{ color: 'rgba(255,255,255,0.6)' }}>{m.toFixed(2)}</span></div>\r
                  <div className="flex justify-between"><span>Speed Load (S)</span><span style={{ color: 'rgba(255,255,255,0.6)' }}>× {s.toFixed(2)}</span></div>\r
                  <div className="flex justify-between"><span>Scale Factor (Z)</span><span style={{ color: 'rgba(255,255,255,0.6)' }}>× {z.toFixed(2)}</span></div>\r
                  <div className="flex justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '4px', paddingTop: '4px', color: '#39AEA9' }}>\r
                    <span>Total Calculated Drain</span>\r
                    <span>{drainTotal} E/s</span>\r
                  </div>\r
                </div>\r
              ) : (\r
                <div className="grid grid-cols-1 font-bold" style={{ gap: '4px', fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.3)' }}>\r
                  <div className="flex justify-between"><span>Base Harvest</span><span style={{ color: 'rgba(255,255,255,0.6)' }}>{(entity as FloraData).energyValue} Energy</span></div>\r
                  <div className="flex justify-between"><span>Growth Scalar</span><span style={{ color: 'rgba(255,255,255,0.6)' }}>× {(entity as FloraData).growthState.toFixed(2)}</span></div>\r
                  <div className="flex justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '4px', paddingTop: '4px', color: '#A2D5AB' }}>\r
                    <span>Current Energy Payoff</span>\r
                    <span>{Math.floor((entity as FloraData).energyValue * (entity as FloraData).growthState)} Energy</span>\r
                  </div>\r
                </div>\r
              )}\r
            </div>\r
          )}\r
        </div>\r
\r
        {/* \r
            PURPOSE: GENETIC TRAITS (Genome)\r
            Visualizes expressed stats vs. underlying alleles (alleles visible as dual-bar indicators).\r
        */}\r
        <div className="grid grid-cols-1 fluid-gap-xs">\r
          {isFauna ? (Object.keys(traitConfig) as TraitName[]).map(trait => {\r
            const fauna = entity as OrganismData;\r
            const config = traitConfig[trait];\r
            // Safety Check: Old genomes might allow new traits\r
            if (!config) return null;\r
\r
            const alleles = fauna.genome.traits[trait];\r
            const val = fauna.expressedStats[trait];\r
\r
            if (!alleles || val === undefined) return null;\r
\r
            let displayVal = val.toFixed(1);\r
            if (trait === 'sight_fov') displayVal = Math.round(UNIT_UTILS.toDegrees(val)).toString();\r
            if (trait === 'lifespan') displayVal = Math.floor(UNIT_UTILS.toDays(val)).toString();\r
            if (trait === 'sight_range') displayVal = val.toFixed(1);\r
            if (trait === 'metabolism') displayVal = (val * 100).toFixed(0);\r
\r
            return (\r
              <Tooltip key={trait} title={config.name} content={config.desc} position="left">\r
                <div className="flex items-center justify-between fluid-p-xs fluid-rounded" style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', cursor: 'help' }}>\r
                  <div className="flex items-center fluid-gap-sm">\r
                    <span style={{ opacity: 0.3 }}>{config.icon}</span>\r
                    <div className="flex flex-col">\r
                      <span className="font-bold opacity-20 uppercase tracking-widest" style={{ fontSize: '0.55rem', color: 'white' }}>{config.name}</span>\r
                      <span className="text-[var(--text-sm)] font-black" style={{ color: '#E5EFC1', fontFamily: 'monospace' }}>\r
                        {displayVal}<span style={{ fontSize: '0.6rem', marginLeft: '2px', opacity: 0.2 }}>{config.unit}</span>\r
                      </span>\r
                    </div>\r
                  </div>\r
                  <div style={{ width: '2.5rem' }}>\r
                    <div className="flex h-1" style={{ gap: '2px', marginBottom: '4px' }}>\r
                      <div className="flex-1 fluid-rounded-full" style={{ background: alleles.d1 >= alleles.d2 ? '#39AEA9' : 'rgba(255,255,255,0.1)' }} />\r
                      <div className="flex-1 fluid-rounded-full" style={{ background: alleles.d2 > alleles.d1 ? '#A78BFA' : 'rgba(255,255,255,0.1)' }} />\r
                    </div>\r
                  </div>\r
                </div>\r
              </Tooltip>\r
            );\r
          }) : [\r
            { id: 'ratio', name: 'Growth Rate', icon: '🌱', val: ((entity as FloraData).genome.traits.structure.v1 * 24 * 100).toFixed(2), unit: '%', desc: 'The daily expansion speed of this organism relative to the simulation seasonal cycle.' },\r
            { id: 'nodes', name: 'Structural Segments', icon: '🌿', val: (entity as FloraData).genome.traits.structure.v2.toFixed(0), unit: ' Segments', desc: 'The branching complexity of the organism. More segments lead to higher energy density.' },\r
            { id: 'stem', name: 'Stem Mass', icon: '🌳', val: (entity as FloraData).genome.traits.ecology.v2.toFixed(1), unit: ' mm', desc: 'The physical thickness of the main structure, contributing to overall survival and nutrient yield.' },\r
            { id: 'leaf', name: 'Surface Area', icon: '🍀', val: (entity as FloraData).genome.traits.morphology.v1.toFixed(1), unit: ' Scale', desc: 'The scale of leaf structures that capture energy from the environment.' }\r
          ].map(trait => (\r
            <Tooltip key={trait.id} title={trait.name} content={trait.desc} position="left">\r
              <div className="flex items-center justify-between fluid-p-xs fluid-rounded" style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(162, 213, 171, 0.05)', cursor: 'help' }}>\r
                <div className="flex items-center fluid-gap-sm">\r
                  <span style={{ opacity: 0.3 }}>{trait.icon}</span>\r
                  <div className="flex flex-col">\r
                    <span className="font-bold opacity-20 uppercase tracking-widest" style={{ fontSize: '0.55rem', color: 'white' }}>{trait.name}</span>\r
                    <span className="text-[var(--text-sm)] font-black" style={{ color: '#A2D5AB', fontFamily: 'monospace' }}>\r
                      {trait.val}<span style={{ fontSize: '0.6rem', marginLeft: '2px', opacity: 0.2 }}>{trait.unit}</span>\r
                    </span>\r
                  </div>\r
                </div>\r
              </div>\r
            </Tooltip>\r
          ))}\r
        </div>\r
\r
        {/* \r
            AXIOMATIC INTENT: The memories readout is a user-facing interpretation layer, not a raw dump.\r
            It must preserve the organism's underlying memory data while compressing rapid repeat noise into queue-like one-day stacks and surfacing consequential events first.\r
            AXIOLOGICAL INTENT: Prioritize readability, salience, and ecological storytelling so rare or meaningful memories remain visible during high-update moments.\r
            DO NOT REMOVE OR WEAKEN THIS CONTRACT DURING FUTURE GUI REWORKS WITHOUT EXPLICIT USER APPROVAL.\r
            PURPOSE: NEURAL RECORDS (Memories)\r
            Short-term (ST) and Long-term (LT) memory lists. ST items use ideographic syntax maps.\r
        */}\r
        {isFauna && (\r
          <div style={{ marginTop: '0.3rem' }}>\r
            <div className="flex items-center justify-between" style={{ marginBottom: '0.3rem' }}>\r
              <div className="text-[var(--text-xs)] font-black flex items-center" style={{ color: 'rgba(109, 242, 235, 1)', opacity: 0.5, gap: '8px' }}>\r
                <span>🧠</span> Memories\r
              </div>\r
              <div className="flex gap-2">\r
                <button\r
                  onClick={() => onOpenMemoryBrowser(entity.id)}\r
                  className="fluid-p-xs fluid-rounded transition-all juice-interactive relative group"\r
                  style={{\r
                    background: 'rgba(57, 174, 169, 0.1)',\r
                    border: '1px solid rgba(57, 174, 169, 0.4)',\r
                    boxShadow: '0 0 10px rgba(57, 174, 169, 0.2)',\r
                    color: '#39AEA9',\r
                    fontSize: '0.55rem',\r
                    fontWeight: 900,\r
                  }}\r
                >\r
                  ST: {(entity as OrganismData).memories.length}\r
                </button>\r
                <button\r
                  onClick={() => onOpenMemoryBrowser(entity.id)}\r
                  className="fluid-p-xs fluid-rounded transition-all juice-interactive relative group"\r
                  style={{\r
                    background: 'rgba(162, 213, 171, 0.1)',\r
                    border: '1px solid rgba(162, 213, 171, 0.4)',\r
                    boxShadow: '0 0 10px rgba(162, 213, 171, 0.2)',\r
                    color: '#A2D5AB',\r
                    fontSize: '0.55rem',\r
                    fontWeight: 900,\r
                  }}\r
                >\r
                  LT: {ltMemoryCount}\r
                </button>\r
              </div>\r
            </div>\r
            <div className="grid grid-cols-2 gap-x-1 gap-y-1 custom-scrollbar" style={{\r
              height: '5rem', // Fixed height for ~3 rows \r
              minHeight: '5rem',\r
              overflowY: 'scroll',\r
              paddingRight: '0.3rem'\r
            }}>\r
              {memoryDisplayRows.length > 0 ? (\r
                memoryDisplayRows.map((row) => {\r
                  const { key, memory, stackedCount, pinned, occurrences, names, notes } = row;\r
                  const canOpenPopover = stackedCount > 1 && names.length > 0;\r
\r
                  return (\r
                    <div\r
                      key={\`\${key}-\${memory.timestamp}\`}\r
                      className="fluid-p-xxs fluid-rounded flex justify-between items-center group transition-all"\r
                      style={{\r
                        background: pinned ? 'rgba(57,174,169,0.08)' : 'rgba(255,255,255,0.01)',\r
                        border: pinned ? '1px solid rgba(57,174,169,0.28)' : '1px solid rgba(255,255,255,0.05)',\r
                        fontSize: 'var(--text-sm)',\r
                        color: 'rgba(255,255,255,0.6)',\r
                        height: '1.05rem'\r
                      }}\r
                    >\r
                      <button\r
                        type="button"\r
                        data-memory-popover-trigger="true"\r
                        onClick={(event) => {\r
                          event.stopPropagation();\r
                          if (!canOpenPopover && !pinned) return;\r
                          openMemoryPopover(event, row);\r
                        }}\r
                        className="flex items-center gap-0.5"\r
                        style={{\r
                          minWidth: 0,\r
                          border: 'none',\r
                          background: 'none',\r
                          padding: 0,\r
                          cursor: canOpenPopover || pinned ? 'pointer' : 'default',\r
                          color: 'inherit',\r
                          width: '100%',\r
                          justifyContent: 'flex-start'\r
                        }}\r
                      >\r
                        {pinned && (\r
                          <span\r
                            className="flex-shrink-0 font-black"\r
                            style={{ fontSize: '0.45rem', color: '#39AEA9', opacity: 0.95, letterSpacing: '0.08em' }}\r
                          >\r
                            PIN\r
                          </span>\r
                        )}\r
                        <span\r
                          className="whitespace-nowrap litho-text flex-shrink-0 flex items-center justify-center"\r
                          style={{\r
                            fontSize: '1.0rem',\r
                            height: 'auto',\r
                            width: 'auto',\r
                            whiteSpace: 'nowrap',\r
                            justifyContent: 'left',\r
                          }}\r
                        >{getMemorySyntaxStr(memory)}</span>\r
                        {stackedCount > 1 && (\r
                          <span\r
                            className="flex-shrink-0 font-black"\r
                            style={{\r
                              fontSize: '0.5rem',\r
                              color: pinned ? '#39AEA9' : '#E5EFC1',\r
                              opacity: 0.95,\r
                              minWidth: '1.25rem'\r
                            }}\r
                          >\r
                            x{stackedCount}\r
                          </span>\r
                        )}\r
                      </button>\r
                      <span className="opacity-20 font-black whitespace-nowrap text-right flex-shrink-0" style={{ fontSize: '0.5rem', width: '3rem' }}>{UNIT_UTILS.toDays(simTime - memory.timestamp).toFixed(1)}d</span>\r
                    </div>\r
                  );\r
                })\r
              ) : (\r
                <div className="col-span-2 italic text-center tracking-widest uppercase flex items-center justify-center" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.1)', height: '100%', minHeight: '5rem' }}>No neural records found</div>\r
              )}\r
            </div>\r
          </div>\r
        )}\r
\r
      </div>\r
\r
      {activeMemoryPopover && createPortal(\r
        <div\r
          ref={activeMemoryPopoverRef}\r
          className="animate-fade-in"\r
          style={{\r
            position: 'fixed',\r
            top: \`\${activeMemoryPopover.y}px\`,\r
            left: \`\${activeMemoryPopover.x}px\`,\r
            zIndex: 10001,\r
            width: '16rem',\r
            maxWidth: 'calc(100vw - 1.5rem)',\r
            background: 'rgba(0,0,0,0.96)',\r
            border: '1px solid rgba(57, 174, 169, 0.35)',\r
            boxShadow: '0 18px 48px rgba(0,0,0,0.75)',\r
            backdropFilter: 'blur(24px) saturate(180%)',\r
            borderRadius: '0.4rem',\r
            padding: '0.75rem',\r
            pointerEvents: 'auto'\r
          }}\r
        >\r
          <div className="flex items-start justify-between" style={{ marginBottom: '0.5rem', gap: '0.5rem' }}>\r
            <div>\r
              <div className="font-black litho-text uppercase" style={{ color: '#E5EFC1', fontSize: '0.62rem', letterSpacing: '0.12em' }}>\r
                {activeMemoryPopover.title}\r
              </div>\r
              <div style={{ color: '#A2D5AB', opacity: 0.9, fontSize: '0.62rem', lineHeight: 1.5, marginTop: '0.35rem', fontWeight: 800 }}>\r
                {activeMemoryPopover.summary}\r
              </div>\r
            </div>\r
            <button\r
              type="button"\r
              onClick={() => setActiveMemoryPopover(null)}\r
              style={{\r
                border: 'none',\r
                background: 'none',\r
                color: 'rgba(255,255,255,0.45)',\r
                cursor: 'pointer',\r
                fontSize: '0.8rem',\r
                fontWeight: 900,\r
                lineHeight: 1\r
              }}\r
            >\r
              x\r
            </button>\r
          </div>\r
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem' }}>\r
            <div className="font-black uppercase" style={{ color: '#39AEA9', fontSize: '0.52rem', letterSpacing: '0.12em', marginBottom: '0.25rem' }}>\r
              Names\r
            </div>\r
            <div style={{ color: '#E5EFC1', fontSize: '0.62rem', lineHeight: 1.5, marginBottom: '0.65rem' }}>\r
              {activeMemoryPopover.names.join(', ')}\r
            </div>\r
            <div className="font-black uppercase" style={{ color: '#39AEA9', fontSize: '0.52rem', letterSpacing: '0.12em', marginBottom: '0.25rem' }}>\r
              Written Memory\r
            </div>\r
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '7rem', overflowY: 'auto', paddingRight: '0.2rem' }}>\r
              {activeMemoryPopover.notes.map((note) => (\r
                <div key={note} style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.6rem', lineHeight: 1.45 }}>\r
                  {note}\r
                </div>\r
              ))}\r
            </div>\r
          </div>\r
        </div>,\r
        document.body\r
      )}\r
\r
      <style>{\`\r
        .custom-scrollbar::-webkit-scrollbar { width: 0.2rem; } \r
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }\r
        .hover-opacity-100:hover { opacity: 0.8 !important; }\r
        .group:hover .group-hover-visible-text { white-space: normal !important; max-width: 100% !important; }\r
      \`}</style>\r
    </div >\r
  );\r
};\r
\r
export default EntityInspector;`;export{r as default};
