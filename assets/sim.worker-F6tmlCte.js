const e=`\r
import { SimulationEngine } from '../core/SimulationEngine';\r
import { WebGLRenderer } from '../rendering/WebGLRenderer';\r
import { SimulationState } from '../../types';\r
\r
let engine: SimulationEngine | null = null;\r
let renderer: WebGLRenderer | null = null;\r
let lastTime = 0;\r
let isPaused = false;\r
let extinctionFrameCount = 0;\r
let cameraParams = {\r
    cameraOffset: [0, 0] as [number, number],\r
    zoom: 1,\r
    selectedId: null as string | null,\r
    hoveredId: null as string | null,\r
    isFollowing: false,\r
    showVision: false,\r
    showGrid: false,\r
    showHearing: false,\r
    showCommunication: false,\r
    dpr: 1,\r
    resolution: [1920, 1080] as [number, number]\r
};\r
\r
self.onmessage = (e: MessageEvent) => {\r
    const { type, data } = e.data;\r
\r
    switch (type) {\r
        case 'INIT':\r
            const { canvas, worldSize, initialState, resolution } = data;\r
            console.log("[Worker] Initializing Engine & Renderer...");\r
            engine = new SimulationEngine(worldSize.x, worldSize.y, initialState);\r
\r
            if (resolution) {\r
                cameraParams.resolution = resolution;\r
                cameraParams.dpr = data.dpr || 1;\r
                canvas.width = resolution[0];\r
                canvas.height = resolution[1];\r
            }\r
\r
            renderer = new WebGLRenderer(canvas);\r
            renderer.updateTerrainTexture(engine.terrain, worldSize);\r
            lastTime = performance.now();\r
            console.log("[Worker] Initialization Complete. Starting Tick.");\r
            requestAnimationFrame(tick);\r
            break;\r
\r
        case 'UPDATE_CAMERA':\r
            cameraParams = { ...cameraParams, ...data };\r
            break;\r
\r
        case 'SET_PAUSED':\r
            isPaused = data;\r
            break;\r
\r
        case 'RESIZE':\r
            cameraParams.resolution = [data.width, data.height];\r
            if (renderer && (renderer as any).gl.canvas) {\r
                (renderer as any).gl.canvas.width = data.width;\r
                (renderer as any).gl.canvas.height = data.height;\r
            }\r
            break;\r
\r
        case 'HIT_TEST':\r
            if (engine) {\r
                const { x, y } = data;\r
                // SimulationCanvas now provides direct world coordinates (logical MX/MY)\r
                const worldX = x;\r
                const worldY = y;\r
\r
                let hitId = null;\r
                for (const org of engine.state.organisms) {\r
                    const dSq = (org.position.x - worldX) ** 2 + (org.position.y - worldY) ** 2;\r
                    const sizePx = (org.expressedStats.size * 0.4 + 25);\r
                    if (dSq < sizePx * sizePx) {\r
                        hitId = org.id;\r
                        break;\r
                    }\r
                }\r
                if (!hitId) {\r
                    for (const flora of engine.state.Flora) {\r
                        const dSq = (flora.position.x - worldX) ** 2 + (flora.position.y - worldY) ** 2;\r
                        if (dSq < 30 * 30) {\r
                            hitId = flora.id;\r
                            break;\r
                        }\r
                    }\r
                }\r
                self.postMessage({ type: 'HIT_RESULT', data: hitId, originalEvent: data.originalEvent });\r
            }\r
            break;\r
\r
        case 'UPDATE_CONFIG':\r
            if (engine) engine.state.config = data;\r
            break;\r
\r
        case 'RESET':\r
            if (engine) engine.hardReset();\r
            break;\r
    }\r
};\r
\r
function tick(time: number) {\r
    if (!engine || !renderer) {\r
        requestAnimationFrame(tick);\r
        return;\r
    }\r
\r
    if (!isPaused) {\r
        engine.update();\r
\r
        // --- Extinction Safety Check ---\r
        if (engine.state.organisms.length === 0) {\r
            extinctionFrameCount++;\r
            if (extinctionFrameCount >= 300) {\r
                console.warn('[Worker] Extinction detected — all organisms dead. Auto-resetting simulation.');\r
                engine.hardReset();\r
                renderer.updateTerrainTexture(engine.terrain, engine.state.worldSize);\r
                extinctionFrameCount = 0;\r
                self.postMessage({\r
                    type: 'STATE_REFRESH',\r
                    data: {\r
                        time: engine.state.time,\r
                        day: engine.state.day,\r
                        hour: engine.state.hour,\r
                        popCount: engine.state.organisms.length,\r
                        floraCount: engine.state.Flora.length,\r
                        events: engine.state.events.slice(0, 5),\r
                        apexCandidates: engine.state.apexCandidates,\r
                        selectedEntity: null,\r
                        hoveredEntity: null,\r
                        lastResetTime: engine.state.lastResetTime\r
                    }\r
                });\r
            }\r
        } else {\r
            extinctionFrameCount = 0;\r
        }\r
\r
        // Handle Internal Camera Follow\r
        if (cameraParams.isFollowing && cameraParams.selectedId) {\r
            const followed = engine.state.organisms.find(o => o.id === cameraParams.selectedId);\r
            if (followed) {\r
                const logicalW = cameraParams.resolution[0] / cameraParams.dpr;\r
                const logicalH = cameraParams.resolution[1] / cameraParams.dpr;\r
                const targetX = (logicalW / 2) - (followed.position.x * cameraParams.zoom);\r
                const targetY = (logicalH / 2) - (followed.position.y * cameraParams.zoom);\r
\r
                cameraParams.cameraOffset[0] += (targetX - cameraParams.cameraOffset[0]) * 0.1;\r
                cameraParams.cameraOffset[1] += (targetY - cameraParams.cameraOffset[1]) * 0.1;\r
\r
                self.postMessage({ type: 'CAMERA_SYNC', data: { offset: cameraParams.cameraOffset } });\r
            }\r
        }\r
\r
        // Throttled UI State Update (every 10 frames)\r
        if (engine.state.time % 10 === 0) {\r
            const selectedEntity = cameraParams.selectedId\r
                ? (engine.state.organisms.find(o => o.id === cameraParams.selectedId) ||\r
                    engine.state.Flora.find(f => f.id === cameraParams.selectedId))\r
                : null;\r
\r
            const hoveredEntity = (!cameraParams.selectedId && cameraParams.hoveredId)\r
                ? (engine.state.organisms.find(o => o.id === cameraParams.hoveredId) ||\r
                    engine.state.Flora.find(f => f.id === cameraParams.hoveredId))\r
                : null;\r
\r
            self.postMessage({\r
                type: 'STATE_REFRESH',\r
                data: {\r
                    time: engine.state.time,\r
                    day: engine.state.day,\r
                    hour: engine.state.hour,\r
                    popCount: engine.state.organisms.length,\r
                    floraCount: engine.state.Flora.length,\r
                    events: engine.state.events.slice(0, 5),\r
                    apexCandidates: engine.state.apexCandidates,\r
                    selectedEntity: selectedEntity,\r
                    hoveredEntity: hoveredEntity,\r
                    lastResetTime: engine.state.lastResetTime\r
                }\r
            });\r
        }\r
\r
        // Auto-save signal (every 10 minutes approx @ 60fps = 36000 frames, but engine does 600)\r
        if (engine.state.time % 600 === 0) {\r
            self.postMessage({\r
                type: 'SAVE_REQUIRED',\r
                data: engine.state\r
            });\r
        }\r
    }\r
\r
    // Render every frame even if paused (to support camera movement)\r
    renderer.render({\r
        resolution: cameraParams.resolution,\r
        logicalResolution: [cameraParams.resolution[0] / cameraParams.dpr, cameraParams.resolution[1] / cameraParams.dpr],\r
        worldSize: [engine.state.worldSize.x, engine.state.worldSize.y],\r
        cameraOffset: cameraParams.cameraOffset,\r
        zoom: cameraParams.zoom,\r
        time: engine.state.time,\r
        organisms: engine.state.organisms,\r
        Flora: engine.state.Flora,\r
        selectedId: cameraParams.selectedId,\r
        hoveredId: cameraParams.hoveredId,\r
        isFollowing: cameraParams.isFollowing,\r
        dpr: cameraParams.dpr,\r
        showVision: cameraParams.showVision,\r
        showGrid: cameraParams.showGrid,\r
        showHearing: cameraParams.showHearing,\r
        showCommunication: cameraParams.showCommunication\r
    });\r
\r
    requestAnimationFrame(tick);\r
}\r
`;export{e as default};
