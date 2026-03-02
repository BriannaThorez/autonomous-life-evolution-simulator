const r=`\r
import { AppearanceMapper } from './AppearanceMapper';\r
import { SIM_CONSTANTS, UNIT_UTILS } from '../core/Constants';\r
\r
export class WebGLRenderer {\r
    private gl: WebGL2RenderingContext;\r
    private program: WebGLProgram;\r
    private floraProgram: WebGLProgram;\r
    private quadBuffer: WebGLBuffer;\r
    private floraUnitQuadBuffer: WebGLBuffer;\r
    private instanceIDBuffer: WebGLBuffer;\r
    private orgTexture: WebGLTexture;\r
    private floraTexture: WebGLTexture;\r
    private faunaProgram: WebGLProgram;\r
    private faunaUnitQuadBuffer: WebGLBuffer;\r
    private terrainTexture: WebGLTexture;\r
    private terrainInitialized = false;\r
\r
    // --- Performance: reusable arrays & caches ---\r
    private static readonly MAX_INSTANCES = 2048;\r
    private orgDataBuffer = new Float32Array(WebGLRenderer.MAX_INSTANCES * 4 * 5);\r
    private floraDataBuffer = new Float32Array(WebGLRenderer.MAX_INSTANCES * 4 * 2);\r
    private colorCache = new Map<string, [number, number, number]>();\r
    private prevVelocities = new Map<string, { x: number; y: number }>();\r
\r
    // These would ideally be imported from .glsl?raw but for stability we embed here\r
    private static VERT_SHADER = \`#version 300 es\r
        in vec2 a_position;\r
        out vec2 v_texCoord;\r
        void main() {\r
            v_texCoord = a_position * 0.5 + 0.5;\r
            gl_Position = vec4(a_position, 0.0, 1.0);\r
        }\r
    \`;\r
\r
    private static FRAG_SHADER = \`#version 300 es\r
        precision highp float;\r
        \r
        in vec2 v_texCoord;\r
        out vec4 outColor;\r
\r
        uniform vec2 u_resolution;\r
        uniform vec2 u_logicalResolution;\r
        uniform vec2 u_worldSize;\r
        uniform vec2 u_cameraOffset;\r
        uniform float u_zoom;\r
        uniform float u_time;\r
        uniform float u_dpr;\r
        \r
        uniform vec2 u_selectedPos;\r
        uniform float u_selectedSize;\r
        uniform float u_selectedId;\r
        uniform vec2 u_hoveredPos;\r
        uniform float u_hoveredSize;\r
        uniform float u_hoveredId;\r
        uniform float u_isFollowing;\r
        uniform float u_showVision;\r
        uniform float u_showHearing;\r
        uniform float u_showCommunication;\r
        uniform float u_showGrid;\r
        \r
        uniform sampler2D u_orgTexture;\r
        uniform int u_orgCount;\r
        \r
        uniform sampler2D u_terrainTexture;\r
\r
        float sdCircle(vec2 p, float r) { return length(p) - r; }\r
        float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {\r
            vec2 pa = p - a, ba = b - a;\r
            float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);\r
            return length(pa - ba * h) - r;\r
        }\r
        float smin(float a, float b, float k) {\r
            float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);\r
            return mix(b, a, h) - k * h * (1.0 - h);\r
        }\r
        vec2 rotate(vec2 v, vec2 dir) {\r
            dir = normalize(dir);\r
            return vec2(v.x * dir.x - v.y * dir.y, v.x * dir.y + v.y * dir.x);\r
        }\r
        float sdHexagon(vec2 p, float r) {\r
            const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);\r
            p = abs(p);\r
            p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;\r
            p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);\r
            return length(p) * sign(p.y);\r
        }\r
\r
        void main() {\r
            vec2 fragCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y) * u_logicalResolution;\r
            vec2 worldCoord = (fragCoord - u_cameraOffset) / u_zoom;\r
            \r
            vec2 terrainUV = vec2(worldCoord.x / u_worldSize.x, 1.0 - worldCoord.y / u_worldSize.y);\r
            vec4 terrainData = texture(u_terrainTexture, terrainUV);\r
            \r
            vec3 background = terrainData.g > 0.8 ? vec3(0.1) : mix(vec3(0.25, 0.2, 0.1), vec3(0.12, 0.25, 0.15), terrainData.r);\r
            if (worldCoord.x < 0.0 || worldCoord.x > u_worldSize.x || worldCoord.y < 0.0 || worldCoord.y > u_worldSize.y) background = vec3(0.002, 0.004, 0.003);\r
\r
            vec4 resColor = vec4(background, 1.0); \r
            if (u_showGrid > 0.5) {\r
                vec2 gridUV = fract(worldCoord / 20.0);\r
                resColor.rgb += vec3(0.1, 0.2, 0.15) * (smoothstep(0.02, 0.0, abs(gridUV.x - 0.5)) + smoothstep(0.02, 0.0, abs(gridUV.y - 0.5))) * 0.2;\r
            }\r
\r
            // --- JELLY BODY SDF (Global smin REMOVED for Performance) ---\r
            // The O(Pixels * Count) loop was causing massive lag at high populations.\r
            // Body rendering is now handled entirely in the instanced FAUNA_FRAG_SHADER (Pass 2).\r
            \r
            outColor = vec4(resColor.rgb, 1.0);\r
        }\r
    \`;\r
\r
    private static FAUNA_VERT_SHADER = \`#version 300 es\r
        // === GPGPU FAUNA VERTEX SHADER ===\r
        // Reactive trailing jelly stretch + side-to-side jiggle\r
        in vec2 a_unitPosition;\r
        in int a_instanceID;\r
\r
        out vec2 v_localCoord;\r
        out float v_id;\r
        flat out int v_instanceID;\r
        out vec2 v_worldCenter;\r
\r
        uniform sampler2D u_orgTexture;\r
        uniform vec2 u_cameraOffset;\r
        uniform float u_zoom;\r
        uniform vec2 u_logicalResolution;\r
        uniform float u_time;\r
\r
        void main() {\r
            float maxInst = \${WebGLRenderer.MAX_INSTANCES}.0;\r
            float tx = (float(a_instanceID) + 0.5) / maxInst;\r
            vec4 d1 = texture(u_orgTexture, vec2(tx, 0.1)); \r
            vec2 pos = d1.xy;\r
            float size = d1.z;\r
            float skeletalLength = d1.w;\r
\r
            vec4 d3 = texture(u_orgTexture, vec2(tx, 0.5));\r
            vec2 vel = d3.xy;\r
\r
            vec4 d4 = texture(u_orgTexture, vec2(tx, 0.7));\r
            float sightRange = d4.z;\r
            float audibleRange = d4.w;\r
            vec4 d5 = texture(u_orgTexture, vec2(tx, 0.9));\r
            float commRange = d5.x;\r
\r
            float maxSense = max(sightRange, max(audibleRange, commRange));\r
            float bodyBound = size + skeletalLength + 15.0;\r
            float quadSize = max(bodyBound, maxSense) + 20.0;\r
\r
            // --- REACTIVE TRAILING STRETCH ---\r
            float spd = length(vel);\r
            vec2 moveDir = spd > 0.001 ? normalize(vel) : vec2(1.0, 0.0);\r
            \r
            // Push trailing vertices BACK (away from moveDir)\r
            float stretchAmount = min(spd * 1.2, 4.5); \r
            vec2 stretchedPos = a_unitPosition * quadSize;\r
            float projLen = dot(a_unitPosition, moveDir);\r
            \r
            // Only affect trailing half (projLen < 0)\r
            stretchedPos -= moveDir * stretchAmount * max(-projLen, 0.0) * 1.5;\r
\r
            // --- SIDE-TO-SIDE JIGGLE ---\r
            // Oscillation frequency and amplitude scale with speed\r
            float jiggleFreq = 6.0 + spd * 10.0; \r
            float jiggleAmp = 0.2 + spd * 0.6;\r
            float wobble = sin(u_time * jiggleFreq + float(a_instanceID) * 1.618) * jiggleAmp;\r
            vec2 perpDir = vec2(-moveDir.y, moveDir.x);\r
            stretchedPos += perpDir * wobble;\r
\r
            v_localCoord = stretchedPos;\r
            v_id = texture(u_orgTexture, vec2(tx, 0.3)).w;\r
            v_instanceID = a_instanceID;\r
            v_worldCenter = pos;\r
\r
            vec2 worldPos = pos + v_localCoord;\r
            vec2 screenPos = worldPos * u_zoom + u_cameraOffset;\r
            vec2 clipPos = (screenPos / u_logicalResolution) * 2.0 - 1.0;\r
            gl_Position = vec4(clipPos.x, -clipPos.y, 0.0, 1.0);\r
        }\r
    \`;\r
\r
    private static FAUNA_FRAG_SHADER = \`#version 300 es\r
        // === GPGPU FAUNA FRAGMENT SHADER ===\r
        // Inertial warp + smooth mating fusion + GPU visuals\r
        precision highp float;\r
        in vec2 v_localCoord;\r
        in float v_id;\r
        flat in int v_instanceID;\r
        in vec2 v_worldCenter;\r
        \r
        out vec4 outColor;\r
\r
        uniform sampler2D u_orgTexture;\r
        uniform float u_time;\r
        uniform float u_zoom;\r
        uniform float u_selectedId;\r
        uniform float u_hoveredId;\r
        uniform float u_showVision;\r
        uniform float u_showHearing;\r
        uniform float u_showCommunication;\r
        uniform sampler2D u_terrainTexture;\r
\r
        float sdCircle(vec2 p, float r) { return length(p) - r; }\r
        float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {\r
            vec2 pa = p - a, ba = b - a;\r
            float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);\r
            return length(pa - ba * h) - r;\r
        }\r
        float smin(float a, float b, float k) {\r
            float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);\r
            return mix(b, a, h) - k * h * (1.0 - h);\r
        }\r
        vec2 rotate(vec2 v, vec2 dir) {\r
            dir = normalize(dir);\r
            return vec2(v.x * dir.x - v.y * dir.y, v.x * dir.y + v.y * dir.x);\r
        }\r
\r
        void main() {\r
            float maxInst = \${WebGLRenderer.MAX_INSTANCES}.0;\r
            float tx = (float(v_instanceID) + 0.5) / maxInst;\r
            vec4 d1 = texture(u_orgTexture, vec2(tx, 0.1));\r
            vec2 pos = d1.xy;\r
            float size = d1.z;\r
            float skeletalLength = d1.w;\r
            \r
            vec4 d2 = texture(u_orgTexture, vec2(tx, 0.3));\r
            vec3 col = d2.rgb;\r
            float id = d2.w;\r
            \r
            vec4 d3 = texture(u_orgTexture, vec2(tx, 0.5));\r
            vec2 vel = d3.xy;\r
            float fov = d3.z;\r
            float isSelected = d3.w;\r
\r
            vec4 d4 = texture(u_orgTexture, vec2(tx, 0.7));\r
            float bending = d4.x;\r
            float mateIndex = d4.y;\r
            float sightRange = d4.z;\r
            float rawAudible = d4.w;\r
            float isHearingActive = step(10000.0, rawAudible);\r
            float audibleRange = mod(rawAudible, 10000.0);\r
\r
            vec4 d5 = texture(u_orgTexture, vec2(tx, 0.9));\r
            float rawComm = d5.x;\r
            float isTransmittingActive = step(10000.0, rawComm);\r
            float commRange = mod(rawComm, 10000.0);\r
            // Unpack: d5.y = [isNoble (integer)] + [matingFactor (fractional)]\r
            float isNoble = floor(d5.y);\r
            float matingFactor = fract(d5.y);\r
            float energyNorm = d5.z;\r
            float turnForce = d5.w;\r
\r
            float glowIntensity = mix(0.65, 1.8, clamp(energyNorm * 1.5, 0.0, 1.0));\r
            vec2 dir = length(vel) > 0.001 ? normalize(vel) : vec2(1.0, 0.0);\r
            \r
            vec3 finalCol = vec3(0.0);\r
            float finalAlpha = 0.0;\r
            float dist = length(v_localCoord);\r
\r
            // --- SENSORY OVERLAYS ---\r
            if (u_showVision > 0.5 && dist < sightRange) {\r
                vec2 rel = normalize(v_localCoord);\r
                float angle = acos(clamp(dot(rel, dir), -1.0, 1.0));\r
                if (angle < fov * 0.5) {\r
                    float intensity = 0.25 * (1.0 - dist / sightRange);\r
                    finalCol += col * intensity;\r
                    finalAlpha = max(finalAlpha, intensity);\r
                }\r
            }\r
            if (max(u_showHearing, isHearingActive) > 0.5 && dist < audibleRange + 4.0) {\r
                float pulse = 0.7 + 0.3 * sin(u_time * 1.5 + v_id * 0.3);\r
                float dRingH = abs(dist - audibleRange) - 1.5;\r
                if (dRingH < 3.0) {\r
                    float angleH = atan(v_localCoord.y, v_localCoord.x);\r
                    float dashH = step(0.3, fract(angleH * 6.0 / 6.28318 + u_time * 0.3));\r
                    float ringAlpha = exp(-abs(dRingH) * 1.2) * 0.4 * pulse * dashH;\r
                    finalCol += vec3(0.2, 0.65, 0.85) * ringAlpha;\r
                    finalAlpha = max(finalAlpha, ringAlpha);\r
                }\r
            }\r
            if (max(u_showCommunication, isTransmittingActive) > 0.5 && dist < commRange) {\r
                float ping1 = fract(u_time * 0.4 + v_id * 0.1);\r
                float ping2 = fract(u_time * 0.4 + v_id * 0.1 + 0.5);\r
                float dPing1 = abs(dist - ping1 * commRange);\r
                float dPing2 = abs(dist - ping2 * commRange);\r
                float fade1 = (1.0 - ping1) * 0.6;\r
                float fade2 = (1.0 - ping2) * 0.6;\r
                float ripple = 0.0;\r
                if (dPing1 < 2.5) ripple += exp(-dPing1 * 0.8) * fade1;\r
                if (dPing2 < 2.5) ripple += exp(-dPing2 * 0.8) * fade2;\r
                finalCol += vec3(1.0, 0.7, 0.15) * ripple;\r
                finalAlpha = max(finalAlpha, ripple);\r
            }\r
\r
            // --- REFINED BODY RENDERING ---\r
            float softness = mix(0.1, 4.0, clamp(1.0 - u_zoom * 1.5, 0.0, 1.0));\r
            vec2 perp = vec2(-dir.y, dir.x);\r
            float spd = length(vel);\r
            \r
            // Inertial warp: subtle but visible curve when turning\r
            float warp = clamp(turnForce * 3.0, -10.0, 10.0); \r
            float totalWarp = bending + warp;\r
            float distAlong = dot(v_localCoord, dir);\r
            vec2 warpedP = v_localCoord - (perp * totalWarp * 0.18 * distAlong);\r
            \r
            // NO DOUBLE STRETCH: Central body stays fixed, vertex shader handles tail drag\r
            vec2 pA = dir * (skeletalLength * 0.5);\r
            vec2 pB = -dir * (skeletalLength * 0.5);\r
            float r = size * (0.95 + 0.05 * sin(u_time * 0.1 + v_id));\r
            \r
            float dBody = sdCapsule(warpedP, pA, pB, r);\r
\r
            // --- MEATBALL FUSION ---\r
            if (mateIndex > -0.5 && matingFactor > 0.01) {\r
                float mTx = (mateIndex + 0.5) / maxInst;\r
                vec4 mD1 = texture(u_orgTexture, vec2(mTx, 0.1));\r
                vec2 mPos = mD1.xy;\r
                // Blend with partner's circle (approximation)\r
                vec2 mLocal = (mPos - v_worldCenter); \r
                float dMate = sdCircle(v_localCoord - mLocal, mD1.z);\r
                // Continuous blend: starts tight, melts fully, then separates\r
                float k = mix(2.0, 18.0, 1.0 - abs(matingFactor * 2.0 - 1.0));\r
                dBody = smin(dBody, dMate, k);\r
            }\r
            \r
            float bodyAlpha = smoothstep(softness, -softness, dBody);\r
            \r
            // Outline Glow\r
            if (dBody > 0.0 && dBody < 25.0) {\r
                float outlineGlow = exp(-dBody * 0.12) * glowIntensity * 0.8;\r
                finalCol += col * outlineGlow;\r
                finalAlpha = max(finalAlpha, outlineGlow * 0.7);\r
            }\r
\r
            float glowFalloff = exp(-max(0.0, dBody) * 0.1);\r
            float coreGradient = pow(clamp(1.0 - abs(dBody) / r, 0.0, 1.0), 3.0);\r
            vec3 bodyCol = col * (0.6 + 0.8 * coreGradient + 0.5 * glowFalloff * glowIntensity);\r
\r
            // GPU Pulsing: High energy or Noble status\r
            float pulse = 0.5 + 0.5 * sin(u_time * 4.0 + v_id);\r
            if (isNoble > 0.5) {\r
                bodyCol *= (1.0 + 0.6 * pulse);\r
            } else if (energyNorm > 0.85) {\r
                bodyCol *= (1.0 + 0.2 * pulse);\r
            }\r
\r
            // Health Desaturation\r
            float luma = dot(bodyCol, vec3(0.299, 0.587, 0.114));\r
            bodyCol = mix(vec3(luma), bodyCol, 0.5 + 0.5 * energyNorm);\r
\r
            vec3 finalBody = bodyCol * bodyAlpha;\r
            finalCol = mix(finalCol, finalBody, bodyAlpha);\r
            finalAlpha = max(finalAlpha, bodyAlpha);\r
\r
            // Eyes & Selection (Static local relative to head/size)\r
            if (u_zoom > 0.5 && bodyAlpha > 0.01) {\r
                vec2 eyeP1 = rotate(vec2(size * 0.75, size * 0.45), dir);\r
                vec2 eyeP2 = rotate(vec2(size * 0.75, -size * 0.45), dir);\r
                float eyeSize = size * 0.35;\r
                float dE = min(sdCircle(v_localCoord - eyeP1, eyeSize), sdCircle(v_localCoord - eyeP2, eyeSize));\r
                if (dE < 2.0) {\r
                    float alphaE = smoothstep(1.5, -1.5, dE);\r
                    float dPupil = min(sdCircle(v_localCoord - (eyeP1 + dir * eyeSize * 0.25), eyeSize * 0.42),\r
                                       sdCircle(v_localCoord - (eyeP2 + dir * eyeSize * 0.25), eyeSize * 0.42));\r
                    vec3 eCol = dPupil < 0.0 ? vec3(0.01) : vec3(1.0);\r
                    finalCol = mix(finalCol, eCol, alphaE);\r
                    finalAlpha = max(finalAlpha, alphaE);\r
                }\r
            }\r
\r
            float idDiff = abs(id - u_selectedId);\r
            if (idDiff < 0.1 || abs(id - u_hoveredId) < 0.1) {\r
                float ringSize = size + 14.0 + sin(u_time * 3.0) * 3.0;\r
                float dRing = abs(length(v_localCoord) - ringSize) - 2.0;\r
                if (dRing < 4.0) {\r
                    float opacity = (idDiff < 0.1 ? 1.0 : 0.6) * smoothstep(2.0, -1.0, dRing);\r
                    vec3 ringCol = idDiff < 0.1 ? vec3(0.1, 0.7, 1.0) : vec3(0.5, 1.0, 0.8);\r
                    finalCol = mix(finalCol, ringCol, opacity * 0.5);\r
                    finalAlpha = max(finalAlpha, opacity * 0.5);\r
                }\r
            }\r
\r
            if (finalAlpha < 0.001) discard;\r
            outColor = vec4(finalCol, finalAlpha);\r
        }\r
    \`;\r
\r
    // --- INSTANCED FLORA SHADERS ---\r
    private static FLORA_VERT_SHADER = \`#version 300 es\r
        in vec2 a_unitPosition;\r
        in int a_instanceID;\r
\r
        out vec2 v_localCoord;\r
        out float v_growth;\r
        out float v_complexity;\r
        out vec4 v_color;\r
        out vec2 v_worldCenter;\r
        flat out int v_id;\r
\r
        uniform sampler2D u_floraTexture;\r
        uniform vec2 u_cameraOffset;\r
        uniform float u_zoom;\r
        uniform vec2 u_logicalResolution;\r
\r
        void main() {\r
            float maxInst = \${WebGLRenderer.MAX_INSTANCES}.0;\r
            float tx = (float(a_instanceID) + 0.5) / maxInst;\r
            vec4 d1 = texture(u_floraTexture, vec2(tx, 0.25)); // x, y, growth, complexity\r
            vec2 fPos = d1.xy;\r
            float growth = d1.z;\r
            float complexity = d1.w;\r
            \r
            vec4 d2 = texture(u_floraTexture, vec2(tx, 0.75)); // Color\r
            \r
            float maxRad = max(10.0, (complexity * 4.0 + 10.0));\r
            // Add slight margin for swaying/blooming\r
            float quadSize = maxRad * 2.0 + 10.0; \r
\r
            v_localCoord = a_unitPosition * quadSize;\r
            v_growth = growth;\r
            v_complexity = complexity;\r
            v_color = vec4(d2.rgb, 1.0);\r
            v_worldCenter = fPos;\r
            v_id = a_instanceID;\r
\r
            vec2 worldPos = fPos + v_localCoord;\r
            vec2 screenPos = worldPos * u_zoom + u_cameraOffset;\r
            vec2 clipPos = (screenPos / u_logicalResolution) * 2.0 - 1.0;\r
            \r
            gl_Position = vec4(clipPos.x, -clipPos.y, 0.0, 1.0);\r
        }\r
    \`;\r
\r
    private static FLORA_FRAG_SHADER = \`#version 300 es\r
        precision highp float;\r
        in vec2 v_localCoord;\r
        in float v_growth;\r
        in float v_complexity;\r
        in vec4 v_color;\r
        in vec2 v_worldCenter;\r
        flat in int v_id;\r
\r
        out vec4 outColor;\r
        \r
        uniform float u_time;\r
        uniform float u_zoom;\r
        uniform float u_selectedId;\r
        uniform float u_hoveredId;\r
\r
        float sdHexagon(vec2 p, float r) {\r
            const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);\r
            p = abs(p);\r
            p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;\r
            p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);\r
            return length(p) * sign(p.y);\r
        }\r
\r
        void main() {\r
            float phase = dot(floor(v_worldCenter), vec2(12.9898, 78.233));\r
            float timeOff = u_time * 2.5 + phase;\r
            float breathe = 0.5 + 0.5 * sin(timeOff);\r
            \r
            vec2 sway = vec2(sin(timeOff * 0.5), cos(timeOff * 0.7)) * 0.8;\r
            vec2 local = v_localCoord - (sway * v_growth);\r
            \r
            float distToCenter = length(local);\r
            float maxRad = max(10.0, (v_complexity * 4.0 + 10.0));\r
            \r
            // Fast culling for sparse areas of the quad\r
            if (distToCenter > maxRad + 5.0) discard;\r
\r
            vec3 finalCol = vec3(0.0);\r
            float finalAlpha = 0.0;\r
\r
            if (u_zoom < 0.3) {\r
                // LOD: Simple circle for zoomed out\r
                float d = distToCenter - (maxRad * 0.5 * (0.8 + 0.2 * breathe));\r
                finalAlpha = smoothstep(2.0, -2.0, d);\r
                finalCol = mix(vec3(0.2, 0.3, 0.1), v_color.rgb, 0.6);\r
            } else {\r
                float spacing = 3.2;\r
                vec2 cell = round(local / spacing);\r
                vec2 cellCenter = cell * spacing;\r
                float distIdx = length(cell); \r
\r
                float angle = atan(cell.y, cell.x); \r
                float armHash = fract(sin(angle * 10.0 + phase) * 43758.5453);\r
                float armLen = (v_complexity * v_growth) * (0.6 + 0.8 * armHash);\r
                \r
                bool isCore = distIdx < 2.2;\r
                bool isArm = (cell.x == 0.0 || cell.y == 0.0 || abs(cell.x) == abs(cell.y));\r
                float cellHash = fract(sin(dot(cell, vec2(12.9898, 78.233)) + phase) * 43758.5453);\r
                bool isBud = !isArm && (distIdx < armLen * 0.6) && (cellHash > 0.7);\r
\r
                if (isCore || (isArm && distIdx <= armLen) || isBud) {\r
                    float taper = clamp(1.0 - (distIdx / (armLen + 1.0)), 0.0, 1.0);\r
                    float baseRad = isCore ? 0.75 : (0.45 + 0.35 * taper);\r
                    float radius = (spacing * baseRad) * (0.8 + 0.2 * breathe);\r
                    \r
                    float dF = length(local - cellCenter) - radius;\r
                    if (dF < 4.0) {\r
                         vec3 leafCol = v_color.rgb;\r
                         vec3 stemCol = vec3(0.2, 0.3, 0.1); \r
                         vec3 cellCol = mix(stemCol, leafCol, smoothstep(0.4, 4.2, distIdx));\r
                         cellCol = mix(cellCol, cellCol * 1.5, breathe * 0.3);\r
                         cellCol += vec3(0.1, 0.2, 0.1) * cellHash * 0.5;\r
                         \r
                         float alpha = smoothstep(1.2, -0.8, dF);\r
                         float glow = exp(-max(0.0, dF) * 1.8) * breathe;\r
                         \r
                         // Premultiplied blending for botanical bloom\r
                         finalCol += mix(vec3(0.0), cellCol, alpha) + (vec3(0.08, 0.32, 0.24) * glow * 1.0);\r
                         finalAlpha = max(finalAlpha, alpha);\r
                    }\r
                } else {\r
                    // Slight core glow even for missing cells\r
                    if (distIdx < 4.0) {\r
                        float coreGlow = exp(-distIdx * 0.8) * breathe * 0.2;\r
                        finalCol += v_color.rgb * coreGlow;\r
                        finalAlpha = max(finalAlpha, 0.0); // Don't block background with core glow\r
                    }\r
                }\r
            }\r
\r
            // Botanical Interaction Aura\r
            float floraId = v_color.w;\r
            float isSel = abs(floraId - u_selectedId) < 0.1 ? 1.0 : 0.0;\r
            float isHov = abs(floraId - u_hoveredId) < 0.1 ? 1.0 : 0.0;\r
            if (isSel > 0.5 || isHov > 0.5) {\r
                float auraPulse = 0.5 + 0.5 * sin(u_time * 4.0);\r
                float dHex = sdHexagon(v_localCoord, maxRad + 5.0 + auraPulse);\r
                float dRing = abs(dHex) - 1.5;\r
                if (dRing < 4.0) {\r
                    vec3 auraCol = isSel > 0.5 ? vec3(0.6, 1.0, 0.4) : vec3(1.0);\r
                    float opacity = (isSel > 0.5 ? 0.8 : 0.3) * exp(-abs(dRing) * 1.5);\r
                    finalCol += auraCol * opacity;\r
                }\r
            }\r
\r
            outColor = vec4(finalCol, finalAlpha);\r
        }\r
    \`;\r
\r
    constructor(canvas: HTMLCanvasElement | OffscreenCanvas) {\r
        const gl = canvas.getContext('webgl2', { alpha: false, antialias: true, preserveDrawingBuffer: true }) as WebGL2RenderingContext;\r
        if (!gl) throw new Error("WebGL2 not supported");\r
        this.gl = gl;\r
        this.program = this.createProgram(WebGLRenderer.VERT_SHADER, WebGLRenderer.FRAG_SHADER);\r
        this.faunaProgram = this.createProgram(WebGLRenderer.FAUNA_VERT_SHADER, WebGLRenderer.FAUNA_FRAG_SHADER);\r
        this.floraProgram = this.createProgram(WebGLRenderer.FLORA_VERT_SHADER, WebGLRenderer.FLORA_FRAG_SHADER);\r
\r
        this.quadBuffer = this.createQuad();\r
        this.faunaUnitQuadBuffer = this.createQuad();\r
        this.floraUnitQuadBuffer = this.createQuad();\r
\r
        // Persistent instance ID buffer for 2048 entities (raised from 1024)\r
        this.instanceIDBuffer = this.gl.createBuffer()!;\r
        const ids = new Int32Array(WebGLRenderer.MAX_INSTANCES);\r
        for (let i = 0; i < WebGLRenderer.MAX_INSTANCES; i++) ids[i] = i;\r
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceIDBuffer);\r
        this.gl.bufferData(this.gl.ARRAY_BUFFER, ids, this.gl.STATIC_DRAW);\r
\r
        this.orgTexture = this.createDataTexture(WebGLRenderer.MAX_INSTANCES, 5);\r
        this.floraTexture = this.createDataTexture(WebGLRenderer.MAX_INSTANCES, 2);\r
        this.terrainTexture = gl.createTexture()!;\r
    }\r
\r
    private createShader(type: number, source: string): WebGLShader {\r
        const shader = this.gl.createShader(type)!;\r
        this.gl.shaderSource(shader, source);\r
        this.gl.compileShader(shader);\r
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) throw new Error("Shader compile error: " + this.gl.getShaderInfoLog(shader));\r
        return shader;\r
    }\r
\r
    private createProgram(vertSrc: string, fragSrc: string): WebGLProgram {\r
        const vs = this.createShader(this.gl.VERTEX_SHADER, vertSrc);\r
        const fs = this.createShader(this.gl.FRAGMENT_SHADER, fragSrc);\r
        const prog = this.gl.createProgram()!;\r
        this.gl.attachShader(prog, vs); this.gl.attachShader(prog, fs);\r
        this.gl.linkProgram(prog);\r
        if (!this.gl.getProgramParameter(prog, this.gl.LINK_STATUS)) throw new Error("Program link error: " + this.gl.getProgramInfoLog(prog));\r
        return prog;\r
    }\r
\r
    private createQuad(): WebGLBuffer {\r
        const buffer = this.gl.createBuffer()!;\r
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);\r
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), this.gl.STATIC_DRAW);\r
        return buffer;\r
    }\r
\r
    private createDataTexture(w: number, h: number): WebGLTexture {\r
        const gl = this.gl;\r
        const tex = gl.createTexture()!;\r
        gl.bindTexture(gl.TEXTURE_2D, tex);\r
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, null);\r
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);\r
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);\r
        return tex;\r
    }\r
\r
    private static parseHSL(hsl: string): [number, number, number] {\r
        const match = hsl.match(/hsl\\((\\d+\\.?\\d*),\\s*(\\d+)%,\\s*(\\d+)%\\)/);\r
        if (!match) return [0.5, 0.5, 0.5];\r
        const h = parseFloat(match[1]) / 360, s = parseInt(match[2]) / 100, l = parseInt(match[3]) / 100;\r
        const hue2rgb = (p: number, q: number, t: number) => {\r
            if (t < 0) t += 1; if (t > 1) t -= 1;\r
            if (t < 1 / 6) return p + (q - p) * 6 * t;\r
            if (t < 1 / 2) return q;\r
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;\r
            return p;\r
        };\r
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;\r
        const p = 2 * l - q;\r
        return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];\r
    }\r
\r
    public updateTerrainTexture(terrain: any, worldSize: { x: number, y: number }) {\r
        const gl = this.gl; const res = 512; const data = new Uint8Array(res * res * 4);\r
        for (let y = 0; y < res; y++) {\r
            for (let x = 0; x < res; x++) {\r
                const biome = terrain.getBiomeAt((x / res) * worldSize.x, (y / res) * worldSize.y);\r
                const i = (y * res + x) * 4;\r
                if (biome === 'GRASS') data[i] = 255; else if (biome === 'CLIFF') { data[i] = 127; data[i + 1] = 255; }\r
                data[i + 3] = 255;\r
            }\r
        }\r
        gl.bindTexture(gl.TEXTURE_2D, this.terrainTexture);\r
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, res, res, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);\r
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);\r
        this.terrainInitialized = true;\r
    }\r
\r
    public render(params: {\r
        resolution: [number, number], logicalResolution: [number, number],\r
        worldSize: [number, number], cameraOffset: [number, number], zoom: number, time: number,\r
        organisms: any[], Flora: any[], selectedId: string | null, hoveredId: string | null,\r
        isFollowing: boolean, dpr: number, showVision: boolean, showGrid: boolean,\r
        showHearing: boolean, showCommunication: boolean\r
    }) {\r
        const gl = this.gl;\r
\r
        // 1. Frustum Culling\r
        const invZoom = 1.0 / params.zoom;\r
        const minX = (0 - params.cameraOffset[0]) * invZoom - 100;\r
        const maxX = (params.logicalResolution[0] - params.cameraOffset[0]) * invZoom + 100;\r
        const minY = (0 - params.cameraOffset[1]) * invZoom - 100;\r
        const maxY = (params.logicalResolution[1] - params.cameraOffset[1]) * invZoom + 100;\r
\r
        const visibleOrgs = params.organisms.filter(o =>\r
            o.position.x > minX && o.position.x < maxX && o.position.y > minY && o.position.y < maxY\r
        );\r
        const visibleFlora = params.Flora.filter(f =>\r
            f.position.x > minX && f.position.x < maxX && f.position.y > minY && f.position.y < maxY\r
        );\r
\r
        gl.viewport(0, 0, params.resolution[0], params.resolution[1]);\r
\r
        // 2. Pack Fauna Data (reuse buffer + caches for performance)\r
        const orgData = this.orgDataBuffer;\r
        orgData.fill(0);\r
        const orgCount = Math.min(visibleOrgs.length, WebGLRenderer.MAX_INSTANCES);\r
\r
        // Build O(1) mate index lookup map\r
        const idToIdx = new Map<string, number>();\r
        for (let i = 0; i < orgCount; i++) idToIdx.set(visibleOrgs[i].id, i);\r
\r
        for (let i = 0; i < orgCount; i++) {\r
            const org = visibleOrgs[i];\r
            const visuals = AppearanceMapper.getVisuals(org);\r
\r
            // Cached HSL parse (colors are static per organism)\r
            let rgb = this.colorCache.get(org.id);\r
            if (!rgb) {\r
                rgb = WebGLRenderer.parseHSL(visuals.primaryColor);\r
                this.colorCache.set(org.id, rgb);\r
            }\r
            const [r, g, b] = rgb;\r
            const pixSize = UNIT_UTILS.cmToPx(org.expressedStats.size);\r
\r
            const b0 = i * 4;\r
            orgData[b0] = org.position.x; orgData[b0 + 1] = org.position.y;\r
            orgData[b0 + 2] = pixSize * 0.4; orgData[b0 + 3] = pixSize * 0.2;\r
\r
            const b1 = (WebGLRenderer.MAX_INSTANCES + i) * 4;\r
            orgData[b1] = r; orgData[b1 + 1] = g; orgData[b1 + 2] = b; orgData[b1 + 3] = parseFloat(org.id);\r
\r
            const b2 = (WebGLRenderer.MAX_INSTANCES * 2 + i) * 4;\r
            orgData[b2] = org.velocity.x; orgData[b2 + 1] = org.velocity.y;\r
            orgData[b2 + 2] = org.expressedStats.sight_fov; orgData[b2 + 3] = org.id === params.selectedId ? 1.0 : 0.0;\r
\r
            const b3 = (WebGLRenderer.MAX_INSTANCES * 3 + i) * 4;\r
            orgData[b3] = (org.bending || 0) * visuals.skeletalRigidity;\r
            // O(1) mate index lookup\r
            let mateIdx = -1.0;\r
            if (org.matingTimer && org.matingTimer > 0 && org.matingTargetId) {\r
                const mi = idToIdx.get(org.matingTargetId);\r
                if (mi !== undefined) mateIdx = mi;\r
            }\r
            orgData[b3 + 1] = mateIdx;\r
            orgData[b3 + 2] = UNIT_UTILS.mToPx(org.expressedStats.sight_range);\r
            orgData[b3 + 3] = UNIT_UTILS.mToPx(org.expressedStats.audible_range || 3.0) + (org.isHearingActive ? 10000.0 : 0.0);\r
\r
            const b4 = (WebGLRenderer.MAX_INSTANCES * 4 + i) * 4;\r
            orgData[b4] = UNIT_UTILS.mToPx(org.expressedStats.communicating_range || 1.5) + (org.isTransmittingActive ? 10000.0 : 0.0);\r
            // Pack visuals: matingFactor (fract) + isNoble (bool)\r
            // d5.y: [isNoble: integer bit (0 or 1)] + [matingFactor: fractional (0.0-1.0)]\r
            const isNoble = org.energy > 28000 ? 1.0 : 0.0; // Deriving nobility from energy peak for now\r
            const matingFactor = (org.matingTimer && org.matingTimer > 0) ? (org.matingTimer / 120.0) : 0.0;\r
            orgData[b4 + 1] = isNoble + matingFactor;\r
\r
            orgData[b4 + 2] = Math.min(1.0, org.energy / 30000.0);\r
\r
            // Pack turn force: 5x multiplier for reactive leaning (lowered from 10x for stability)\r
            const prev = this.prevVelocities.get(org.id);\r
            if (prev) {\r
                orgData[b4 + 3] = (prev.x * org.velocity.y - prev.y * org.velocity.x) * 5.0;\r
            } else {\r
                orgData[b4 + 3] = 0.0;\r
            }\r
        }\r
\r
        // Update prevVelocities for next frame\r
        for (let i = 0; i < orgCount; i++) {\r
            const org = visibleOrgs[i];\r
            this.prevVelocities.set(org.id, { x: org.velocity.x, y: org.velocity.y });\r
        }\r
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.orgTexture);\r
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, WebGLRenderer.MAX_INSTANCES, 5, gl.RGBA, gl.FLOAT, orgData);\r
\r
        // 3. Pack Flora Data (reuse buffer)\r
        const floraData = this.floraDataBuffer;\r
        floraData.fill(0);\r
        const floraCount = Math.min(visibleFlora.length, WebGLRenderer.MAX_INSTANCES);\r
        for (let i = 0; i < floraCount; i++) {\r
            const f = visibleFlora[i];\r
            const base = i * 4;\r
            floraData[base] = f.position.x; floraData[base + 1] = f.position.y;\r
            floraData[base + 2] = f.growthState; floraData[base + 3] = f.complexity;\r
\r
            const colorBase = (WebGLRenderer.MAX_INSTANCES + i) * 4;\r
            const hsl = WebGLRenderer.parseHSL(f.color);\r
            floraData[colorBase] = hsl[0]; floraData[colorBase + 1] = hsl[1];\r
            floraData[colorBase + 2] = hsl[2]; floraData[colorBase + 3] = parseFloat(f.id);\r
        }\r
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.floraTexture);\r
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, WebGLRenderer.MAX_INSTANCES, 2, gl.RGBA, gl.FLOAT, floraData);\r
\r
        // 4. Pass 1: Terrain & Fauna\r
        gl.useProgram(this.program);\r
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.orgTexture);\r
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.terrainTexture);\r
\r
        const setU1 = (p: WebGLProgram, n: string, v: number) => gl.uniform1f(gl.getUniformLocation(p, n), v);\r
        const setU2 = (p: WebGLProgram, n: string, x: number, y: number) => gl.uniform2f(gl.getUniformLocation(p, n), x, y);\r
        const setUniforms = (p: WebGLProgram) => {\r
            setU2(p, 'u_logicalResolution', params.logicalResolution[0], params.logicalResolution[1]);\r
            setU2(p, 'u_cameraOffset', params.cameraOffset[0], params.cameraOffset[1]);\r
            setU1(p, 'u_zoom', params.zoom);\r
            setU1(p, 'u_time', params.time / (SIM_CONSTANTS.FPS || 60));\r
            setU1(p, 'u_selectedId', params.selectedId ? parseFloat(params.selectedId) : -1);\r
            setU1(p, 'u_hoveredId', params.hoveredId ? parseFloat(params.hoveredId) : -1);\r
        };\r
\r
        setUniforms(this.program);\r
        setU2(this.program, 'u_resolution', params.resolution[0], params.resolution[1]);\r
        setU2(this.program, 'u_worldSize', params.worldSize[0], params.worldSize[1]);\r
        setU1(this.program, 'u_showVision', params.showVision ? 1.0 : 0.0);\r
        setU1(this.program, 'u_showHearing', params.showHearing ? 1.0 : 0.0);\r
        setU1(this.program, 'u_showCommunication', params.showCommunication ? 1.0 : 0.0);\r
        setU1(this.program, 'u_showGrid', params.showGrid ? 1.0 : 0.0);\r
        gl.uniform1i(gl.getUniformLocation(this.program, "u_orgTexture"), 0);\r
        gl.uniform1i(gl.getUniformLocation(this.program, "u_terrainTexture"), 1);\r
        gl.uniform1i(gl.getUniformLocation(this.program, "u_orgCount"), orgCount);\r
\r
        const selected = params.organisms.find(o => o.id === params.selectedId);\r
        const hovered = params.organisms.find(o => o.id === params.hoveredId);\r
        setU2(this.program, "u_selectedPos", selected ? selected.position.x : -1000, selected ? selected.position.y : -1000);\r
        setU1(this.program, "u_selectedSize", selected ? UNIT_UTILS.cmToPx(selected.expressedStats.size) * 0.5 : 0);\r
        setU2(this.program, "u_hoveredPos", hovered ? hovered.position.x : -1000, hovered ? hovered.position.y : -1000);\r
        setU1(this.program, "u_hoveredSize", hovered ? UNIT_UTILS.cmToPx(hovered.expressedStats.size) * 0.5 : 0);\r
\r
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);\r
        const pLoc = gl.getAttribLocation(this.program, 'a_position');\r
        gl.enableVertexAttribArray(pLoc); gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);\r
        gl.drawArrays(gl.TRIANGLES, 0, 6);\r
\r
        // 5. Pass 2: Instanced Fauna\r
        gl.enable(gl.BLEND);\r
        // Use ONE, ONE_MINUS_SRC_ALPHA for premultiplied / additive glow + opaque body\r
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);\r
        gl.useProgram(this.faunaProgram);\r
        setUniforms(this.faunaProgram);\r
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.orgTexture);\r
        gl.uniform1i(gl.getUniformLocation(this.faunaProgram, "u_orgTexture"), 0);\r
        setU1(this.faunaProgram, 'u_showVision', params.showVision ? 1.0 : 0.0);\r
        setU1(this.faunaProgram, 'u_showHearing', params.showHearing ? 1.0 : 0.0);\r
        setU1(this.faunaProgram, 'u_showCommunication', params.showCommunication ? 1.0 : 0.0);\r
\r
        gl.bindBuffer(gl.ARRAY_BUFFER, this.faunaUnitQuadBuffer);\r
        const faunaUnitPLoc = gl.getAttribLocation(this.faunaProgram, 'a_unitPosition');\r
        gl.enableVertexAttribArray(faunaUnitPLoc); gl.vertexAttribPointer(faunaUnitPLoc, 2, gl.FLOAT, false, 0, 0);\r
\r
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceIDBuffer);\r
        const faunaIDLoc = gl.getAttribLocation(this.faunaProgram, 'a_instanceID');\r
        gl.enableVertexAttribArray(faunaIDLoc); gl.vertexAttribIPointer(faunaIDLoc, 1, gl.INT, 0, 0);\r
        gl.vertexAttribDivisor(faunaIDLoc, 1);\r
\r
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, orgCount);\r
\r
        // 6. Pass 3: Instanced Flora\r
        gl.useProgram(this.floraProgram);\r
        setUniforms(this.floraProgram);\r
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.floraTexture);\r
        gl.uniform1i(gl.getUniformLocation(this.floraProgram, "u_floraTexture"), 0);\r
\r
        gl.bindBuffer(gl.ARRAY_BUFFER, this.floraUnitQuadBuffer);\r
        const unitPLoc = gl.getAttribLocation(this.floraProgram, 'a_unitPosition');\r
        gl.enableVertexAttribArray(unitPLoc); gl.vertexAttribPointer(unitPLoc, 2, gl.FLOAT, false, 0, 0);\r
\r
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceIDBuffer);\r
        const idLoc = gl.getAttribLocation(this.floraProgram, 'a_instanceID');\r
        gl.enableVertexAttribArray(idLoc); gl.vertexAttribIPointer(idLoc, 1, gl.INT, 0, 0);\r
        gl.vertexAttribDivisor(idLoc, 1);\r
\r
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, floraCount);\r
        gl.disableVertexAttribArray(idLoc);\r
        gl.vertexAttribDivisor(idLoc, 0);\r
        gl.disable(gl.BLEND);\r
    }\r
}\r
`;export{r as default};
