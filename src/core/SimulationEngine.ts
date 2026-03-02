import { Vector2, SimulationState, OrganismData, FloraData, SimEvent, SimConfig, Genome } from '../../types';
import { VectorMath } from './VectorMath';
import { Genetics as GeneticsEngine } from '../evolution/GeneticsEngine';
import { Metabolism } from '../entities/Fauna/Metabolism';
import { VectorDB } from '../data/VectorDB';
import { LinguisticEngine } from '../entities/Fauna/LinguisticEngine';
import { SpatialGrid } from './SpatialGrid';
import { TerrainManager } from './TerrainManager';
import { SIM_CONSTANTS, UNIT_UTILS, WORLD_CONSTANTS, POPULATION_CONSTANTS, CHRONOS_UTILS, DEFAULT_TRAIT_RANGES } from './Constants';
import { Fauna } from '../entities/Fauna/Base';
import { Flora } from '../entities/Flora/Base';
import { FernLogic } from '../entities/Flora/Fern/Logic';
import { FERN_DNA_PROFILE } from '../entities/Flora/Fern/DNAProfile';
import { SpeciesALogic } from '../entities/Fauna/SpeciesA/Logic';
import { SPECIES_A_DNA } from '../entities/Fauna/SpeciesA/DNAProfile';
import { ReproductionEngine } from '../entities/Fauna/ReproductionEngine';

export class SimulationEngine {
  state: SimulationState;
  private lastId = 0;
  private static lastPopStats = { meanAge: 0, speed95th: 0 };
  private orgGrid: SpatialGrid;
  private FloraGrid: SpatialGrid;
  private floraGridDirty = true;
  public terrain: TerrainManager;
  private logicInstances: Map<string, SpeciesALogic> = new Map();

  private config: SimConfig = {
    initialPopulation: POPULATION_CONSTANTS.INITIAL_ORGANISMS,
    initialEnergy: POPULATION_CONSTANTS.INITIAL_ENERGY,
    traitRanges: DEFAULT_TRAIT_RANGES
  };

  constructor(width: number, height: number, initialState?: SimulationState) {
    const savedState = initialState || null;

    if (savedState) {
      this.state = {
        config: { ...this.config }, // Ensure we have a default config
        hour: 0,
        day: 0,
        season: 1,
        cycle: 1,
        events: [],
        apexCandidates: [],
        organisms: [],
        Flora: [],
        seed: Math.random(),
        ...savedState
      };

      // Force refresh trait ranges to ensure unit standardization
      this.state.config.traitRanges = { ...DEFAULT_TRAIT_RANGES };
      this.state.config.initialEnergy = [...POPULATION_CONSTANTS.INITIAL_ENERGY];

      // Migrate old 'food' key to 'Flora' if it exists
      if ((savedState as any).food && (!this.state.Flora || this.state.Flora.length === 0)) {
        this.state.Flora = (savedState as any).food;
      }

      // Ensure all Flora have growthState
      if (this.state.Flora) {
        this.state.Flora.forEach(f => {
          if (f.growthState === undefined) f.growthState = 0.5;
          if (!f.genome) f.genome = {
            traits: {
              structure: { v1: 0.001, v2: 6, d1: 0.5, d2: 0.5 },
              vitality: { v1: 1200, v2: 10000, d1: 0.5, d2: 0.5 },
              morphology: { v1: 4, v2: 120, d1: 0.5, d2: 0.5 },
              ecology: { v1: 20, v2: 1.5, d1: 0.5, d2: 0.5 }
            }
          };
        });
      }

      // Ensure all Organisms have valid genomes & upgraded traits
      if (this.state.organisms) {
        this.state.organisms.forEach(o => {
          if (!o.genome || !o.genome.traits || Object.keys(o.genome.traits).length === 0) {
            console.warn(`SimEngine: Healed CORRUPT genome for organism ${o.id}`, o.genome);
            o.genome = GeneticsEngine.createRandomGenome(this.state.config);
          }
          GeneticsEngine.ensureIntegrity(o.genome);
          o.expressedStats = GeneticsEngine.express(o.genome);
          if (!o.memories) o.memories = [];
          if (!o.heading) {
            o.heading = VectorMath.normalize({ x: Math.random() - 0.5, y: Math.random() - 0.5 });
          }
        });
      }

    } else {
      this.state = {
        organisms: [],
        Flora: [],
        worldSize: { x: width, y: height },
        time: 0,
        day: 0,
        hour: 0,
        season: 1,
        cycle: 1,
        config: this.config,
        events: [],
        apexCandidates: [],
        seed: Math.random()
      };
    }

    const w = this.state.worldSize.x;
    const h = this.state.worldSize.y;
    this.terrain = new TerrainManager(w, h, this.state.seed);
    this.orgGrid = new SpatialGrid(w, h, WORLD_CONSTANTS.PIXELS_PER_METER);
    this.FloraGrid = new SpatialGrid(w, h, WORLD_CONSTANTS.PIXELS_PER_METER);

    if (savedState) {
      const orgIds = (this.state.organisms || []).map((o: any) => parseInt(o.id)).filter((id: any) => !isNaN(id));
      const FloraIds = (this.state.Flora || []).map((f: any) => parseInt(f.id)).filter((id: any) => !isNaN(id));
      this.lastId = Math.max(0, ...orgIds, ...FloraIds);
    } else {
      this.init();
    }
  }

  private init() {
    for (let i = 0; i < this.state.config.initialPopulation; i++) {
      this.spawnOrganism();
    }
    for (let i = 0; i < POPULATION_CONSTANTS.INITIAL_FLORA; i++) {
      const randomMaturity = 0.4 + Math.random() * 0.5;
      this.spawnFlora(undefined, undefined, randomMaturity);
    }
  }

  hardReset() {
    VectorDB.hardReset();
    this.logicInstances.clear();
    this.state = {
      organisms: [],
      Flora: [],
      worldSize: this.state.worldSize,
      time: 0,
      day: 0,
      hour: 0,
      season: 1,
      cycle: 1,
      config: this.config,
      events: [],
      apexCandidates: [],
      seed: Math.random()
    };
    this.lastId = 0;
    this.terrain = new TerrainManager(this.state.worldSize.x, this.state.worldSize.y);
    this.orgGrid = new SpatialGrid(this.state.worldSize.x, this.state.worldSize.y, WORLD_CONSTANTS.PIXELS_PER_METER);
    this.FloraGrid = new SpatialGrid(this.state.worldSize.x, this.state.worldSize.y, WORLD_CONSTANTS.PIXELS_PER_METER);
    this.init();
  }

  private spawnOrganism(
    parentA?: OrganismData,
    parentB?: OrganismData,
    position?: Vector2,
    initialEnergy?: number,
    childGenome?: Genome
  ) {
    const genome = childGenome || (parentA
      ? (parentB ? GeneticsEngine.recombine(parentA.genome, parentB.genome) : (() => { throw new Error("Asexual reproduction is disabled."); })())
      : GeneticsEngine.createRandomGenome(this.state.config));

    const expressedStats = GeneticsEngine.express(genome);
    const firstName = LinguisticEngine.generateFirstName();
    const finalSurname = parentA ? (parentB ? (Math.random() > 0.5 ? parentA.surname : parentB.surname) : parentA.surname) : LinguisticEngine.generateSurname();

    const organism: OrganismData = {
      id: (++this.lastId).toString(),
      parentA_Id: parentA?.id,
      parentB_Id: parentB?.id,
      position: position || this.terrain.getSafeSpawnPos(),
      velocity: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },
      heading: VectorMath.normalize({ x: Math.random() - 0.5, y: Math.random() - 0.5 }),
      energy: initialEnergy !== undefined
        ? initialEnergy
        : (parentA ? 400 : (this.state.config.initialEnergy[0] + Math.random() * (this.state.config.initialEnergy[1] - this.state.config.initialEnergy[0]))),
      age: 0,
      genome,
      expressedStats,
      color: parentA ? parentA.color : `hsl(${Math.random() * 360}, 70%, 60%)`,
      generation: parentA ? parentA.generation + 1 : 1,
      name: `${firstName} ${finalSurname}`,
      firstName,
      surname: finalSurname,
      matingTimer: 0,
      matingCount: 0,
      memories: [],
      timestamp: this.state.time,
      bending: 0
    };

    if (typeof window !== 'undefined') {
      VectorDB.addHistory(organism);
    } else {
      (self as any).postMessage({ type: 'REGISTRY_LOG', data: organism });
    }
    this.state.organisms.push(organism);
    this.logEvent('BIRTH', parentA ? `${organism.name} born to ${parentA.surname} clan` : `Progenitor ${organism.name} enters the world`, organism.position, organism.id, organism.color);
  }

  private spawnFlora(pos?: Vector2, type: 'HERBIVORE' | 'CARNIVORE' = 'HERBIVORE', initialGrowth?: number) {
    const finalPos = pos || this.terrain.getSafeSpawnPos();
    const flora = Flora.create(Math.random().toString(36).substr(2, 9), finalPos, 0, 0, type, 'Fern', FERN_DNA_PROFILE.generateGenome);

    if (initialGrowth !== undefined) {
      flora.data.growthState = initialGrowth;
    }

    flora.data.biome = this.terrain.getBiomeAt(finalPos.x, finalPos.y);
    this.state.Flora.push(flora.data);
    this.floraGridDirty = true;
  }

  logEvent(type: 'BIRTH' | 'DEATH' | 'MILESTONE', message: string, position: Vector2, entityId?: string, color?: string) {
    if (!this.state.events) this.state.events = [];
    this.state.events.unshift({
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      timestamp: this.state.time,
      position: { ...position },
      entityId,
      color
    });
    if (this.state.events.length > 50) this.state.events.pop();
  }

  forceSave() {
    if (this.state.events && this.state.events.length > 20) {
      this.state.events = this.state.events.slice(0, 20);
    }
    if (typeof window !== 'undefined') {
      VectorDB.syncLiving(this.state.organisms);
      VectorDB.saveSimState(this.state);
    }
  }

  update() {
    this.state.time++;
    const isHourly = CHRONOS_UTILS.isHourlyTick(this.state.time);

    if (this.state.time % 600 === 0) this.forceSave();

    this.orgGrid.update(this.state.organisms);
    if (this.floraGridDirty) {
      this.FloraGrid.update(this.state.Flora);
      this.floraGridDirty = false;
    }

    const orgMap = new Map<string, OrganismData>();
    this.state.organisms.forEach(o => orgMap.set(o.id, o));
    const FloraMap = new Map<string, FloraData>();
    this.state.Flora.forEach(f => FloraMap.set(f.id, f));

    // Update Internal Timers
    this.state.hour = Math.floor((this.state.time % SIM_CONSTANTS.FRAMES_PER_DAY) / SIM_CONSTANTS.FRAMES_PER_HOUR);
    const totalDays = Math.floor(this.state.time / SIM_CONSTANTS.FRAMES_PER_DAY);
    this.state.day = totalDays;
    const totalSeasons = Math.floor(totalDays / SIM_CONSTANTS.DAYS_PER_SEASON);
    const prevSeason = this.state.season;
    this.state.season = (totalSeasons % SIM_CONSTANTS.SEASONS_PER_CYCLE) + 1;
    this.state.cycle = Math.floor(totalSeasons / SIM_CONSTANTS.SEASONS_PER_CYCLE) + 1;

    // Seasonal Bloom Event (Handled at season change)
    if (prevSeason !== this.state.season) {
      const bloomCount = Math.floor(POPULATION_CONSTANTS.BLOOM_COUNT_MIN + Math.random() * (POPULATION_CONSTANTS.BLOOM_COUNT_MAX - POPULATION_CONSTANTS.BLOOM_COUNT_MIN));
      for (let i = 0; i < bloomCount; i++) {
        this.spawnFlora();
      }
      this.logEvent('MILESTONE', `Season ${this.state.season} bloom: ${bloomCount} new flora emerged`,
        { x: this.state.worldSize.x / 2, y: this.state.worldSize.y / 2 }, undefined, '#4ade80');
    }

    // --- HOURLY ECOLOGICAL UPDATES ---
    if (isHourly) {
      // 1. Regular random Flora spawning
      if (Math.random() < FERN_DNA_PROFILE.ECOLOGY.HOURLY_RANDOM_SPAWN_CHANCE) {
        this.spawnFlora();
      }

      const searchRadiusPx = UNIT_UTILS.mToPx(FERN_DNA_PROFILE.ECOLOGY.CLUSTER_SEARCH_RADIUS_METERS);

      // 2. Flora Growth & Spreading
      this.state.Flora.forEach(floraData => {
        // Growth Update
        FernLogic.update(floraData, this.terrain);

        // Spreading/Clumping logic
        const neighbors = this.FloraGrid.getNeighbors(floraData.position, searchRadiusPx);
        const nearbyCount = neighbors.length;
        floraData.nearbyFloraCount = nearbyCount;

        if (nearbyCount >= FERN_DNA_PROFILE.ECOLOGY.CLUSTER_MIN_NEIGHBORS &&
          nearbyCount < FERN_DNA_PROFILE.ECOLOGY.CLUSTER_MAX_NEIGHBORS &&
          Math.random() < FERN_DNA_PROFILE.ECOLOGY.CLUSTER_GROWTH_RATE * (floraData.growthState)) {

          const angle = Math.random() * Math.PI * 2;
          const distM = FERN_DNA_PROFILE.ECOLOGY.CLUSTER_SPAWN_DISTANCE_MIN +
            Math.random() * (FERN_DNA_PROFILE.ECOLOGY.CLUSTER_SPAWN_DISTANCE_MAX - FERN_DNA_PROFILE.ECOLOGY.CLUSTER_SPAWN_DISTANCE_MIN);

          const distPx = UNIT_UTILS.mToPx(distM);
          const newPos = {
            x: floraData.position.x + Math.cos(angle) * distPx,
            y: floraData.position.y + Math.sin(angle) * distPx
          };

          if (newPos.x > 0 && newPos.x < this.state.worldSize.x &&
            newPos.y > 0 && newPos.y < this.state.worldSize.y) {
            this.spawnFlora(newPos);
          }
        }
      });

      // 3. Cleanup expired flora
      this.state.Flora = this.state.Flora.filter(f => (f.lifetime === undefined || f.lifetime > 0));
    }

    // Population Stats & Apex Tracking
    if (this.state.time % 60 === 0) {
      if (this.state.organisms.length > 0) {
        const ages = this.state.organisms.map(o => o.age);
        const meanAge = ages.reduce((a, b) => a + b, 0) / ages.length;
        const speeds = this.state.organisms.map(o => o.expressedStats.speed).sort((a, b) => a - b);
        SimulationEngine.lastPopStats = { meanAge, speed95th: speeds[Math.floor(speeds.length * 0.95)] || 0 };
        this.state.apexCandidates = [...this.state.organisms].sort((a, b) => b.generation - a.generation || b.energy - a.energy).slice(0, 20);
      } else {
        this.state.apexCandidates = [];
      }
    }

    const popStats = SimulationEngine.lastPopStats;

    this.state.organisms.forEach((orgData) => {
      let fauna = this.logicInstances.get(orgData.id);
      if (!fauna) {
        fauna = new SpeciesALogic(orgData);
        this.logicInstances.set(orgData.id, fauna);
      }

      // 1. HANDLE MATING COMPLETION
      if (orgData.matingTimer === 0 && orgData.matingTargetId) {
        const other = orgMap.get(orgData.matingTargetId);
        if (other && parseInt(orgData.id) < parseInt(other.id)) {
          const birth = ReproductionEngine.processBirth(orgData, other);
          orgData.energy -= birth.costToEachParent;
          other.energy -= birth.costToEachParent;
          this.spawnOrganism(orgData, other, { ...orgData.position }, birth.initialEnergy, birth.childGenome);
          orgData.matingCount++;
          other.matingCount++;
        }
        orgData.matingTargetId = undefined;
      }

      // Sensory Integration
      const sightRangePx = UNIT_UTILS.mToPx(orgData.expressedStats.sight_range);
      const audibleRangePx = UNIT_UTILS.mToPx(orgData.expressedStats.audible_range || 3.0);
      const maxSensoryRangePx = Math.max(sightRangePx, audibleRangePx);

      const fNeighborIds = this.FloraGrid.getNeighbors(orgData.position, sightRangePx);
      const floraNeighbors = fNeighborIds.map(id => FloraMap.get(id)).filter(f => f !== undefined) as FloraData[];

      const orgNeighborIds = this.orgGrid.getNeighbors(orgData.position, maxSensoryRangePx);
      const orgNeighbors = orgNeighborIds.map(id => orgMap.get(id)).filter(o => o !== undefined && o.id !== orgData.id) as OrganismData[];

      // Delegate Thinking
      fauna.think(
        this.state.time,
        this.state.worldSize,
        this.terrain,
        popStats,
        { organisms: orgNeighbors, flora: floraNeighbors },
        {
          onEat: (f) => {
            orgData.energy += f.energyValue * f.growthState;
            const idx = this.state.Flora.findIndex(flora => flora.id === f.id);
            if (idx !== -1) {
              this.state.Flora.splice(idx, 1);
              this.floraGridDirty = true;
            }
          },
          onMate: (other) => {
            if (orgData.matingTimer === 0 && other.matingTimer === 0) {
              const matingFrames = POPULATION_CONSTANTS.MATING_BOND_DURATION_HOURS * SIM_CONSTANTS.FRAMES_PER_HOUR;
              orgData.matingTimer = matingFrames;
              orgData.matingTargetId = other.id;
              other.matingTimer = matingFrames;
              other.matingTargetId = orgData.id;
              this.logEvent('MILESTONE', `${orgData.name} & ${other.name} are bonding`, orgData.position);
            }
          }
        }
      );

      fauna.update(this.state.time, this.state.worldSize, this.terrain, popStats);
    });

    // Death & Cleanup
    this.state.organisms = this.state.organisms.filter(org => {
      const dead = org.age > org.expressedStats.lifespan || org.energy <= 0;
      if (dead) {
        this.logicInstances.delete(org.id);
        this.spawnFlora(org.position, 'CARNIVORE');
        if (typeof window !== 'undefined') {
          VectorDB.markDeceased(org.id, org);
        } else {
          (self as any).postMessage({ type: 'REGISTRY_DEATH', id: org.id, data: org });
        }
      }
      return !dead;
    });

    const initialFloraLen = this.state.Flora.length;
    this.state.Flora = this.state.Flora.filter(f => {
      if (f.lifetime !== undefined) { f.lifetime--; return f.lifetime > 0; }
      return true;
    });
    if (this.state.Flora.length !== initialFloraLen) this.floraGridDirty = true;
  }
}

