
import { EntityStats } from '../../../types';
import { SIM_CONSTANTS } from '../../core/Constants';

export const Metabolism = {
  calculateEnergyLoss: (stats: EntityStats): number => {
    // Standardized Formula: Energy/sec = (1.0 / Metabolism) * Speed(m/s) * Size
    // Returns Energy/frame
    // Lower efficiency (e.g. 0.8) should result in higher burn (1.25x)
    const energyPerSecond = (1.0 / stats.metabolism) * stats.speed * stats.size;
    return energyPerSecond / SIM_CONSTANTS.HOURS_PER_DAY;
  }
};
