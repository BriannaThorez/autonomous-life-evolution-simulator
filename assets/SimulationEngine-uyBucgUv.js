const n=`import { Vector2, SimulationState, OrganismData, FloraData, SimEvent, SimConfig, Genome } from '../../types';\r
import { VectorMath } from './VectorMath';\r
import { Genetics as GeneticsEngine } from '../evolution/GeneticsEngine';\r
import { Metabolism } from '../entities/Fauna/Metabolism';\r
import { VectorDB } from '../data/VectorDB';\r
import { LinguisticEngine } from '../entities/Fauna/Language/LinguisticEngine';\r
import { SpatialGrid } from './SpatialGrid';\r
import { TerrainManager } from './TerrainManager';\r
import { SIM_CONSTANTS, UNIT_UTILS, WORLD_CONSTANTS, POPULATION_CONSTANTS, CHRONOS_UTILS, DEFAULT_TRAIT_RANGES } from './Constants';\r
import { Fauna } from '../entities/Fauna/Base';\r
import { Flora } from '../entities/Flora/Base';\r
import { FernLogic } from '../entities/Flora/Fern/Logic';\r
import { FERN_DNA_PROFILE } from '../entities/Flora/Fern/DNAProfile';\r
import { SpeciesALogic } from '../entities/Fauna/SpeciesA/Logic';\r
import { SPECIES_A_DNA } from '../entities/Fauna/SpeciesA/DNAProfile';\r
import { ReproductionEngine } from '../entities/Fauna/ReproductionEngine';\r
\r
export class SimulationEngine {\r
  state: SimulationState;\r
  private lastId = 0;\r
  private static lastPopStats = { meanAge: 0, speed95th: 0 };\r
  private orgGrid: SpatialGrid;\r
  private FloraGrid: SpatialGrid;\r
  private floraGridDirty = true;\r
  public terrain: TerrainManager;\r
  private logicInstances: Map<string, SpeciesALogic> = new Map();\r
\r
  private config: SimConfig = {\r
    initialPopulation: POPULATION_CONSTANTS.INITIAL_ORGANISMS,\r
    initialEnergy: POPULATION_CONSTANTS.INITIAL_ENERGY,\r
    traitRanges: DEFAULT_TRAIT_RANGES\r
  };\r
\r
  constructor(width: number, height: number, initialState?: SimulationState) {\r
    const savedState = initialState || null;\r
\r
    if (savedState) {\r
      this.state = {\r
        config: { ...this.config }, // Ensure we have a default config\r
        hour: 0,\r
        day: 0,\r
        season: 1,\r
        cycle: 1,\r
        events: [],\r
        apexCandidates: [],\r
        organisms: [],\r
        Flora: [],\r
        seed: Math.random(),\r
        ...savedState\r
      };\r
\r
      // Force refresh trait ranges to ensure unit standardization\r
      this.state.config.traitRanges = { ...DEFAULT_TRAIT_RANGES };\r
      this.state.config.initialEnergy = [...POPULATION_CONSTANTS.INITIAL_ENERGY];\r
\r
      // Migrate old 'food' key to 'Flora' if it exists\r
      if ((savedState as any).food && (!this.state.Flora || this.state.Flora.length === 0)) {\r
        this.state.Flora = (savedState as any).food;\r
      }\r
\r
      // Ensure all Flora have growthState\r
      if (this.state.Flora) {\r
        this.state.Flora.forEach(f => {\r
          if (f.growthState === undefined) f.growthState = 0.5;\r
          if (!f.genome) f.genome = {\r
            traits: {\r
              structure: { v1: 0.001, v2: 6, d1: 0.5, d2: 0.5 },\r
              vitality: { v1: 1200, v2: 10000, d1: 0.5, d2: 0.5 },\r
              morphology: { v1: 4, v2: 120, d1: 0.5, d2: 0.5 },\r
              ecology: { v1: 20, v2: 1.5, d1: 0.5, d2: 0.5 }\r
            }\r
          };\r
        });\r
      }\r
\r
      // Ensure all Organisms have valid genomes & upgraded traits\r
      if (this.state.organisms) {\r
        this.state.organisms.forEach(o => {\r
          if (!o.genome || !o.genome.traits || Object.keys(o.genome.traits).length === 0) {\r
            console.warn(\`SimEngine: Healed CORRUPT genome for organism \${o.id}\`, o.genome);\r
            o.genome = GeneticsEngine.createRandomGenome(this.state.config);\r
          }\r
          GeneticsEngine.ensureIntegrity(o.genome);\r
          o.expressedStats = GeneticsEngine.express(o.genome);\r
          if (!o.memories) o.memories = [];\r
          if (!o.heading) {\r
            o.heading = VectorMath.normalize({ x: Math.random() - 0.5, y: Math.random() - 0.5 });\r
          }\r
        });\r
      }\r
\r
    } else {\r
      this.state = {\r
        organisms: [],\r
        Flora: [],\r
        worldSize: { x: width, y: height },\r
        time: 0,\r
        day: 0,\r
        hour: 0,\r
        season: 1,\r
        cycle: 1,\r
        config: this.config,\r
        events: [],\r
        apexCandidates: [],\r
        seed: Math.random()\r
      };\r
    }\r
\r
    const w = this.state.worldSize.x;\r
    const h = this.state.worldSize.y;\r
    this.terrain = new TerrainManager(w, h, this.state.seed);\r
    this.orgGrid = new SpatialGrid(w, h, WORLD_CONSTANTS.PIXELS_PER_METER);\r
    this.FloraGrid = new SpatialGrid(w, h, WORLD_CONSTANTS.PIXELS_PER_METER);\r
\r
    if (savedState) {\r
      const orgIds = (this.state.organisms || []).map((o: any) => parseInt(o.id)).filter((id: any) => !isNaN(id));\r
      const FloraIds = (this.state.Flora || []).map((f: any) => parseInt(f.id)).filter((id: any) => !isNaN(id));\r
      this.lastId = Math.max(0, ...orgIds, ...FloraIds);\r
    } else {\r
      this.init();\r
    }\r
  }\r
\r
  private init() {\r
    for (let i = 0; i < this.state.config.initialPopulation; i++) {\r
      this.spawnOrganism();\r
    }\r
    for (let i = 0; i < POPULATION_CONSTANTS.INITIAL_FLORA; i++) {\r
      const randomMaturity = 0.4 + Math.random() * 0.5;\r
      this.spawnFlora(undefined, undefined, randomMaturity);\r
    }\r
  }\r
\r
  hardReset() {\r
    VectorDB.hardReset();\r
    this.logicInstances.clear();\r
    this.state = {\r
      organisms: [],\r
      Flora: [],\r
      worldSize: this.state.worldSize,\r
      time: 0,\r
      day: 0,\r
      hour: 0,\r
      season: 1,\r
      cycle: 1,\r
      config: this.config,\r
      events: [],\r
      apexCandidates: [],\r
      seed: Math.random(),\r
      lastResetTime: new Date().toISOString()\r
    };\r
    this.lastId = 0;\r
    this.terrain = new TerrainManager(this.state.worldSize.x, this.state.worldSize.y);\r
    this.orgGrid = new SpatialGrid(this.state.worldSize.x, this.state.worldSize.y, WORLD_CONSTANTS.PIXELS_PER_METER);\r
    this.FloraGrid = new SpatialGrid(this.state.worldSize.x, this.state.worldSize.y, WORLD_CONSTANTS.PIXELS_PER_METER);\r
    this.init();\r
  }\r
\r
  private spawnOrganism(\r
    parentA?: OrganismData,\r
    parentB?: OrganismData,\r
    position?: Vector2,\r
    initialEnergy?: number,\r
    childGenome?: Genome\r
  ) {\r
    const genome = childGenome || (parentA\r
      ? (parentB ? GeneticsEngine.recombine(parentA.genome, parentB.genome) : (() => { throw new Error("Asexual reproduction is disabled."); })())\r
      : GeneticsEngine.createRandomGenome(this.state.config));\r
\r
    const expressedStats = GeneticsEngine.express(genome);\r
    // Active fauna identity path: IDs come from SimulationEngine.lastId, and names use the simple\r
    // LinguisticEngine piecewise path below. We intentionally do NOT use\r
    // LinguisticEngine.constructFullLinguisticProfile() here because the current simulation should not\r
    // inherit first names, add Roman numeral suffixes, or auto-assign noble/house lineage metadata at birth.\r
    const firstName = LinguisticEngine.generateFirstName();\r
    const finalSurname = parentA ? (parentB ? (Math.random() > 0.5 ? parentA.surname : parentB.surname) : parentA.surname) : LinguisticEngine.generateSurname();\r
\r
    const organism: OrganismData = {\r
      id: (++this.lastId).toString(),\r
      parentA_Id: parentA?.id,\r
      parentB_Id: parentB?.id,\r
      position: position || this.terrain.getSafeSpawnPos(),\r
      velocity: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },\r
      heading: VectorMath.normalize({ x: Math.random() - 0.5, y: Math.random() - 0.5 }),\r
      energy: initialEnergy !== undefined\r
        ? initialEnergy\r
        : (parentA ? 400 : (this.state.config.initialEnergy[0] + Math.random() * (this.state.config.initialEnergy[1] - this.state.config.initialEnergy[0]))),\r
      age: 0,\r
      genome,\r
      expressedStats,\r
      color: parentA ? parentA.color : \`hsl(\${Math.random() * 360}, 70%, 60%)\`,\r
      generation: parentA ? parentA.generation + 1 : 1,\r
      name: \`\${firstName} \${finalSurname}\`,\r
      firstName,\r
      surname: finalSurname,\r
      matingTimer: 0,\r
      matingCount: 0,\r
      memories: [],\r
      timestamp: this.state.time,\r
      bending: 0\r
    };\r
\r
    if (typeof window !== 'undefined') {\r
      VectorDB.addHistory(organism);\r
    } else {\r
      (self as any).postMessage({ type: 'REGISTRY_LOG', data: organism });\r
    }\r
    this.state.organisms.push(organism);\r
    this.logEvent('BIRTH', parentA ? \`\${organism.name} born to \${parentA.surname} clan\` : \`Progenitor \${organism.name} enters the world\`, organism.position, organism.id, organism.color);\r
  }\r
\r
  private spawnFlora(pos?: Vector2, type: 'HERBIVORE' | 'CARNIVORE' = 'HERBIVORE', initialGrowth?: number) {\r
    const finalPos = pos || this.terrain.getSafeSpawnPos();\r
    const flora = Flora.create(Math.random().toString(36).substr(2, 9), finalPos, 0, 0, type, 'Fern', FERN_DNA_PROFILE.generateGenome);\r
\r
    if (initialGrowth !== undefined) {\r
      flora.data.growthState = initialGrowth;\r
    }\r
\r
    flora.data.biome = this.terrain.getBiomeAt(finalPos.x, finalPos.y);\r
    this.state.Flora.push(flora.data);\r
    this.floraGridDirty = true;\r
  }\r
\r
  logEvent(type: 'BIRTH' | 'DEATH' | 'MILESTONE', message: string, position: Vector2, entityId?: string, color?: string) {\r
    if (!this.state.events) this.state.events = [];\r
    this.state.events.unshift({\r
      id: Math.random().toString(36).substr(2, 9),\r
      type,\r
      message,\r
      timestamp: this.state.time,\r
      position: { ...position },\r
      entityId,\r
      color\r
    });\r
    if (this.state.events.length > 50) this.state.events.pop();\r
  }\r
\r
  forceSave() {\r
    if (this.state.events && this.state.events.length > 20) {\r
      this.state.events = this.state.events.slice(0, 20);\r
    }\r
    if (typeof window !== 'undefined') {\r
      VectorDB.syncLiving(this.state.organisms);\r
      VectorDB.saveSimState(this.state);\r
    }\r
  }\r
\r
  update() {\r
    this.state.time++;\r
    const isHourly = CHRONOS_UTILS.isHourlyTick(this.state.time);\r
\r
    if (this.state.time % 600 === 0) this.forceSave();\r
\r
    this.orgGrid.update(this.state.organisms);\r
    if (this.floraGridDirty) {\r
      this.FloraGrid.update(this.state.Flora);\r
      this.floraGridDirty = false;\r
    }\r
\r
    const orgMap = new Map<string, OrganismData>();\r
    this.state.organisms.forEach(o => orgMap.set(o.id, o));\r
    const FloraMap = new Map<string, FloraData>();\r
    this.state.Flora.forEach(f => FloraMap.set(f.id, f));\r
\r
    // Update Internal Timers\r
    this.state.hour = Math.floor((this.state.time % SIM_CONSTANTS.FRAMES_PER_DAY) / SIM_CONSTANTS.FRAMES_PER_HOUR);\r
    const totalDays = Math.floor(this.state.time / SIM_CONSTANTS.FRAMES_PER_DAY);\r
    this.state.day = totalDays;\r
    const totalSeasons = Math.floor(totalDays / SIM_CONSTANTS.DAYS_PER_SEASON);\r
    const prevSeason = this.state.season;\r
    this.state.season = (totalSeasons % SIM_CONSTANTS.SEASONS_PER_CYCLE) + 1;\r
    this.state.cycle = Math.floor(totalSeasons / SIM_CONSTANTS.SEASONS_PER_CYCLE) + 1;\r
\r
    // Seasonal Bloom Event (Handled at season change)\r
    if (prevSeason !== this.state.season) {\r
      const bloomCount = Math.floor(POPULATION_CONSTANTS.BLOOM_COUNT_MIN + Math.random() * (POPULATION_CONSTANTS.BLOOM_COUNT_MAX - POPULATION_CONSTANTS.BLOOM_COUNT_MIN));\r
      for (let i = 0; i < bloomCount; i++) {\r
        this.spawnFlora();\r
      }\r
      this.logEvent('MILESTONE', \`Season \${this.state.season} bloom: \${bloomCount} new flora emerged\`,\r
        { x: this.state.worldSize.x / 2, y: this.state.worldSize.y / 2 }, undefined, '#4ade80');\r
    }\r
\r
    // --- HOURLY ECOLOGICAL UPDATES ---\r
    if (isHourly) {\r
      // 1. Regular random Flora spawning\r
      if (Math.random() < FERN_DNA_PROFILE.ECOLOGY.HOURLY_RANDOM_SPAWN_CHANCE) {\r
        this.spawnFlora();\r
      }\r
\r
      const searchRadiusPx = UNIT_UTILS.mToPx(FERN_DNA_PROFILE.ECOLOGY.CLUSTER_SEARCH_RADIUS_METERS);\r
\r
      // 2. Flora Growth & Spreading\r
      this.state.Flora.forEach(floraData => {\r
        // Growth Update\r
        FernLogic.update(floraData, this.terrain);\r
\r
        // Spreading/Clumping logic\r
        const neighbors = this.FloraGrid.getNeighbors(floraData.position, searchRadiusPx);\r
        const nearbyCount = neighbors.length;\r
        floraData.nearbyFloraCount = nearbyCount;\r
\r
        if (nearbyCount >= FERN_DNA_PROFILE.ECOLOGY.CLUSTER_MIN_NEIGHBORS &&\r
          nearbyCount < FERN_DNA_PROFILE.ECOLOGY.CLUSTER_MAX_NEIGHBORS &&\r
          Math.random() < FERN_DNA_PROFILE.ECOLOGY.CLUSTER_GROWTH_RATE * (floraData.growthState)) {\r
\r
          const angle = Math.random() * Math.PI * 2;\r
          const distM = FERN_DNA_PROFILE.ECOLOGY.CLUSTER_SPAWN_DISTANCE_MIN +\r
            Math.random() * (FERN_DNA_PROFILE.ECOLOGY.CLUSTER_SPAWN_DISTANCE_MAX - FERN_DNA_PROFILE.ECOLOGY.CLUSTER_SPAWN_DISTANCE_MIN);\r
\r
          const distPx = UNIT_UTILS.mToPx(distM);\r
          const newPos = {\r
            x: floraData.position.x + Math.cos(angle) * distPx,\r
            y: floraData.position.y + Math.sin(angle) * distPx\r
          };\r
\r
          if (newPos.x > 0 && newPos.x < this.state.worldSize.x &&\r
            newPos.y > 0 && newPos.y < this.state.worldSize.y) {\r
            this.spawnFlora(newPos);\r
          }\r
        }\r
      });\r
\r
      // 3. Cleanup expired flora\r
      this.state.Flora = this.state.Flora.filter(f => (f.lifetime === undefined || f.lifetime > 0));\r
    }\r
\r
    // Population Stats & Apex Tracking\r
    if (this.state.time % 60 === 0) {\r
      if (this.state.organisms.length > 0) {\r
        const ages = this.state.organisms.map(o => o.age);\r
        const meanAge = ages.reduce((a, b) => a + b, 0) / ages.length;\r
        const speeds = this.state.organisms.map(o => o.expressedStats.speed).sort((a, b) => a - b);\r
        SimulationEngine.lastPopStats = { meanAge, speed95th: speeds[Math.floor(speeds.length * 0.95)] || 0 };\r
        this.state.apexCandidates = [...this.state.organisms].sort((a, b) => b.generation - a.generation || b.energy - a.energy).slice(0, 20);\r
      } else {\r
        this.state.apexCandidates = [];\r
      }\r
    }\r
\r
    const popStats = SimulationEngine.lastPopStats;\r
\r
    this.state.organisms.forEach((orgData) => {\r
      let fauna = this.logicInstances.get(orgData.id);\r
      if (!fauna) {\r
        fauna = new SpeciesALogic(orgData);\r
        this.logicInstances.set(orgData.id, fauna);\r
      }\r
\r
      // 1. HANDLE MATING COMPLETION\r
      if (orgData.matingTimer === 0 && orgData.matingTargetId) {\r
        const other = orgMap.get(orgData.matingTargetId);\r
        if (other && parseInt(orgData.id) < parseInt(other.id)) {\r
          const birth = ReproductionEngine.processBirth(orgData, other);\r
          orgData.energy -= birth.costToEachParent;\r
          other.energy -= birth.costToEachParent;\r
          this.spawnOrganism(orgData, other, { ...orgData.position }, birth.initialEnergy, birth.childGenome);\r
          orgData.matingCount++;\r
          other.matingCount++;\r
        }\r
        orgData.matingTargetId = undefined;\r
      }\r
\r
      // Sensory Integration\r
      const sightRangePx = UNIT_UTILS.mToPx(orgData.expressedStats.sight_range);\r
      const audibleRangePx = UNIT_UTILS.mToPx(orgData.expressedStats.audible_range || 3.0);\r
      const maxSensoryRangePx = Math.max(sightRangePx, audibleRangePx);\r
\r
      const fNeighborIds = this.FloraGrid.getNeighbors(orgData.position, sightRangePx);\r
      const floraNeighbors = fNeighborIds.map(id => FloraMap.get(id)).filter(f => f !== undefined) as FloraData[];\r
\r
      const orgNeighborIds = this.orgGrid.getNeighbors(orgData.position, maxSensoryRangePx);\r
      const orgNeighbors = orgNeighborIds.map(id => orgMap.get(id)).filter(o => o !== undefined && o.id !== orgData.id) as OrganismData[];\r
\r
      // Delegate Thinking\r
      fauna.think(\r
        this.state.time,\r
        this.state.worldSize,\r
        this.terrain,\r
        popStats,\r
        { organisms: orgNeighbors, flora: floraNeighbors },\r
        {\r
          onEat: (f) => {\r
            orgData.energy += f.energyValue * f.growthState;\r
            const idx = this.state.Flora.findIndex(flora => flora.id === f.id);\r
            if (idx !== -1) {\r
              this.state.Flora.splice(idx, 1);\r
              this.floraGridDirty = true;\r
            }\r
          },\r
          onMate: (other) => {\r
            if (orgData.matingTimer === 0 && other.matingTimer === 0) {\r
              const matingFrames = POPULATION_CONSTANTS.MATING_BOND_DURATION_HOURS * SIM_CONSTANTS.FRAMES_PER_HOUR;\r
              orgData.matingTimer = matingFrames;\r
              orgData.matingTargetId = other.id;\r
              other.matingTimer = matingFrames;\r
              other.matingTargetId = orgData.id;\r
              this.logEvent('MILESTONE', \`\${orgData.name} & \${other.name} are bonding\`, orgData.position);\r
            }\r
          }\r
        }\r
      );\r
\r
      fauna.update(this.state.time, this.state.worldSize, this.terrain, popStats);\r
    });\r
\r
    // Death & Cleanup\r
    this.state.organisms = this.state.organisms.filter(org => {\r
      const dead = org.age > org.expressedStats.lifespan || org.energy <= 0;\r
      if (dead) {\r
        this.logicInstances.delete(org.id);\r
        this.spawnFlora(org.position, 'CARNIVORE');\r
        if (typeof window !== 'undefined') {\r
          VectorDB.markDeceased(org.id, org);\r
        } else {\r
          (self as any).postMessage({ type: 'REGISTRY_DEATH', id: org.id, data: org });\r
        }\r
      }\r
      return !dead;\r
    });\r
\r
    const initialFloraLen = this.state.Flora.length;\r
    this.state.Flora = this.state.Flora.filter(f => {\r
      if (f.lifetime !== undefined) { f.lifetime--; return f.lifetime > 0; }\r
      return true;\r
    });\r
    if (this.state.Flora.length !== initialFloraLen) this.floraGridDirty = true;\r
  }\r
}\r
\r
`;export{n as default};
