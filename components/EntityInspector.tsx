import React from 'react';
import { OrganismData, FloraData, EntityData, TraitName, SimEvent, Vector2 } from '../types';
import { SIM_CONSTANTS, UNIT_UTILS } from '../src/core/Constants';
import { getSymbol, getSyntax } from '../src/entities/Fauna/Cognition/SymbolMap';
import { VectorDB } from '../src/data/VectorDB';
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

  // Energy Calculation figures
  const stats = isFauna ? (entity as OrganismData).expressedStats : {};
  const m = (stats as any).metabolism ?? 0;
  const s = (stats as any).speed ?? 0;
  const z = (stats as any).size ?? 0;
  const drainTotal = (m * s * z).toFixed(2);

  // 1. Refactor the Memoization Logic
  const relatives = React.useMemo(() => {
    if (isFlora || !organisms) return [];
    const fauna = entity as OrganismData;

    if (!fauna.surname) return [];

    return organisms
      .filter(other => {
        // Robust check: Ensure we aren't comparing to self, and match surnames (case-insensitive)
        const matchesSurname = other.surname?.toLowerCase() === fauna.surname.toLowerCase();
        return other.id !== fauna.id && matchesSurname;
      })
      // Sort by age to show the "elders" of the relatives first, then slice
      .sort((a, b) => b.age - a.age)
      .slice(0, 10); // Expanded to 10 for better visibility
  }, [entity.id, (entity as OrganismData).surname, organisms, isFlora]);

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

  const getMemorySyntaxStr = (memory: any) => {
    const isGroup = (memory.entityIds?.length || 0) > 1;
    return getSyntax(memory.type, memory.content, memory.isFamiliar, isGroup);
  };

  const getGroupNamesTooltip = (memory: any) => {
    if (!memory.entityIds || memory.entityIds.length === 0) return memory.content;
    const names = organisms
      .filter(o => memory.entityIds.includes(o.id))
      .map(o => o.name);
    return names.length > 0 ? names.join(', ') : memory.content;
  };

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'fixed',
        width: 'fit-content',
        height: 'fit-content',
        minWidth: 'content',
        maxWidth: 'content',
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
          <div className="flex flex-col select-none w-full" style={{ marginRight: '1rem' }}>
            {/* ANNOTATED SECTION: Organism Name Display */}
            <Tooltip
              title="Species Details"
              content={`Information about ${entity.name}. Carrying a unique genetic blueprint focused on survival and adaptation within the simulation.`}
              position="right"
            >
              <div
                className="text-[var(--text-xl)] font-bold litho-text relative group"
                style={{
                  color: isFlora ? '#A2D5AB' : '#ccde89ff', lineHeight: '1.2rem', whiteSpace: 'normal',
                  paddingLeft: '1rem', textIndent: '-1rem', marginBottom: '0.5rem',
                  cursor: 'help'
                }}
              >
                <span
                  className="fluid-rounded-full"
                  style={{
                    display: 'inline-block', width: '1rem', height: '0.5rem',
                    background: entity.color || '#39AEA9', marginRight: '0.5rem',
                    boxShadow: `0 0 10px ${entity.color || '#39AEA9'}`
                  }}
                />
                {entity.name}
              </div>
            </Tooltip>
            {/* Sub-header row: Age (Left) and Bio Toggle (Right) */}
            <div className="flex items-center justify-between w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
              <div className="opacity-60 font-black" style={{ fontSize: 'var(--text-lg)', color: isFlora ? '#39AEA9' : '#A2D5AB' }}>
                {isFauna ? `${currentHour} Hours ${daysInCurrentYear} days ${years} years` : 'Biological Organism'}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleSection('bio'); }}
                className="transition-all juice-interactive"
                style={{
                  fontSize: 'var(--text-lg)', fontWeight: 600, color: '#39AEA9',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', background: 'none'
                }}
              >
                Bio {expandedSection === 'bio' ? '▲' : '▼'}
              </button>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="fluid-p-xs fluid-rounded transition-all"
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Bio Drawer Content (Expands inside the header block) */}
        {expandedSection === 'bio' && (
          <div
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

      {/* Main Content Area (Single Scrollable Container) */}
      <div className="fluid-p-sm flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar" style={{ maxHeight: '70vh' }}>

        {/* Relatives Section */}
        {/* Content */}
        {/* Clan/Relatives Section */}
        {isFauna && (
          <div className="fluid-rounded bg-white/[0.02] overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
            <button onClick={() => toggleSection('relatives')} className="w-full flex items-center justify-between fluid-p-sm" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <div className="flex flex-col items-start">
                <span className="text-[14px] font-black" style={{ color: '#E5EFC1' }}>{(entity as OrganismData).surname}</span>
                <span className="text-[10px] opacity-30">Gen {(entity as OrganismData).generation}</span>
              </div>
              <div style={{ color: '#39AEA9', transform: expandedSection === 'relatives' ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</div>
            </button>
            {expandedSection === 'relatives' && (
              <div className="fluid-px-sm fluid-pb-sm flex flex-col gap-1 animate-fade-in" style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                {relatives.length > 0 ? relatives.map(rel => (
                  <div key={rel.id} onClick={() => onFocus(rel.id)} className="flex justify-between opacity-60 hover:opacity-100 cursor-pointer text-[11px]" style={{ color: '#A2D5AB' }}>
                    <span>• {rel.name}</span>
                    <span className="text-[9px]">VIEW</span>
                  </div>
                )) : <div className="text-center opacity-20 italic text-[10px]">No living kin nearby</div>}
              </div>
            )}
          </div>
        )}
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
                  <span className="text-[var(--text-xs)] font-black" style={{ color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', cursor: 'help' }}>
                    {isFlora ? "Yield Potential" : "Metabolism"}
                  </span>
                </Tooltip>
                <span className="text-[var(--text-sm)] font-black" style={{ color: '#39AEA9', fontFamily: 'monospace' }}>
                  {isFlora
                    ? (Math.floor(entity.energyValue * entity.growthState))
                    : drainTotal
                  }
                  <span style={{ fontSize: 'var(--text-xs)', opacity: 0.5 }}>{isFlora ? " Energy" : " E/s"}</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[var(--text-xs)] font-black" style={{ color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
                  {isFlora ? "Maturity" : "Energy"}
                </span>
                <span className="text-[var(--text-sm)] font-black" style={{ color: '#E5EFC1', fontFamily: 'monospace' }}>
                  {isFlora
                    ? (entity.growthState * 100).toFixed(0) + "%"
                    : Math.floor((entity as OrganismData).energy)
                  }
                </span>
              </div>
            </div>
            <div className="w-full fluid-rounded-full overflow-hidden" style={{ height: '6px', background: 'rgba(255,255,255,0.05)' }}>
              <div
                className="h-full transition-all duration-500 shadow-glow"
                style={{
                  width: `${isFlora ? (entity.growthState * 100) : Math.min(100, ((entity as OrganismData).energy / 30000) * 100)}%`,
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
                  <div className="flex justify-between"><span>Base Harvest</span><span style={{ color: 'rgba(255,255,255,0.6)' }}>{entity.energyValue} Energy</span></div>
                  <div className="flex justify-between"><span>Growth Scalar</span><span style={{ color: 'rgba(255,255,255,0.6)' }}>× {entity.growthState.toFixed(2)}</span></div>
                  <div className="flex justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '4px', paddingTop: '4px', color: '#A2D5AB' }}>
                    <span>Current Energy Payoff</span>
                    <span>{Math.floor(entity.energyValue * entity.growthState)} Energy</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Traits Grid */}
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
            { id: 'ratio', name: 'Growth Rate', icon: '🌱', val: (entity.genome.traits.structure.v1 * SIM_CONSTANTS.FRAMES_PER_DAY * 100).toFixed(2), unit: '%', desc: 'The daily expansion speed of this organism relative to the simulation seasonal cycle.' },
            { id: 'nodes', name: 'Structural Segments', icon: '🌿', val: entity.genome.traits.structure.v2.toFixed(0), unit: ' Segments', desc: 'The branching complexity of the organism. More segments lead to higher energy density.' },
            { id: 'stem', name: 'Stem Mass', icon: '🌳', val: entity.genome.traits.ecology.v2.toFixed(1), unit: ' mm', desc: 'The physical thickness of the main structure, contributing to overall survival and nutrient yield.' },
            { id: 'leaf', name: 'Surface Area', icon: '🍀', val: entity.genome.traits.morphology.v1.toFixed(1), unit: ' Scale', desc: 'The scale of leaf structures that capture energy from the environment.' }
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

        {isFauna && (
          <div style={{ marginTop: '0.2rem' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
              <div className="text-[var(--text-xs)] font-black flex items-center" style={{ color: '#A2D5AB', opacity: 0.3, gap: '8px' }}>
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
                    textTransform: 'uppercase'
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
                    textTransform: 'uppercase'
                  }}
                >
                  LT: {VectorDB.getHistory().find(o => o.id === entity.id)?.memories?.length || 0}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 custom-scrollbar" style={{ maxHeight: '20rem', overflowY: 'auto', paddingRight: '4px' }}>
              {(entity as OrganismData).memories.length > 0 ? (
                (entity as OrganismData).memories.slice().reverse().map(memory => (
                  <div
                    key={memory.id}
                    className="fluid-p-xs fluid-rounded flex justify-between items-center group transition-all"
                    style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.4)' }}
                  >
                    <Tooltip title={(memory.entityIds?.length || 0) > 1 ? "👥 Group" : "Memory"} content={getGroupNamesTooltip(memory)}>
                      <div className="flex items-center gap-2 truncate flex-1" style={{ minWidth: 0 }}>
                        <span className="whitespace-nowrap litho-text flex-shrink-0" style={{ fontSize: '1rem' }}>{getMemorySyntaxStr(memory)}</span> {/* first memory column: lithograph */}
                        <span className="truncate group-hover-visible-text transition-all">
                          {memory.content}
                          {memory.count && memory.count > 1 && (
                            <span style={{ color: '#39AEA9', marginLeft: '4px', fontWeight: 'bold' }}>x{memory.count}</span>
                          )}
                        </span>
                      </div>
                    </Tooltip>
                    <span className="opacity-20 font-black whitespace-nowrap text-right flex-shrink-0" style={{ fontSize: '0.5rem', width: '5rem' }}>{UNIT_UTILS.toDays(simTime - memory.timestamp).toFixed(1)}d</span> {/* second memory column: age */}
                  </div>
                ))
              ) : (
                <div className="italic text-center tracking-widest uppercase" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.1)', padding: '1rem 0' }}>No neural records found</div>
              )}
            </div>
          </div>
        )}

      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 1px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
        .hover-opacity-100:hover { opacity: 1 !important; }
        .group:hover .group-hover-visible-text { white-space: normal !important; max-width: 100% !important; }
      `}</style>
    </div>
  );
};

export default EntityInspector;