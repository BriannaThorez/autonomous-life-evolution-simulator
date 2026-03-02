const e=`\r
import { EntityStats } from '../../../types';\r
import { SIM_CONSTANTS } from '../../core/Constants';\r
\r
export const Metabolism = {\r
  calculateEnergyLoss: (stats: EntityStats): number => {\r
    // Standardized Formula: Energy/sec = (1.0 / Metabolism) * Speed(m/s) * Size\r
    // Returns Energy/frame\r
    // Lower efficiency (e.g. 0.8) should result in higher burn (1.25x)\r
    const energyPerSecond = (1.0 / stats.metabolism) * stats.speed * stats.size;\r
    return energyPerSecond / SIM_CONSTANTS.HOURS_PER_DAY;\r
  }\r
};\r
`;export{e as default};
