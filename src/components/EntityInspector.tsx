import React from 'react';
import { createPortal } from 'react-dom';
import { OrganismData, FloraData, EntityData, TraitName, SimEvent, Vector2, Memory } from '../../types';
import { SIM_CONSTANTS, POPULATION_CONSTANTS, UNIT_UTILS } from '../core/Constants';
import { getSymbol, getSyntax } from '../entities/Fauna/Cognition/SymbolMap';
import { VectorDB } from '../data/VectorDB';
import Tooltip from './Tooltip';

interface Props {
  entity: EntityData;
  organisms: OrganismData[];
  events: SimEvent[];
  simTime: number;
  onClose: () => void;
  onOpenMemoryBrowser: (entityId: string) => void;
  onFocus: (entityId: string | null) => void;
  position: Vector2;
  onPositionChange: (pos: Vector2) => void;
}

const EntityInspector: React.FC<Props> = ({ entity, organisms, events, simTime, onClose, onOpenMemoryBrowser, onFocus, position, onPositionChange }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [expandedSection, setExpandedSection] = React.useState<string | null>('traits');
  const [activeMemoryPopover, setActiveMemoryPopover] = React.useState<null | {
    key: string;
    x: number;
    y: number;
    title: string;
    summary: string;
    names: string[];
    notes: string[];
  }>(null);
  const inspectorRef = React.useRef<HTMLDivElement>(null);
  const activeMemoryPopoverRef = React.useRef<HTMLDivElement>(null);

  // Drawer Toggle Logic
  const toggleSection = (id: string) => setExpandedSection(expandedSection === id ? null : id);

  //  Type Detection
  const isFlora = 'growthState' in entity && (entity as any).growthState !== undefined;
  //const isFauna = !isFlora;
  const isFauna = 'memories' in entity && Array.isArray((entity as any).memories);


  // Time / Seasonal Logic
  const ageFrames = isFauna ? (entity as OrganismData).age : 0;
  const DAYS_PER_YEAR = SIM_CONSTANTS.DAYS_PER_SEASON * SIM_CONSTANTS.SEASONS_PER_CYCLE;
  const totalDays = Math.floor(UNIT_UTILS.toDays(ageFrames));
  const years = Math.floor(totalDays / DAYS_PER_YEAR);
  const daysInCurrentYear = totalDays % DAYS_PER_YEAR;
  // Assuming 'currentTick' is the total simulation time or organism age
  const birthDayTotal = Math.floor(UNIT_UTILS.toDays(isFauna ? ((entity as OrganismData).timestamp || 0) : 0));
  const birthDay = (birthDayTotal % SIM_CONSTANTS.DAYS_PER_SEASON) + 1;
  const birthSeason = Math.floor((birthDayTotal / SIM_CONSTANTS.DAYS_PER_SEASON) % SIM_CONSTANTS.SEASONS_PER_CYCLE) + 1;

  // 1. Get frames passed ONLY in the current day (0 - 1799)
  const framesIntoDay = ageFrames % SIM_CONSTANTS.FRAMES_PER_DAY;
  // 2. Convert those frames into hours (0 - 23)
  const currentHour = Math.floor(framesIntoDay / SIM_CONSTANTS.FRAMES_PER_HOUR);

  const formatGenerationOrdinal = React.useCallback((generation: number) => {
    const mod100 = generation % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${generation}th gen`;

    const mod10 = generation % 10;
    if (mod10 === 1) return `${generation}st gen`;
    if (mod10 === 2) return `${generation}nd gen`;
    if (mod10 === 3) return `${generation}rd gen`;
    return `${generation}th gen`;
  }, []);

  const formatAgeReadout = React.useCallback((frames: number) => {
    const totalWholeDays = Math.floor(UNIT_UTILS.toDays(frames));
    const ageYears = Math.floor(totalWholeDays / DAYS_PER_YEAR);
    const ageDays = totalWholeDays % DAYS_PER_YEAR;
    const ageHours = Math.floor((frames % SIM_CONSTANTS.FRAMES_PER_DAY) / SIM_CONSTANTS.FRAMES_PER_HOUR);
    return `${ageHours} Hr ${ageDays} D ${ageYears} Y`;
  }, [DAYS_PER_YEAR]);

  const lifespanFrames = isFauna ? (((entity as OrganismData).expressedStats as any)?.lifespan ?? 0) : 0;
  const lifespanRemainingRatio = isFauna && lifespanFrames > 0
    ? Math.max(0, Math.min(1, 1 - (ageFrames / lifespanFrames)))
    : 0;

  const nameLines = React.useMemo(() => {
    const trimmedName = (entity.name || '').trim();
    if (!trimmedName) return { firstLine: '', secondLine: '' };

    const parts = trimmedName.split(/\s+/);
    if (parts.length === 1) return { firstLine: parts[0], secondLine: '' };

    return {
      firstLine: parts[0],
      secondLine: parts.slice(1).join(' ')
    };
  }, [entity.name]);

  // Energy Calculation figures
  const stats = isFauna ? (entity as OrganismData).expressedStats : {};
  const m = (stats as any).metabolism ?? 0;
  const s = (stats as any).speed ?? 0;
  const z = (stats as any).size ?? 0;
  const drainTotal = (m * s * z).toFixed(2);
  // Get Long term memory count
  const ltMemoryCount = React.useMemo(() => {
    if (!isFauna) return 0;
    // Use a direct query if your VectorDB supports it, otherwise find
    const history = VectorDB.getHistory().find(o => o.id === entity.id);
    return history?.memories?.length || 0;
  }, [entity.id, simTime]); // simTime trigger ensures it updates as sim ticks

  // 1. Refactor the Memoization Logic
  const relatives = React.useMemo(() => {
    if (isFlora) return [];
    const fauna = entity as OrganismData;
    if (!fauna.surname) return [];

    // Fallback: if 'organisms' is empty (common when worker handles physics), use VectorDB history
    const sourcePool = (organisms && organisms.length > 0) ? organisms : (VectorDB.getHistory() as OrganismData[]);

    return sourcePool
      .filter(other => {
        // Robust check: Ensure we aren't comparing to self, and match surnames (case-insensitive)
        const matchesSurname = other.surname?.toLowerCase() === fauna.surname.toLowerCase();
        return other.id !== fauna.id && matchesSurname;
      })
      // Sort by age to show the "elders" of the relatives first, then slice
      .sort((a, b) => b.age - a.age)
      .slice(0, 10); // Expanded to 10 for better visibility
  }, [entity.id, (entity as OrganismData).surname, organisms, isFlora]);

  React.useEffect(() => {
    if (!activeMemoryPopover) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (activeMemoryPopoverRef.current?.contains(target)) return;
      if (inspectorRef.current?.contains(target)) {
        const interactive = target instanceof HTMLElement ? target.closest('[data-memory-popover-trigger="true"]') : null;
        if (interactive) return;
      }
      setActiveMemoryPopover(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveMemoryPopover(null);
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [activeMemoryPopover]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.stopPropagation();
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...position };

    const onMouseMove = (moveEvent: MouseEvent) => {
      onPositionChange({
        x: startPos.x + (moveEvent.clientX - startX),
        y: startPos.y + (moveEvent.clientY - startY)
      });
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  // --- traitConfig ---
  const traitConfig: Record<TraitName, { name: string, unit: string, icon: string, desc: string }> = {
    speed: { name: "Speed", unit: "meter/s", icon: "⚡", desc: "Maximum movement velocity. Higher speed consumes more energy per tick." },
    size: { name: "Size", unit: "centimeter", icon: "📐", desc: "Physical diameter. Larger organisms have higher metabolic costs but can dominate interactions." },
    metabolism: { name: "Metabolism", unit: "% efficiency", icon: "💎", desc: "Energy conversion efficiency. Lower percentage means higher energy burn rate." },
    sight_range: { name: "Vision Range", unit: "meter", icon: "👁️", desc: "Maximum distance at which the entity can detect visual stimuli." },
    sight_fov: { name: "Vision FoV", unit: "degrees", icon: "🔭", desc: "Field of View angle. Wider angles allow seeing more but may reduce focus." },
    lifespan: { name: "Lifespan", unit: "Days", icon: "⌛", desc: "Biological limit of the organism's existence in simulation days." },
    audible_range: { name: "Hearing", unit: "meter", icon: "🔊", desc: "Radius for detecting sound events from other entities." },
    communicating_range: { name: "Vocalization", unit: "meter", icon: "🗣️", desc: "Transmission radius for social interactions and data sharing." },
  };

  const getMemorySyntaxStr = (memory: Memory) => {
    const isGroup = (memory.entityIds?.length || 0) > 1;
    return getSyntax(memory.type, memory.content, memory.isFamiliar, isGroup);
  };

  const getMemoryNames = React.useCallback((memory: Memory) => {
    const names = new Set<string>();

    if (memory.data?.name) names.add(memory.data.name);
    if (memory.content && !memory.content.startsWith('Ate ')) names.add(memory.content);
    if (memory.content?.startsWith('Ate ')) names.add(memory.content.replace('Ate ', ''));

    for (const entityId of memory.entityIds || []) {
      const organism = organisms.find(o => o.id === entityId);
      if (organism?.name) names.add(organism.name);
    }

    return Array.from(names).filter(Boolean);
  }, [organisms]);

  const getGroupNamesTooltip = (memory: Memory) => {
    const names = getMemoryNames(memory);
    return names.length > 0 ? names.join(', ') : memory.content;
  };

  const getMemoryDetailText = React.useCallback((row: {
    memory: Memory;
    stackedCount: number;
    pinned: boolean;
    occurrences: number;
    names: string[];
    notes: string[];
  }) => {
    const { memory, stackedCount, pinned, names, notes } = row;
    const primaryName = names[0] || memory.content;

    if (memory.type === 'Food') {
      return `${getMemorySyntaxStr(memory)} I found food at ${stackedCount > 1 ? `${stackedCount} recent locations` : primaryName}.`;
    }

    if (memory.type === 'Flora') {
      return `${getMemorySyntaxStr(memory)} I ate ${stackedCount > 1 ? `${stackedCount} nearby food sources recently` : primaryName}.`;
    }

    if (memory.type === 'Fauna' && memory.isFamiliar) {
      return `${getMemorySyntaxStr(memory)} I met ${primaryName} again; we are already familiar to one another.`;
    }

    if (memory.type === 'Fauna' && (memory.entityIds?.length || 0) > 1) {
      return `${getMemorySyntaxStr(memory)} I encountered a group of fauna, including ${names.slice(0, 3).join(', ')}${names.length > 3 ? ', and others' : ''}.`;
    }

    if (memory.type === 'Fauna') {
      return `${getMemorySyntaxStr(memory)} I noticed ${stackedCount > 1 ? `${stackedCount} fauna encounters` : primaryName}.`;
    }

    if (memory.type === 'THREAT') {
      return `${getMemorySyntaxStr(memory)} I detected a threat nearby.`;
    }

    if (memory.type === 'MATE') {
      return `${getMemorySyntaxStr(memory)} I identified a potential mate.`;
    }

    if (memory.type === 'SectorScan') {
      return `${getMemorySyntaxStr(memory)} I completed a scan of the nearby sector.`;
    }

    return `${getMemorySyntaxStr(memory)} ${notes[0] || memory.content}`;
  }, []);

  const stackWindowFrames = SIM_CONSTANTS.FRAMES_PER_DAY;

  const isPinnedMemory = React.useCallback((memory: Memory) => {
    // Keep bonding/familiar social memories pinned until the user chooses the final important-memory set.
    return memory.type === 'Fauna' && !!memory.isFamiliar;
  }, []);

  const getStackSignature = React.useCallback((memory: Memory) => {
    if (isPinnedMemory(memory)) {
      const entityIdsKey = [...(memory.entityIds || [])].sort().join('|');
      const targetId = memory.data?.id || '';
      return ['PINNED', memory.type, targetId, entityIdsKey, memory.isFamiliar ? '1' : '0'].join('::');
    }

    if (memory.type === 'Food') return 'QUEUE::Food::visible-food';
    if (memory.type === 'Flora') return 'QUEUE::Flora::consumed-flora';
    if (memory.type === 'Fauna') {
      return (memory.entityIds?.length || 0) > 1
        ? 'QUEUE::Fauna::group-encounter'
        : 'QUEUE::Fauna::ambient-encounter';
    }

    if (memory.type === 'SectorScan') return 'QUEUE::SectorScan::scan';
    if (memory.type === 'THREAT') return 'QUEUE::THREAT::threat';
    if (memory.type === 'MATE') return 'QUEUE::MATE::mate';

    return `QUEUE::${memory.type}::generic`;
  }, [isPinnedMemory]);

  const openMemoryPopover = React.useCallback((event: React.MouseEvent<HTMLButtonElement>, row: {
    key: string;
    memory: Memory;
    stackedCount: number;
    pinned: boolean;
    occurrences: number;
    names: string[];
    notes: string[];
  }) => {
    if (row.names.length === 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const preferredX = rect.left - 8;
    const preferredY = rect.bottom + 8;
    const width = 260;
    const height = 220;

    setActiveMemoryPopover({
      key: row.key,
      x: Math.max(12, Math.min(preferredX, window.innerWidth - width - 12)),
      y: Math.max(12, Math.min(preferredY, window.innerHeight - height - 12)),
      title: row.pinned ? 'Pinned Memory Detail' : row.stackedCount > 1 ? 'Stacked Memory Detail' : 'Memory Detail',
      summary: getMemoryDetailText(row),
      names: row.names,
      notes: row.notes,
    });
  }, [getMemoryDetailText]);



  const memoryDisplayRows = React.useMemo(() => {
    if (!isFauna) return [];

    const rows: Array<{
      key: string;
      memory: Memory;
      occurrences: number;
      stackedCount: number;
      pinned: boolean;
      newestTimestamp: number;
      names: Set<string>;
      notes: Set<string>;
    }> = [];

    const memories = (entity as OrganismData).memories
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp);

    for (const memory of memories) {
      const signature = getStackSignature(memory);
      const stackWindow = stackWindowFrames;
      const baseCount = Math.max(1, memory.count || 1);

      let matchedRow = null;
      for (let i = rows.length - 1; i >= 0; i--) {
        const row = rows[i];
        if (!row.pinned && row.key === signature && (memory.timestamp - row.newestTimestamp) <= stackWindow) {
          matchedRow = row;
          break;
        }
      }

      if (matchedRow) {
        matchedRow.memory = memory;
        matchedRow.newestTimestamp = memory.timestamp;
        matchedRow.occurrences += 1;
        matchedRow.stackedCount += baseCount;
        for (const name of getMemoryNames(memory)) matchedRow.names.add(name);
        matchedRow.notes.add(memory.content);
      } else {
        rows.push({
          key: signature,
          memory,
          occurrences: 1,
          stackedCount: baseCount,
          pinned: isPinnedMemory(memory),
          newestTimestamp: memory.timestamp,
          names: new Set(getMemoryNames(memory)),
          notes: new Set(memory.content ? [memory.content] : []),
        });
      }
    }

    return rows
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (a.newestTimestamp !== b.newestTimestamp) return b.newestTimestamp - a.newestTimestamp;
        return b.stackedCount - a.stackedCount;
      })
      .map(row => ({
        ...row,
        names: Array.from(row.names),
        notes: Array.from(row.notes),
      }));
  }, [entity, getMemoryNames, getStackSignature, isFauna, isPinnedMemory, stackWindowFrames]);

  return (
    <div
      ref={inspectorRef}
      style={{
        left: `${Math.max(10, Math.min(position.x, window.innerWidth - 300))}px`,
        top: `${Math.max(10, Math.min(position.y, window.innerHeight - 100))}px`,
        position: 'fixed',
        width: '16rem', // Stabilized width to prevent layout jitter on expansion
        height: 'fit-content', // Changed from fit-content for reliable expansion
        minWidth: '16rem', // Fixed invalid 'content' keyword
        maxWidth: '16rem',
        maxHeight: '90vh', // Root level safety cap
        zIndex: 999,
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        border: '1px solid rgba(162, 213, 171, 0.15)',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      className="glass-modular fluid-rounded flex flex-col pointer-events-auto"
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Header: Name with Hanging Indent */}
      <div
        className="fluid-rounded-t flex flex-col overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div
          onMouseDown={handleMouseDown}
          className="fluid-p-md flex items-start justify-between"
          style={{ cursor: 'grab' }}
        >
          {/* Entity Observer */}
          <div className="flex flex-col select-none w-full" style={{ marginRight: '0.75rem', minWidth: 0 }}>
            <div className="flex items-start justify-between" style={{ gap: '0.45rem', marginBottom: '0.5rem' }}>
              {/* ANNOTATED SECTION: Organism Name Display */}
              <Tooltip
                title="Species Details"
                content={`Information about ${entity.name}. Carrying a unique genetic blueprint focused on survival and adaptation within the simulation.`}
                position="right"
              >
                <div
                  className="text-[var(--text-xl)] font-bold litho-text relative group"
                  style={{
                    color: isFlora ? '#A2D5AB' : '#ccde89ff',
                    lineHeight: '1.05rem',
                    flex: 1,
                    minWidth: 0,
                    whiteSpace: 'normal',
                    cursor: 'help',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem'
                  }}
                >
                  <span
                    className="fluid-rounded-full"
                    style={{
                      display: 'inline-block', width: '1rem', height: '0.5rem',
                      background: entity.color || '#39AEA9', marginTop: '0.22rem', flexShrink: 0,
                      boxShadow: `0 0 10px ${entity.color || '#39AEA9'}`
                    }}
                  />
                  <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'visible' }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'clip' }}>{nameLines.firstLine}</span>
                    {nameLines.secondLine ? (
                      <span style={{ whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'clip' }}>{nameLines.secondLine}</span>
                    ) : null}
                  </span>
                </div>
              </Tooltip>
              <div className="flex items-center" style={{ gap: '0.35rem', flexShrink: 0 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSection('bio'); }}
                  className="transition-all juice-interactive fluid-rounded"
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: '#39AEA9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.32rem',
                    border: '1px solid rgba(57, 174, 169, 0.38)',
                    background: 'rgba(57, 174, 169, 0.08)',
                    boxShadow: '0 0 14px rgba(57, 174, 169, 0.14)',
                    padding: '0.28rem 0.38rem',
                    textTransform: 'none',
                    lineHeight: 1
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 7v14" />
                    <path d="M16 12h2" />
                    <path d="M16 8h2" />
                    <path d="M3 18V6a2 2 0 0 1 2-2h7a4 4 0 0 1 4 4v12a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" />
                    <path d="M16 18a2 2 0 0 1 2-2h3V4h-3a2 2 0 0 0-2 2" />
                  </svg>
                  <span>Bio</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  className="fluid-rounded transition-all juice-interactive"
                  style={{
                    border: '1px solid rgba(57, 174, 169, 0.38)',
                    background: 'rgba(57, 174, 169, 0.08)',
                    boxShadow: '0 0 14px rgba(57, 174, 169, 0.14)',
                    cursor: 'pointer',
                    color: '#39AEA9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '1.65rem',
                    height: '1.65rem',
                    padding: 0,
                    lineHeight: 1
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            {/* Sub-header row: Age (Left) */}
            <div className="flex items-start justify-between w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', gap: '0.6rem' }}>

              <div className="flex flex-col justify-start" style={{ flex: 1, alignSelf: 'stretch', minWidth: 0, gap: '0.24rem' }}>
                <div className="opacity-60 font-black" style={{ fontSize: 'var(--text-lg)', color: isFlora ? '#39AEA9' : '#A2D5AB', lineHeight: 1, marginTop: 0 }}>
                  {isFauna ? formatAgeReadout(ageFrames) : 'Biological Organism'}
                </div>
                {isFauna && (
                  <div className="w-full fluid-rounded-full overflow-hidden" style={{ height: '0.26rem', background: 'rgba(255,255,255,0.08)' }}>
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${lifespanRemainingRatio * 100}%`,
                        background: lifespanRemainingRatio > 0.5 ? '#A2D5AB' : lifespanRemainingRatio > 0.2 ? '#E5EFC1' : '#39AEA9'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* 
            PURPOSE: BIOLOGICAL NARRATIVE (Bio)
            Provides a generated backstory or ecological context for the entity.
            INTERACTION: Auto-closes on mouse exit to reduce visual clutter.
        */}
        {expandedSection === 'bio' && (
          <div
            onMouseLeave={() => setExpandedSection(null)}
            className="fluid-px-sm fluid-pb-sm animate-fade-in"
            style={{ fontSize: 'var(--text-xs)', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}
          >
            <div className="opacity-60 font-bold" style={{ color: '#A2D5AB', marginBottom: '4px', fontSize: '0.55rem' }}>
              {isFauna ? `Origin: Day ${birthDay} • Season ${birthSeason}` : 'Origin: Spontaneous Bloom'}
            </div>
            <p className="italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)', whiteSpace: 'normal', margin: 0 }}>
              {isFauna
                ? "An entity of quiet calculation. It carries the biological markers of a lineage that thrives in the twilight hours of the simulation."
                : "A silent architect of the simulation's atmosphere. This organism converts raw energy into a nutrient-dense cache through slow, algorithmic maturity."
              }
            </p>
          </div>
        )}
      </div>

      {/* 
          PURPOSE: MAIN DATA MODULES
          Houses the primary scrollable content including lineage, metabolism, traits, and memories.
      */}
      <div className="fluid-p-sm flex flex-col gap-2 overflow-y-auto custom-scrollbar">

        {/* 
            PURPOSE: CLAN & LINEAGE (House)
            Displays generational depth and family name. 
            Fallbacks to VectorDB if active physics are offloaded.
        */}
        {isFauna && (
          <div
            className="fluid-rounded transition-all"
            style={{
              border: expandedSection === 'relatives' ? '1px solid rgba(162, 213, 171, 0.27)' : '1px solid rgba(255,255,255,0.05)',
              background: expandedSection === 'relatives' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.02)'
            }}
          >
            <button
              onClick={() => toggleSection('relatives')}
              className="w-full fluid-p-sm flex flex-col fluid-gap-xs"
              style={{ border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-col items-start" style={{ minWidth: 0, flex: 1, gap: '0.1rem' }}>
                  <Tooltip
                    title="House Lineage"
                    content="The generational count and house surname of this organism's lineage."
                    position="top"
                  >
                    <span className="text-[var(--text-xs)] font-black whitespace-nowrap" style={{ color: 'rgba(109, 242, 235, 1)', textTransform: 'uppercase', cursor: 'help' }}>
                      Lineage
                    </span>
                  </Tooltip>
                  <span className="text-[var(--text-sm)] font-black whitespace-nowrap" style={{ color: '#E5EFC1', fontFamily: 'monospace', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formatGenerationOrdinal((entity as OrganismData).generation)} | {(entity as OrganismData).surname}
                  </span>
                </div>
              </div>
              <div className="w-full fluid-rounded-full overflow-hidden" style={{ height: '6px', background: 'rgba(255,255,255,0.05)' }}>
                <div
                  className="h-full transition-all duration-500 shadow-glow"
                  style={{
                    width: `${Math.min(100, ((entity as OrganismData).energy / POPULATION_CONSTANTS.BIRTH_COST_BASE) * 100)}%`,
                    // Changes to a pinkish/gold glow when threshold is met
                    background: (entity as OrganismData).energy >= POPULATION_CONSTANTS.BIRTH_COST_BASE
                      ? 'rgba(255, 105, 180, 1)'
                      : 'rgba(109, 242, 235, 1)'
                  }}
                />
              </div>
            </button>
            {expandedSection === 'relatives' && (
              <div
                className="fluid-px-sm fluid-pb-sm flex flex-col gap-1 animate-fade-in"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem' }}
              >
                {relatives.length > 0 ? relatives.map(rel => (
                  <div
                    key={rel.id}
                    onClick={() => onFocus(rel.id)}
                    className="flex justify-between items-center fluid-p-xxs px-3 fluid-rounded opacity-60 hover:opacity-100 cursor-pointer text-[11px]"
                    style={{
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.03)',
                      color: 'rgba(109, 242, 235, 1)'
                    }}
                  >
                    <span className="flex items-center gap-1">
                      <span className="opacity-40">•</span>
                      {rel.name}
                    </span>
                    <span className="text-[0.55rem] font-black opacity-30 tracking-widest">VIEW</span>
                  </div>
                )) : (
                  <div className="text-center opacity-20 italic text-[0.6rem] py-2 uppercase tracking-widest">No living members found</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 
            PURPOSE: METABOLISM & ENERGY SINK
            Calculates real-time energy drain (Fauna) or maturity yield (Flora).
        */}
        <div
          className="fluid-rounded transition-all"
          style={{
            border: expandedSection === 'energy' ? '1px solid rgba(57, 174, 169, 0.27)' : '1px solid rgba(255,255,255,0.05)',
            background: expandedSection === 'energy' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.02)'
          }}
        >
          <button
            onClick={() => toggleSection('energy')}
            className="w-full fluid-p-sm flex flex-col fluid-gap-xs"
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <div className="flex justify-between items-center w-full">
              <div className="flex flex-col items-start">
                <Tooltip
                  title={isFlora ? "Maturation Threshold" : "Metabolic Efficiency"}
                  content={isFlora ? "Plants yield energy based on their current growth state. 1.0 = Max Nutrients." : "Energy consumption is calculated as (Metabolism % × Current Speed × Body Size)."}
                  position="top"
                >
                  <span className="text-[var(--text-xs)] font-black" style={{ color: 'rgba(109, 242, 235, 1)', textTransform: 'uppercase', cursor: 'help' }}>
                    {isFlora ? "Yield Potential" : "Metabolism"}
                  </span>
                </Tooltip>
                <span className="text-[var(--text-sm)] font-black" style={{ color: 'rgba(109, 242, 235, 1)', fontFamily: 'monospace' }}>
                  {isFlora
                    ? (Math.floor((entity as FloraData).energyValue * (entity as FloraData).growthState))
                    : drainTotal
                  }
                  <span style={{ fontSize: 'var(--text-xs)', opacity: 0.5 }}>{isFlora ? " Energy" : " E/s"}</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[var(--text-xs)] font-black" style={{ color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', paddingRight: '0.3rem' }}>
                  {isFlora ? "Maturity" : "Energy"}
                </span>
                <span className="text-[var(--text-sm)] font-black" style={{ color: '#E5EFC1', fontFamily: 'monospace' }}>
                  {isFlora
                    ? ((entity as FloraData).growthState * 100).toFixed(0) + "%"
                    : Math.floor((entity as OrganismData).energy)
                  }
                </span>
              </div>
            </div>
            <div className="w-full fluid-rounded-full overflow-hidden" style={{ height: '6px', background: 'rgba(255,255,255,0.05)' }}>
              <div
                className="h-full transition-all duration-500 shadow-glow"
                style={{
                  width: `${isFlora ? ((entity as FloraData).growthState * 100) : Math.min(100, ((entity as OrganismData).energy / 30000) * 100)}%`,
                  background: isFlora ? '#A2D5AB' : '#39AEA9'
                }}
              />
            </div>
          </button>
          {expandedSection === 'energy' && (
            <div
              className="fluid-px-sm fluid-pb-sm animate-fade-in"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}
            >
              {isFauna ? (
                <div className="grid grid-cols-1 font-bold" style={{ gap: '4px', fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.3)' }}>
                  <div className="flex justify-between"><span>Metabolism (M)</span><span style={{ color: 'rgba(255,255,255,0.6)' }}>{m.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Speed Load (S)</span><span style={{ color: 'rgba(255,255,255,0.6)' }}>× {s.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Scale Factor (Z)</span><span style={{ color: 'rgba(255,255,255,0.6)' }}>× {z.toFixed(2)}</span></div>
                  <div className="flex justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '4px', paddingTop: '4px', color: '#39AEA9' }}>
                    <span>Total Calculated Drain</span>
                    <span>{drainTotal} E/s</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 font-bold" style={{ gap: '4px', fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.3)' }}>
                  <div className="flex justify-between"><span>Base Harvest</span><span style={{ color: 'rgba(255,255,255,0.6)' }}>{(entity as FloraData).energyValue} Energy</span></div>
                  <div className="flex justify-between"><span>Growth Scalar</span><span style={{ color: 'rgba(255,255,255,0.6)' }}>× {(entity as FloraData).growthState.toFixed(2)}</span></div>
                  <div className="flex justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '4px', paddingTop: '4px', color: '#A2D5AB' }}>
                    <span>Current Energy Payoff</span>
                    <span>{Math.floor((entity as FloraData).energyValue * (entity as FloraData).growthState)} Energy</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 
            PURPOSE: GENETIC TRAITS (Genome)
            Visualizes expressed stats vs. underlying alleles (alleles visible as dual-bar indicators).
        */}
        <div className="grid grid-cols-1 fluid-gap-xs">
          {isFauna ? (Object.keys(traitConfig) as TraitName[]).map(trait => {
            const fauna = entity as OrganismData;
            const config = traitConfig[trait];
            // Safety Check: Old genomes might allow new traits
            if (!config) return null;

            const alleles = fauna.genome.traits[trait];
            const val = fauna.expressedStats[trait];

            if (!alleles || val === undefined) return null;

            let displayVal = val.toFixed(1);
            if (trait === 'sight_fov') displayVal = Math.round(UNIT_UTILS.toDegrees(val)).toString();
            if (trait === 'lifespan') displayVal = Math.floor(UNIT_UTILS.toDays(val)).toString();
            if (trait === 'sight_range') displayVal = val.toFixed(1);
            if (trait === 'metabolism') displayVal = (val * 100).toFixed(0);

            return (
              <Tooltip key={trait} title={config.name} content={config.desc} position="left">
                <div className="flex items-center justify-between fluid-p-xs fluid-rounded" style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', cursor: 'help' }}>
                  <div className="flex items-center fluid-gap-sm">
                    <span style={{ opacity: 0.3 }}>{config.icon}</span>
                    <div className="flex flex-col">
                      <span className="font-bold opacity-20 uppercase tracking-widest" style={{ fontSize: '0.55rem', color: 'white' }}>{config.name}</span>
                      <span className="text-[var(--text-sm)] font-black" style={{ color: '#E5EFC1', fontFamily: 'monospace' }}>
                        {displayVal}<span style={{ fontSize: '0.6rem', marginLeft: '2px', opacity: 0.2 }}>{config.unit}</span>
                      </span>
                    </div>
                  </div>
                  <div style={{ width: '2.5rem' }}>
                    <div className="flex h-1" style={{ gap: '2px', marginBottom: '4px' }}>
                      <div className="flex-1 fluid-rounded-full" style={{ background: alleles.d1 >= alleles.d2 ? '#39AEA9' : 'rgba(255,255,255,0.1)' }} />
                      <div className="flex-1 fluid-rounded-full" style={{ background: alleles.d2 > alleles.d1 ? '#A78BFA' : 'rgba(255,255,255,0.1)' }} />
                    </div>
                  </div>
                </div>
              </Tooltip>
            );
          }) : [
            { id: 'ratio', name: 'Growth Rate', icon: '🌱', val: ((entity as FloraData).genome.traits.structure.v1 * 24 * 100).toFixed(2), unit: '%', desc: 'The daily expansion speed of this organism relative to the simulation seasonal cycle.' },
            { id: 'nodes', name: 'Structural Segments', icon: '🌿', val: (entity as FloraData).genome.traits.structure.v2.toFixed(0), unit: ' Segments', desc: 'The branching complexity of the organism. More segments lead to higher energy density.' },
            { id: 'stem', name: 'Stem Mass', icon: '🌳', val: (entity as FloraData).genome.traits.ecology.v2.toFixed(1), unit: ' mm', desc: 'The physical thickness of the main structure, contributing to overall survival and nutrient yield.' },
            { id: 'leaf', name: 'Surface Area', icon: '🍀', val: (entity as FloraData).genome.traits.morphology.v1.toFixed(1), unit: ' Scale', desc: 'The scale of leaf structures that capture energy from the environment.' }
          ].map(trait => (
            <Tooltip key={trait.id} title={trait.name} content={trait.desc} position="left">
              <div className="flex items-center justify-between fluid-p-xs fluid-rounded" style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(162, 213, 171, 0.05)', cursor: 'help' }}>
                <div className="flex items-center fluid-gap-sm">
                  <span style={{ opacity: 0.3 }}>{trait.icon}</span>
                  <div className="flex flex-col">
                    <span className="font-bold opacity-20 uppercase tracking-widest" style={{ fontSize: '0.55rem', color: 'white' }}>{trait.name}</span>
                    <span className="text-[var(--text-sm)] font-black" style={{ color: '#A2D5AB', fontFamily: 'monospace' }}>
                      {trait.val}<span style={{ fontSize: '0.6rem', marginLeft: '2px', opacity: 0.2 }}>{trait.unit}</span>
                    </span>
                  </div>
                </div>
              </div>
            </Tooltip>
          ))}
        </div>

        {/* 
            AXIOMATIC INTENT: The memories readout is a user-facing interpretation layer, not a raw dump.
            It must preserve the organism's underlying memory data while compressing rapid repeat noise into queue-like one-day stacks and surfacing consequential events first.
            AXIOLOGICAL INTENT: Prioritize readability, salience, and ecological storytelling so rare or meaningful memories remain visible during high-update moments.
            DO NOT REMOVE OR WEAKEN THIS CONTRACT DURING FUTURE GUI REWORKS WITHOUT EXPLICIT USER APPROVAL.
            PURPOSE: NEURAL RECORDS (Memories)
            Short-term (ST) and Long-term (LT) memory lists. ST items use ideographic syntax maps.
        */}
        {isFauna && (
          <div style={{ marginTop: '0.3rem' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '0.3rem' }}>
              <div className="text-[var(--text-xs)] font-black flex items-center" style={{ color: 'rgba(109, 242, 235, 1)', opacity: 0.5, gap: '8px' }}>
                <span>🧠</span> Memories
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenMemoryBrowser(entity.id)}
                  className="fluid-p-xs fluid-rounded transition-all juice-interactive relative group"
                  style={{
                    background: 'rgba(57, 174, 169, 0.1)',
                    border: '1px solid rgba(57, 174, 169, 0.4)',
                    boxShadow: '0 0 10px rgba(57, 174, 169, 0.2)',
                    color: '#39AEA9',
                    fontSize: '0.55rem',
                    fontWeight: 900,
                  }}
                >
                  ST: {(entity as OrganismData).memories.length}
                </button>
                <button
                  onClick={() => onOpenMemoryBrowser(entity.id)}
                  className="fluid-p-xs fluid-rounded transition-all juice-interactive relative group"
                  style={{
                    background: 'rgba(162, 213, 171, 0.1)',
                    border: '1px solid rgba(162, 213, 171, 0.4)',
                    boxShadow: '0 0 10px rgba(162, 213, 171, 0.2)',
                    color: '#A2D5AB',
                    fontSize: '0.55rem',
                    fontWeight: 900,
                  }}
                >
                  LT: {ltMemoryCount}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-1 gap-y-1 custom-scrollbar" style={{
              height: '5rem', // Fixed height for ~3 rows 
              minHeight: '5rem',
              overflowY: 'scroll',
              paddingRight: '0.3rem'
            }}>
              {memoryDisplayRows.length > 0 ? (
                memoryDisplayRows.map((row) => {
                  const { key, memory, stackedCount, pinned, occurrences, names, notes } = row;
                  const canOpenPopover = stackedCount > 1 && names.length > 0;

                  return (
                    <div
                      key={`${key}-${memory.timestamp}`}
                      className="fluid-p-xxs fluid-rounded flex justify-between items-center group transition-all"
                      style={{
                        background: pinned ? 'rgba(57,174,169,0.08)' : 'rgba(255,255,255,0.01)',
                        border: pinned ? '1px solid rgba(57,174,169,0.28)' : '1px solid rgba(255,255,255,0.05)',
                        fontSize: 'var(--text-sm)',
                        color: 'rgba(255,255,255,0.6)',
                        height: '1.05rem'
                      }}
                    >
                      <button
                        type="button"
                        data-memory-popover-trigger="true"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!canOpenPopover && !pinned) return;
                          openMemoryPopover(event, row);
                        }}
                        className="flex items-center gap-0.5"
                        style={{
                          minWidth: 0,
                          border: 'none',
                          background: 'none',
                          padding: 0,
                          cursor: canOpenPopover || pinned ? 'pointer' : 'default',
                          color: 'inherit',
                          width: '100%',
                          justifyContent: 'flex-start'
                        }}
                      >
                        {pinned && (
                          <span
                            className="flex-shrink-0 font-black"
                            style={{ fontSize: '0.45rem', color: '#39AEA9', opacity: 0.95, letterSpacing: '0.08em' }}
                          >
                            PIN
                          </span>
                        )}
                        <span
                          className="whitespace-nowrap litho-text flex-shrink-0 flex items-center justify-center"
                          style={{
                            fontSize: '1.0rem',
                            height: 'auto',
                            width: 'auto',
                            whiteSpace: 'nowrap',
                            justifyContent: 'left',
                          }}
                        >{getMemorySyntaxStr(memory)}</span>
                        {stackedCount > 1 && (
                          <span
                            className="flex-shrink-0 font-black"
                            style={{
                              fontSize: '0.5rem',
                              color: pinned ? '#39AEA9' : '#E5EFC1',
                              opacity: 0.95,
                              minWidth: '1.25rem'
                            }}
                          >
                            x{stackedCount}
                          </span>
                        )}
                      </button>
                      <span className="opacity-20 font-black whitespace-nowrap text-right flex-shrink-0" style={{ fontSize: '0.5rem', width: '3rem' }}>{UNIT_UTILS.toDays(simTime - memory.timestamp).toFixed(1)}d</span>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 italic text-center tracking-widest uppercase flex items-center justify-center" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.1)', height: '100%', minHeight: '5rem' }}>No neural records found</div>
              )}
            </div>
          </div>
        )}

      </div>

      {activeMemoryPopover && createPortal(
        <div
          ref={activeMemoryPopoverRef}
          className="animate-fade-in"
          style={{
            position: 'fixed',
            top: `${activeMemoryPopover.y}px`,
            left: `${activeMemoryPopover.x}px`,
            zIndex: 10001,
            width: '16rem',
            maxWidth: 'calc(100vw - 1.5rem)',
            background: 'rgba(0,0,0,0.96)',
            border: '1px solid rgba(57, 174, 169, 0.35)',
            boxShadow: '0 18px 48px rgba(0,0,0,0.75)',
            backdropFilter: 'blur(24px) saturate(180%)',
            borderRadius: '0.4rem',
            padding: '0.75rem',
            pointerEvents: 'auto'
          }}
        >
          <div className="flex items-start justify-between" style={{ marginBottom: '0.5rem', gap: '0.5rem' }}>
            <div>
              <div className="font-black litho-text uppercase" style={{ color: '#E5EFC1', fontSize: '0.62rem', letterSpacing: '0.12em' }}>
                {activeMemoryPopover.title}
              </div>
              <div style={{ color: '#A2D5AB', opacity: 0.9, fontSize: '0.62rem', lineHeight: 1.5, marginTop: '0.35rem', fontWeight: 800 }}>
                {activeMemoryPopover.summary}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveMemoryPopover(null)}
              style={{
                border: 'none',
                background: 'none',
                color: 'rgba(255,255,255,0.45)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 900,
                lineHeight: 1
              }}
            >
              x
            </button>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem' }}>
            <div className="font-black uppercase" style={{ color: '#39AEA9', fontSize: '0.52rem', letterSpacing: '0.12em', marginBottom: '0.25rem' }}>
              Names
            </div>
            <div style={{ color: '#E5EFC1', fontSize: '0.62rem', lineHeight: 1.5, marginBottom: '0.65rem' }}>
              {activeMemoryPopover.names.join(', ')}
            </div>
            <div className="font-black uppercase" style={{ color: '#39AEA9', fontSize: '0.52rem', letterSpacing: '0.12em', marginBottom: '0.25rem' }}>
              Written Memory
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '7rem', overflowY: 'auto', paddingRight: '0.2rem' }}>
              {activeMemoryPopover.notes.map((note) => (
                <div key={note} style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.6rem', lineHeight: 1.45 }}>
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0.2rem; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
        .hover-opacity-100:hover { opacity: 0.8 !important; }
        .group:hover .group-hover-visible-text { white-space: normal !important; max-width: 100% !important; }
      `}</style>
    </div >
  );
};

export default EntityInspector;