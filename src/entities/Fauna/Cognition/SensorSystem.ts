
import { OrganismData, FloraData, Vector2, EntityStats } from '../../../../types';
import { VectorMath } from '../../../core/VectorMath';
import { UNIT_UTILS } from '../../../core/Constants';

export interface SensoryInput {
    visibleFlora: FloraData[];
    visibleFauna: OrganismData[];
    audibleFauna: OrganismData[];
    communicatingFauna: OrganismData[];
}

export class SensorSystem {

    public static scan(
        me: OrganismData,
        neighbors: { organisms: OrganismData[], flora: FloraData[] }
    ): SensoryInput {

        const stats = me.expressedStats;
        const pos = me.position;
        const forward = me.heading;

        // Define a "Touch" distance for proximity interaction (regardless of FOV)
        const touchDistPx = UNIT_UTILS.cmToPx(stats.size) * 0.8;

        // 1. Vision (Cone)
        const visibleFlora: FloraData[] = [];
        const visibleFauna: OrganismData[] = [];

        const sightRangeM = stats.sight_range;
        const halfFOV = stats.sight_fov / 2;

        // Flora Scan
        for (const flora of neighbors.flora) {
            const distPx = VectorMath.dist(pos, flora.position);
            const distM = UNIT_UTILS.pxToM(distPx);

            // Check if touching (Proximity Bypass) OR within Vision Cone
            if (distPx <= touchDistPx) {
                visibleFlora.push(flora);
            }
            else if (distM <= sightRangeM) {
                const toTarget = VectorMath.normalize(VectorMath.sub(flora.position, pos));
                const angle = Math.acos(VectorMath.dot(forward, toTarget));

                if (angle <= halfFOV) {
                    visibleFlora.push(flora);
                }
            }
        }

        // Fauna Scan (Vision, Hearing, Communication)
        const audibleFauna: OrganismData[] = [];
        const communicatingFauna: OrganismData[] = [];

        const audibleRangeM = stats.audible_range;
        const commRangeM = stats.communicating_range;

        for (const other of neighbors.organisms) {
            if (other.id === me.id) continue;

            const distPx = VectorMath.dist(pos, other.position);
            const distM = UNIT_UTILS.pxToM(distPx);

            // Vision Check (Proximity Bypass OR Cone)
            if (distPx <= touchDistPx) {
                visibleFauna.push(other);
            }
            else if (distM <= sightRangeM) {
                const toTarget = VectorMath.normalize(VectorMath.sub(other.position, pos));
                const angle = Math.acos(VectorMath.dot(forward, toTarget));
                if (angle <= halfFOV) {
                    visibleFauna.push(other);
                }
            }

            // Hearing Check (360 degrees)
            if (distM <= audibleRangeM) {
                audibleFauna.push(other);
            }

            // Communication Range (360 degrees)
            if (distM <= commRangeM) {
                communicatingFauna.push(other);
            }
        }

        return {
            visibleFlora,
            visibleFauna,
            audibleFauna,
            communicatingFauna
        };
    }
}
