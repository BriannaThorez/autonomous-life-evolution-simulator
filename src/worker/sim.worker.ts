
import { SimulationEngine } from '../core/SimulationEngine';
import { WebGLRenderer } from '../rendering/WebGLRenderer';
import { SimulationState } from '../../types';

let engine: SimulationEngine | null = null;
let renderer: WebGLRenderer | null = null;
let lastTime = 0;
let isPaused = false;
let cameraParams = {
    cameraOffset: [0, 0] as [number, number],
    zoom: 1,
    selectedId: null as string | null,
    hoveredId: null as string | null,
    isFollowing: false,
    showVision: false,
    showGrid: false,
    showHearing: false,
    showCommunication: false,
    dpr: 1,
    resolution: [1920, 1080] as [number, number]
};

self.onmessage = (e: MessageEvent) => {
    const { type, data } = e.data;

    switch (type) {
        case 'INIT':
            const { canvas, worldSize, initialState, resolution } = data;
            console.log("[Worker] Initializing Engine & Renderer...");
            engine = new SimulationEngine(worldSize.x, worldSize.y, initialState);

            if (resolution) {
                cameraParams.resolution = resolution;
                cameraParams.dpr = data.dpr || 1;
                canvas.width = resolution[0];
                canvas.height = resolution[1];
            }

            renderer = new WebGLRenderer(canvas);
            renderer.updateTerrainTexture(engine.terrain, worldSize);
            lastTime = performance.now();
            console.log("[Worker] Initialization Complete. Starting Tick.");
            requestAnimationFrame(tick);
            break;

        case 'UPDATE_CAMERA':
            cameraParams = { ...cameraParams, ...data };
            break;

        case 'SET_PAUSED':
            isPaused = data;
            break;

        case 'RESIZE':
            cameraParams.resolution = [data.width, data.height];
            if (renderer && (renderer as any).gl.canvas) {
                (renderer as any).gl.canvas.width = data.width;
                (renderer as any).gl.canvas.height = data.height;
            }
            break;

        case 'HIT_TEST':
            if (engine) {
                const { x, y } = data;
                // SimulationCanvas now provides direct world coordinates (logical MX/MY)
                const worldX = x;
                const worldY = y;

                let hitId = null;
                for (const org of engine.state.organisms) {
                    const dSq = (org.position.x - worldX) ** 2 + (org.position.y - worldY) ** 2;
                    const sizePx = (org.expressedStats.size * 0.4 + 25);
                    if (dSq < sizePx * sizePx) {
                        hitId = org.id;
                        break;
                    }
                }
                if (!hitId) {
                    for (const flora of engine.state.Flora) {
                        const dSq = (flora.position.x - worldX) ** 2 + (flora.position.y - worldY) ** 2;
                        if (dSq < 30 * 30) {
                            hitId = flora.id;
                            break;
                        }
                    }
                }
                self.postMessage({ type: 'HIT_RESULT', data: hitId, originalEvent: data.originalEvent });
            }
            break;

        case 'UPDATE_CONFIG':
            if (engine) engine.state.config = data;
            break;

        case 'RESET':
            if (engine) engine.hardReset();
            break;
    }
};

function tick(time: number) {
    if (!engine || !renderer) {
        requestAnimationFrame(tick);
        return;
    }

    if (!isPaused) {
        engine.update();

        // Handle Internal Camera Follow
        if (cameraParams.isFollowing && cameraParams.selectedId) {
            const followed = engine.state.organisms.find(o => o.id === cameraParams.selectedId);
            if (followed) {
                const logicalW = cameraParams.resolution[0] / cameraParams.dpr;
                const logicalH = cameraParams.resolution[1] / cameraParams.dpr;
                const targetX = (logicalW / 2) - (followed.position.x * cameraParams.zoom);
                const targetY = (logicalH / 2) - (followed.position.y * cameraParams.zoom);

                cameraParams.cameraOffset[0] += (targetX - cameraParams.cameraOffset[0]) * 0.1;
                cameraParams.cameraOffset[1] += (targetY - cameraParams.cameraOffset[1]) * 0.1;

                self.postMessage({ type: 'CAMERA_SYNC', data: { offset: cameraParams.cameraOffset } });
            }
        }

        // Throttled UI State Update (every 10 frames)
        if (engine.state.time % 10 === 0) {
            const selectedEntity = cameraParams.selectedId
                ? (engine.state.organisms.find(o => o.id === cameraParams.selectedId) ||
                    engine.state.Flora.find(f => f.id === cameraParams.selectedId))
                : null;

            const hoveredEntity = (!cameraParams.selectedId && cameraParams.hoveredId)
                ? (engine.state.organisms.find(o => o.id === cameraParams.hoveredId) ||
                    engine.state.Flora.find(f => f.id === cameraParams.hoveredId))
                : null;

            self.postMessage({
                type: 'STATE_REFRESH',
                data: {
                    time: engine.state.time,
                    day: engine.state.day,
                    hour: engine.state.hour,
                    popCount: engine.state.organisms.length,
                    floraCount: engine.state.Flora.length,
                    events: engine.state.events.slice(0, 5),
                    apexCandidates: engine.state.apexCandidates,
                    selectedEntity: selectedEntity,
                    hoveredEntity: hoveredEntity
                }
            });
        }

        // Auto-save signal (every 10 minutes approx @ 60fps = 36000 frames, but engine does 600)
        if (engine.state.time % 600 === 0) {
            self.postMessage({
                type: 'SAVE_REQUIRED',
                data: engine.state
            });
        }
    }

    // Render every frame even if paused (to support camera movement)
    renderer.render({
        resolution: cameraParams.resolution,
        logicalResolution: [cameraParams.resolution[0] / cameraParams.dpr, cameraParams.resolution[1] / cameraParams.dpr],
        worldSize: [engine.state.worldSize.x, engine.state.worldSize.y],
        cameraOffset: cameraParams.cameraOffset,
        zoom: cameraParams.zoom,
        time: engine.state.time,
        organisms: engine.state.organisms,
        Flora: engine.state.Flora,
        selectedId: cameraParams.selectedId,
        hoveredId: cameraParams.hoveredId,
        isFollowing: cameraParams.isFollowing,
        dpr: cameraParams.dpr,
        showVision: cameraParams.showVision,
        showGrid: cameraParams.showGrid,
        showHearing: cameraParams.showHearing,
        showCommunication: cameraParams.showCommunication
    });

    requestAnimationFrame(tick);
}
