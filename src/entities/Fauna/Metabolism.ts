
import { EntityStats } from '../../../types';
import { SIM_CONSTANTS } from '../../core/Constants';

export const Metabolism = {
  calculateEnergyLoss: (stats: EntityStats): number => {
    // Standardized Formula: Energy/sec = Metabolism * Speed(m/s) * Size
    // Returns Energy/frame
    const energyPerSecond = stats.metabolism * stats.speed * stats.size;
    return energyPerSecond / SIM_CONSTANTS.FPS;
  }
};
