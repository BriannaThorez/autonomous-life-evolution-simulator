const t=`\r
import { EntityStats } from '../../../types';\r
import { SIM_CONSTANTS } from '../../core/Constants';\r
\r
export const Metabolism = {\r
  calculateEnergyLoss: (stats: EntityStats, currentSpeedMps = 0): number => {\r
    // Speed is a maximum trait. Actual expenditure scales with current movement, while a smaller\r
    // basal cost keeps resting organisms alive long enough to pursue richer behavior.\r
    const maxSpeed = Math.max(0.01, stats.speed);\r
    const clampedSpeed = Math.max(0, Math.min(currentSpeedMps, maxSpeed));\r
    const activityRatio = clampedSpeed / maxSpeed;\r
    const basalRatio = 0.18;\r
    const hourlyDemand = (1.0 / Math.max(0.1, stats.metabolism)) * maxSpeed * stats.size;\r
    return (hourlyDemand * (basalRatio + (activityRatio * (1 - basalRatio)))) / SIM_CONSTANTS.FRAMES_PER_HOUR;\r
  }\r
};\r
`;export{t as default};
