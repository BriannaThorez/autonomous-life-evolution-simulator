const r=`\r
import { OrganismData, FloraData, Vector2, EntityStats } from '../../../../types';\r
import { VectorMath } from '../../../core/VectorMath';\r
import { UNIT_UTILS } from '../../../core/Constants';\r
\r
export interface SensoryInput {\r
    visibleFlora: FloraData[];\r
    visibleFauna: OrganismData[];\r
    audibleFauna: OrganismData[];\r
    communicatingFauna: OrganismData[];\r
}\r
\r
export class SensorSystem {\r
\r
    public static scan(\r
        me: OrganismData,\r
        neighbors: { organisms: OrganismData[], flora: FloraData[] }\r
    ): SensoryInput {\r
\r
        const stats = me.expressedStats;\r
        const pos = me.position;\r
        const forward = me.heading;\r
\r
        // Define a "Touch" distance for proximity interaction (regardless of FOV)\r
        const touchDistPx = UNIT_UTILS.cmToPx(stats.size) * 0.8;\r
\r
        // 1. Vision (Cone)\r
        const visibleFlora: FloraData[] = [];\r
        const visibleFauna: OrganismData[] = [];\r
\r
        const sightRangeM = stats.sight_range;\r
        const halfFOV = stats.sight_fov / 2;\r
\r
        // Flora Scan\r
        for (const flora of neighbors.flora) {\r
            const distPx = VectorMath.dist(pos, flora.position);\r
            const distM = UNIT_UTILS.pxToM(distPx);\r
\r
            // Check if touching (Proximity Bypass) OR within Vision Cone\r
            if (distPx <= touchDistPx) {\r
                visibleFlora.push(flora);\r
            }\r
            else if (distM <= sightRangeM) {\r
                const toTarget = VectorMath.normalize(VectorMath.sub(flora.position, pos));\r
                const angle = Math.acos(VectorMath.dot(forward, toTarget));\r
\r
                if (angle <= halfFOV) {\r
                    visibleFlora.push(flora);\r
                }\r
            }\r
        }\r
\r
        // Fauna Scan (Vision, Hearing, Communication)\r
        const audibleFauna: OrganismData[] = [];\r
        const communicatingFauna: OrganismData[] = [];\r
\r
        const audibleRangeM = stats.audible_range;\r
        const commRangeM = stats.communicating_range;\r
\r
        for (const other of neighbors.organisms) {\r
            if (other.id === me.id) continue;\r
\r
            const distPx = VectorMath.dist(pos, other.position);\r
            const distM = UNIT_UTILS.pxToM(distPx);\r
\r
            // Vision Check (Proximity Bypass OR Cone)\r
            if (distPx <= touchDistPx) {\r
                visibleFauna.push(other);\r
            }\r
            else if (distM <= sightRangeM) {\r
                const toTarget = VectorMath.normalize(VectorMath.sub(other.position, pos));\r
                const angle = Math.acos(VectorMath.dot(forward, toTarget));\r
                if (angle <= halfFOV) {\r
                    visibleFauna.push(other);\r
                }\r
            }\r
\r
            // Hearing Check (360 degrees)\r
            if (distM <= audibleRangeM) {\r
                audibleFauna.push(other);\r
            }\r
\r
            // Communication Range (360 degrees)\r
            if (distM <= commRangeM) {\r
                communicatingFauna.push(other);\r
            }\r
        }\r
\r
        return {\r
            visibleFlora,\r
            visibleFauna,\r
            audibleFauna,\r
            communicatingFauna\r
        };\r
    }\r
}\r
`;export{r as default};
