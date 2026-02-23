
import { AppearanceMapper } from './AppearanceMapper';
import { SIM_CONSTANTS, UNIT_UTILS } from '../core/Constants';

export class WebGLRenderer {
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private floraProgram: WebGLProgram;
    private quadBuffer: WebGLBuffer;
    private floraUnitQuadBuffer: WebGLBuffer;
    private instanceIDBuffer: WebGLBuffer;
    private orgTexture: WebGLTexture;
    private floraTexture: WebGLTexture;
    private faunaProgram: WebGLProgram;
    private faunaUnitQuadBuffer: WebGLBuffer;
    private terrainTexture: WebGLTexture;
    private terrainInitialized = false;

    // --- Performance: reusable arrays & caches ---
    private orgDataBuffer = new Float32Array(1024 * 4 * 5);
    private floraDataBuffer = new Float32Array(1024 * 4 * 2);
    private colorCache = new Map<string, [number, number, number]>();
    private prevVelocities = new Map<string, { x: number; y: number }>();

    // These would ideally be imported from .glsl?raw but for stability we embed here
    private static VERT_SHADER = `#version 300 es
        in vec2 a_position;
        out vec2 v_texCoord;
        void main() {
            v_texCoord = a_position * 0.5 + 0.5;
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    private static FRAG_SHADER = `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        out vec4 outColor;

        uniform vec2 u_resolution;
        uniform vec2 u_logicalResolution;
        uniform vec2 u_worldSize;
        uniform vec2 u_cameraOffset;
        uniform float u_zoom;
        uniform float u_time;
        uniform float u_dpr;
        
        uniform vec2 u_selectedPos;
        uniform float u_selectedSize;
        uniform float u_selectedId;
        uniform vec2 u_hoveredPos;
        uniform float u_hoveredSize;
        uniform float u_hoveredId;
        uniform float u_isFollowing;
        uniform float u_showVision;
        uniform float u_showHearing;
        uniform float u_showCommunication;
        uniform float u_showGrid;
        
        uniform sampler2D u_orgTexture;
        uniform int u_orgCount;
        
        uniform sampler2D u_terrainTexture;

        float sdCircle(vec2 p, float r) { return length(p) - r; }
        float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
            vec2 pa = p - a, ba = b - a;
            float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
            return length(pa - ba * h) - r;
        }
        float smin(float a, float b, float k) {
            float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
            return mix(b, a, h) - k * h * (1.0 - h);
        }
        vec2 rotate(vec2 v, vec2 dir) {
            dir = normalize(dir);
            return vec2(v.x * dir.x - v.y * dir.y, v.x * dir.y + v.y * dir.x);
        }
        float sdHexagon(vec2 p, float r) {
            const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
            p = abs(p);
            p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
            p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
            return length(p) * sign(p.y);
        }

        void main() {
            vec2 fragCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y) * u_logicalResolution;
            vec2 worldCoord = (fragCoord - u_cameraOffset) / u_zoom;
            
            vec2 terrainUV = vec2(worldCoord.x / u_worldSize.x, 1.0 - worldCoord.y / u_worldSize.y);
            vec4 terrainData = texture(u_terrainTexture, terrainUV);
            
            vec3 background = terrainData.g > 0.8 ? vec3(0.1) : mix(vec3(0.25, 0.2, 0.1), vec3(0.12, 0.25, 0.15), terrainData.r);
            if (worldCoord.x < 0.0 || worldCoord.x > u_worldSize.x || worldCoord.y < 0.0 || worldCoord.y > u_worldSize.y) background = vec3(0.002, 0.004, 0.003);

            vec4 resColor = vec4(background, 1.0); 
            if (u_showGrid > 0.5) {
                vec2 gridUV = fract(worldCoord / 20.0);
                resColor.rgb += vec3(0.1, 0.2, 0.15) * (smoothstep(0.02, 0.0, abs(gridUV.x - 0.5)) + smoothstep(0.02, 0.0, abs(gridUV.y - 0.5))) * 0.2;
            }

            // --- JELLY BODY SDF (Global smin REMOVED for Performance) ---
            // The O(Pixels * Count) loop was causing massive lag at high populations.
            // Body rendering is now handled entirely in the instanced FAUNA_FRAG_SHADER (Pass 2).
            
            outColor = vec4(resColor.rgb, 1.0);
        }
    `;

    private static FAUNA_VERT_SHADER = `#version 300 es
        in vec2 a_unitPosition;
        in int a_instanceID;

        out vec2 v_localCoord;
        out float v_id;
        flat out int v_instanceID;
        out vec2 v_worldCenter;

        uniform sampler2D u_orgTexture;
        uniform vec2 u_cameraOffset;
        uniform float u_zoom;
        uniform vec2 u_logicalResolution;

        void main() {
            float tx = (float(a_instanceID) + 0.5) / 1024.0;
            vec4 d1 = texture(u_orgTexture, vec2(tx, 0.1)); 
            vec2 pos = d1.xy;
            float size = d1.z;
            float skeletalLength = d1.w;

            vec4 d4 = texture(u_orgTexture, vec2(tx, 0.7));
            float sightRange = d4.z;
            float audibleRange = d4.w;
            vec4 d5 = texture(u_orgTexture, vec2(tx, 0.9));
            float commRange = d5.x;

            float maxSense = max(sightRange, max(audibleRange, commRange));
            float bodyBound = size + skeletalLength + 15.0;
            float quadSize = max(bodyBound, maxSense) + 20.0;

            v_localCoord = a_unitPosition * quadSize;
            v_id = texture(u_orgTexture, vec2(tx, 0.3)).w;
            v_instanceID = a_instanceID;
            v_worldCenter = pos;

            vec2 worldPos = pos + v_localCoord;
            vec2 screenPos = worldPos * u_zoom + u_cameraOffset;
            vec2 clipPos = (screenPos / u_logicalResolution) * 2.0 - 1.0;
            gl_Position = vec4(clipPos.x, -clipPos.y, 0.0, 1.0);
        }
    `;

    private static FAUNA_FRAG_SHADER = `#version 300 es
        precision highp float;
        in vec2 v_localCoord;
        in float v_id;
        flat in int v_instanceID;
        in vec2 v_worldCenter;
        
        out vec4 outColor;

        uniform sampler2D u_orgTexture;
        uniform float u_time;
        uniform float u_zoom;
        uniform float u_selectedId;
        uniform float u_hoveredId;
        uniform float u_showVision;
        uniform float u_showHearing;
        uniform float u_showCommunication;
        uniform sampler2D u_terrainTexture;

        float sdCircle(vec2 p, float r) { return length(p) - r; }
        float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
            vec2 pa = p - a, ba = b - a;
            float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
            return length(pa - ba * h) - r;
        }
        float smin(float a, float b, float k) {
            float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
            return mix(b, a, h) - k * h * (1.0 - h);
        }
        vec2 rotate(vec2 v, vec2 dir) {
            dir = normalize(dir);
            return vec2(v.x * dir.x - v.y * dir.y, v.x * dir.y + v.y * dir.x);
        }

        void main() {
            float tx = (float(v_instanceID) + 0.5) / 1024.0;
            vec4 d1 = texture(u_orgTexture, vec2(tx, 0.1));
            vec2 pos = d1.xy;
            float size = d1.z;
            float skeletalLength = d1.w;
            
            vec4 d2 = texture(u_orgTexture, vec2(tx, 0.3));
            vec3 col = d2.rgb;
            float id = d2.w;
            
            vec4 d3 = texture(u_orgTexture, vec2(tx, 0.5));
            vec2 vel = d3.xy;
            float fov = d3.z;
            float isSelected = d3.w;

            vec4 d4 = texture(u_orgTexture, vec2(tx, 0.7));
            float bending = d4.x; // EXPLICITLY DECLARING BENDING HERE
            float mateIndex = d4.y; // Now stores index, not boolean
            float sightRange = d4.z;
            float audibleRange = d4.w;

            vec4 d5 = texture(u_orgTexture, vec2(tx, 0.9));
            float commRange = d5.x;
            float appearanceType = d5.y;
            float glowIntensity = d5.z * 1.5; // BOOSTED GLOW INTENSITY

            vec2 dir = length(vel) > 0.001 ? normalize(vel) : vec2(1.0, 0.0);
            float dist = length(v_localCoord);
            
            vec3 finalCol = vec3(0.0);
            float finalAlpha = 0.0;

            // --- SENSORY (Differentiated: Vision=cone, Hearing=passive ring, Comm=radiating ping) ---
            // VISION: Active directional cone
            if (u_showVision > 0.5 && dist < sightRange) {
                vec2 rel = normalize(v_localCoord);
                float angle = acos(clamp(dot(rel, dir), -1.0, 1.0));
                if (angle < fov * 0.5) {
                    float intensity = 0.25 * (1.0 - dist / sightRange);
                    finalCol += col * intensity;
                    finalAlpha = max(finalAlpha, intensity);
                }
            }
            // HEARING: Passive soft dashed ring at boundary (no radiating ping)
            if (u_showHearing > 0.5 && dist < audibleRange + 4.0) {
                float pulse = 0.7 + 0.3 * sin(u_time * 1.5 + v_id * 0.3);
                float dRingH = abs(dist - audibleRange) - 1.5;
                if (dRingH < 3.0) {
                    float angleH = atan(v_localCoord.y, v_localCoord.x);
                    float dashH = step(0.3, fract(angleH * 6.0 / 6.28318 + u_time * 0.3));
                    float ringAlpha = exp(-abs(dRingH) * 1.2) * 0.4 * pulse * dashH;
                    finalCol += vec3(0.2, 0.65, 0.85) * ringAlpha;
                    finalAlpha = max(finalAlpha, ringAlpha);
                }
            }
            // COMMUNICATION / VOCAL RANGE: Radiating outward ping ripples
            if (u_showCommunication > 0.5 && dist < commRange) {
                float ping1 = fract(u_time * 0.4 + v_id * 0.1);
                float ping2 = fract(u_time * 0.4 + v_id * 0.1 + 0.5);
                float dPing1 = abs(dist - ping1 * commRange);
                float dPing2 = abs(dist - ping2 * commRange);
                float fade1 = (1.0 - ping1) * 0.6;
                float fade2 = (1.0 - ping2) * 0.6;
                float ripple = 0.0;
                if (dPing1 < 2.5) ripple += exp(-dPing1 * 0.8) * fade1;
                if (dPing2 < 2.5) ripple += exp(-dPing2 * 0.8) * fade2;
                finalCol += vec3(1.0, 0.7, 0.15) * ripple;
                finalAlpha = max(finalAlpha, ripple);
            }

            // --- INSTANCED BODY RENDERING (Soft Jelly Logic) ---
            float softness = mix(0.1, 4.0, clamp(1.0 - u_zoom * 1.5, 0.0, 1.0));
            
            vec2 perp = vec2(-dir.y, dir.x);
            // Physics-based warp: turnForce is pre-computed cross product on CPU
            float turnForce = d5.w;
            float spd = length(vel);
            // Clamp turn warp to prevent extreme distortion
            float warp = clamp(turnForce * 2.0, -8.0, 8.0);
            // Gentle oscillation for idle "breathing" only when nearly stationary
            float idleWobble = (1.0 - clamp(spd * 3.0, 0.0, 1.0)) * sin(u_time * 2.0 + v_id) * 0.3;
            float totalWarp = bending + warp + idleWobble;
            vec2 localP = v_localCoord;
            float distAlong = dot(localP, dir);
            vec2 warpedP = v_localCoord - (perp * totalWarp * 0.06 * distAlong);
            
            vec2 pA = dir * (skeletalLength * 0.5);
            vec2 pB = -dir * (skeletalLength * 0.5);
            float r = size * (0.95 + 0.05 * sin(u_time * 0.1 + v_id)); // Breathing effect
            
            float dBody = sdCapsule(warpedP, pA, pB, r);

            // --- MATING MERGE (Localized "Meatball") ---
            if (mateIndex > -0.5) {
                float mTx = (mateIndex + 0.5) / 1024.0;
                vec4 mD1 = texture(u_orgTexture, vec2(mTx, 0.1));
                vec2 mPos = mD1.xy;
                float mSize = mD1.z; // Use raw size for stability
                
                // Transform mate pos to local space
                vec2 mLocal = mPos - v_worldCenter + v_localCoord;
                float dMate = sdCircle(mLocal, mSize);
                dBody = smin(dBody, dMate, 15.0); // Smooth blend
            }
            
            float bodyAlpha = smoothstep(softness, -softness, dBody);
            
            // --- OUTLINE GLOW (Gradient edge halo) ---
            // Render BEFORE body so it layers behind the opaque body
            if (dBody > 0.0 && dBody < 25.0) {
                float outlineGlow = exp(-dBody * 0.12) * glowIntensity * 0.8;
                finalCol += col * outlineGlow;
                finalAlpha = max(finalAlpha, outlineGlow * 0.7);
            }

            // Bioluminescent Glow (Pre-multiplied)
            float glowFalloff = exp(-max(0.0, dBody) * 0.08);
            vec3 bodyCol = col * (0.7 + 0.6 * glowFalloff * glowIntensity);

            // Profile Specific Tweaks (Noble Pulse)
            if (appearanceType > 0.5) { 
                float pulse = 0.5 + 0.5 * sin(u_time * 4.0 + v_id);
                bodyCol *= (1.0 + 0.4 * pulse);
            }

            // Combine Body with Alpha
            vec3 finalBody = bodyCol * bodyAlpha;
            finalCol = mix(finalCol, finalBody, bodyAlpha);
            finalAlpha = max(finalAlpha, bodyAlpha);

            // --- OVERLAYS (Eyes & Selection) ---
            if (u_zoom > 0.5 && bodyAlpha > 0.01) {
                vec2 eyeP1 = rotate(vec2(size * 0.75, size * 0.45), dir);
                vec2 eyeP2 = rotate(vec2(size * 0.75, -size * 0.45), dir);
                float eyeSize = size * 0.38;
                float dE = min(sdCircle(v_localCoord - eyeP1, eyeSize), sdCircle(v_localCoord - eyeP2, eyeSize));
                if (dE < 2.0) {
                    float alphaE = smoothstep(1.5, -1.5, dE);
                    float dPupil = min(sdCircle(v_localCoord - (eyeP1 + dir * eyeSize * 0.25), eyeSize * 0.45),
                                       sdCircle(v_localCoord - (eyeP2 + dir * eyeSize * 0.25), eyeSize * 0.45));
                    vec3 eCol = dPupil < 0.0 ? vec3(0.01) : vec3(1.0);
                    finalCol = mix(finalCol, eCol, alphaE);
                    finalAlpha = max(finalAlpha, alphaE);
                }
            }

            // Selection Rings (Instanced)
            float idDiff = abs(id - u_selectedId);
            float hovDiff = abs(id - u_hoveredId);
            if (idDiff < 0.1 || hovDiff < 0.1) {
                float isSel = idDiff < 0.1 ? 1.0 : 0.0;
                float ringSize = size + 14.0 + sin(u_time * 3.0) * 3.0;
                float dRing = abs(length(v_localCoord) - ringSize) - 2.0;
                if (dRing < 4.0) {
                    float angle = atan(v_localCoord.y, v_localCoord.x);
                    float dash = step(0.35, fract(angle * 10.0 / 6.28318 + u_time * 2.0));
                    float opacity = (isSel > 0.5 ? 1.0 : 0.6) * smoothstep(2.0, -1.0, dRing) * (0.5 + 0.5 * dash);
                    vec3 ringCol = isSel > 0.5 ? vec3(0.1, 0.7, 1.0) : vec3(0.5, 1.0, 0.8);
                    finalCol = mix(finalCol, ringCol, opacity); // Additive ring
                    finalAlpha = max(finalAlpha, opacity);
                }
            }

            if (finalAlpha < 0.001) discard;
            outColor = vec4(finalCol, finalAlpha);
        }
    `;

    // --- INSTANCED FLORA SHADERS ---
    private static FLORA_VERT_SHADER = `#version 300 es
        in vec2 a_unitPosition;
        in int a_instanceID;

        out vec2 v_localCoord;
        out float v_growth;
        out float v_complexity;
        out vec4 v_color;
        out vec2 v_worldCenter;
        flat out int v_id;

        uniform sampler2D u_floraTexture;
        uniform vec2 u_cameraOffset;
        uniform float u_zoom;
        uniform vec2 u_logicalResolution;

        void main() {
            float tx = (float(a_instanceID) + 0.5) / 1024.0;
            vec4 d1 = texture(u_floraTexture, vec2(tx, 0.25)); // x, y, growth, complexity
            vec2 fPos = d1.xy;
            float growth = d1.z;
            float complexity = d1.w;
            
            vec4 d2 = texture(u_floraTexture, vec2(tx, 0.75)); // Color
            
            float maxRad = max(10.0, (complexity * 4.0 + 10.0));
            // Add slight margin for swaying/blooming
            float quadSize = maxRad * 2.0 + 10.0; 

            v_localCoord = a_unitPosition * quadSize;
            v_growth = growth;
            v_complexity = complexity;
            v_color = vec4(d2.rgb, 1.0);
            v_worldCenter = fPos;
            v_id = a_instanceID;

            vec2 worldPos = fPos + v_localCoord;
            vec2 screenPos = worldPos * u_zoom + u_cameraOffset;
            vec2 clipPos = (screenPos / u_logicalResolution) * 2.0 - 1.0;
            
            gl_Position = vec4(clipPos.x, -clipPos.y, 0.0, 1.0);
        }
    `;

    private static FLORA_FRAG_SHADER = `#version 300 es
        precision highp float;
        in vec2 v_localCoord;
        in float v_growth;
        in float v_complexity;
        in vec4 v_color;
        in vec2 v_worldCenter;
        flat in int v_id;

        out vec4 outColor;
        
        uniform float u_time;
        uniform float u_zoom;
        uniform float u_selectedId;
        uniform float u_hoveredId;

        float sdHexagon(vec2 p, float r) {
            const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
            p = abs(p);
            p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
            p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
            return length(p) * sign(p.y);
        }

        void main() {
            float phase = dot(floor(v_worldCenter), vec2(12.9898, 78.233));
            float timeOff = u_time * 2.5 + phase;
            float breathe = 0.5 + 0.5 * sin(timeOff);
            
            vec2 sway = vec2(sin(timeOff * 0.5), cos(timeOff * 0.7)) * 0.8;
            vec2 local = v_localCoord - (sway * v_growth);
            
            float distToCenter = length(local);
            float maxRad = max(10.0, (v_complexity * 4.0 + 10.0));
            
            // Fast culling for sparse areas of the quad
            if (distToCenter > maxRad + 5.0) discard;

            vec3 finalCol = vec3(0.0);
            float finalAlpha = 0.0;

            if (u_zoom < 0.3) {
                // LOD: Simple circle for zoomed out
                float d = distToCenter - (maxRad * 0.5 * (0.8 + 0.2 * breathe));
                finalAlpha = smoothstep(2.0, -2.0, d);
                finalCol = mix(vec3(0.2, 0.3, 0.1), v_color.rgb, 0.6);
            } else {
                float spacing = 3.2;
                vec2 cell = round(local / spacing);
                vec2 cellCenter = cell * spacing;
                float distIdx = length(cell); 

                float angle = atan(cell.y, cell.x); 
                float armHash = fract(sin(angle * 10.0 + phase) * 43758.5453);
                float armLen = (v_complexity * v_growth) * (0.6 + 0.8 * armHash);
                
                bool isCore = distIdx < 2.2;
                bool isArm = (cell.x == 0.0 || cell.y == 0.0 || abs(cell.x) == abs(cell.y));
                float cellHash = fract(sin(dot(cell, vec2(12.9898, 78.233)) + phase) * 43758.5453);
                bool isBud = !isArm && (distIdx < armLen * 0.6) && (cellHash > 0.7);

                if (isCore || (isArm && distIdx <= armLen) || isBud) {
                    float taper = clamp(1.0 - (distIdx / (armLen + 1.0)), 0.0, 1.0);
                    float baseRad = isCore ? 0.75 : (0.45 + 0.35 * taper);
                    float radius = (spacing * baseRad) * (0.8 + 0.2 * breathe);
                    
                    float dF = length(local - cellCenter) - radius;
                    if (dF < 4.0) {
                         vec3 leafCol = v_color.rgb;
                         vec3 stemCol = vec3(0.2, 0.3, 0.1); 
                         vec3 cellCol = mix(stemCol, leafCol, smoothstep(0.4, 4.2, distIdx));
                         cellCol = mix(cellCol, cellCol * 1.5, breathe * 0.3);
                         cellCol += vec3(0.1, 0.2, 0.1) * cellHash * 0.5;
                         
                         float alpha = smoothstep(1.2, -0.8, dF);
                         float glow = exp(-max(0.0, dF) * 1.8) * breathe;
                         
                         // Premultiplied blending for botanical bloom
                         finalCol += mix(vec3(0.0), cellCol, alpha) + (vec3(0.08, 0.32, 0.24) * glow * 1.0);
                         finalAlpha = max(finalAlpha, alpha);
                    }
                } else {
                    // Slight core glow even for missing cells
                    if (distIdx < 4.0) {
                        float coreGlow = exp(-distIdx * 0.8) * breathe * 0.2;
                        finalCol += v_color.rgb * coreGlow;
                        finalAlpha = max(finalAlpha, 0.0); // Don't block background with core glow
                    }
                }
            }

            // Botanical Interaction Aura
            float floraId = v_color.w;
            float isSel = abs(floraId - u_selectedId) < 0.1 ? 1.0 : 0.0;
            float isHov = abs(floraId - u_hoveredId) < 0.1 ? 1.0 : 0.0;
            if (isSel > 0.5 || isHov > 0.5) {
                float auraPulse = 0.5 + 0.5 * sin(u_time * 4.0);
                float dHex = sdHexagon(v_localCoord, maxRad + 5.0 + auraPulse);
                float dRing = abs(dHex) - 1.5;
                if (dRing < 4.0) {
                    vec3 auraCol = isSel > 0.5 ? vec3(0.6, 1.0, 0.4) : vec3(1.0);
                    float opacity = (isSel > 0.5 ? 0.8 : 0.3) * exp(-abs(dRing) * 1.5);
                    finalCol += auraCol * opacity;
                }
            }

            outColor = vec4(finalCol, finalAlpha);
        }
    `;

    constructor(canvas: HTMLCanvasElement | OffscreenCanvas) {
        const gl = canvas.getContext('webgl2', { alpha: false, antialias: true, preserveDrawingBuffer: true }) as WebGL2RenderingContext;
        if (!gl) throw new Error("WebGL2 not supported");
        this.gl = gl;
        this.program = this.createProgram(WebGLRenderer.VERT_SHADER, WebGLRenderer.FRAG_SHADER);
        this.faunaProgram = this.createProgram(WebGLRenderer.FAUNA_VERT_SHADER, WebGLRenderer.FAUNA_FRAG_SHADER);
        this.floraProgram = this.createProgram(WebGLRenderer.FLORA_VERT_SHADER, WebGLRenderer.FLORA_FRAG_SHADER);

        this.quadBuffer = this.createQuad();
        this.faunaUnitQuadBuffer = this.createQuad();
        this.floraUnitQuadBuffer = this.createQuad();

        // Persistent instance ID buffer for 1024 entities
        this.instanceIDBuffer = this.gl.createBuffer()!;
        const ids = new Int32Array(1024);
        for (let i = 0; i < 1024; i++) ids[i] = i;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceIDBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, ids, this.gl.STATIC_DRAW);

        this.orgTexture = this.createDataTexture(1024, 5);
        this.floraTexture = this.createDataTexture(1024, 2);
        this.terrainTexture = gl.createTexture()!;
    }

    private createShader(type: number, source: string): WebGLShader {
        const shader = this.gl.createShader(type)!;
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) throw new Error("Shader compile error: " + this.gl.getShaderInfoLog(shader));
        return shader;
    }

    private createProgram(vertSrc: string, fragSrc: string): WebGLProgram {
        const vs = this.createShader(this.gl.VERTEX_SHADER, vertSrc);
        const fs = this.createShader(this.gl.FRAGMENT_SHADER, fragSrc);
        const prog = this.gl.createProgram()!;
        this.gl.attachShader(prog, vs); this.gl.attachShader(prog, fs);
        this.gl.linkProgram(prog);
        if (!this.gl.getProgramParameter(prog, this.gl.LINK_STATUS)) throw new Error("Program link error: " + this.gl.getProgramInfoLog(prog));
        return prog;
    }

    private createQuad(): WebGLBuffer {
        const buffer = this.gl.createBuffer()!;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), this.gl.STATIC_DRAW);
        return buffer;
    }

    private createDataTexture(w: number, h: number): WebGLTexture {
        const gl = this.gl;
        const tex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        return tex;
    }

    private static parseHSL(hsl: string): [number, number, number] {
        const match = hsl.match(/hsl\((\d+\.?\d*),\s*(\d+)%,\s*(\d+)%\)/);
        if (!match) return [0.5, 0.5, 0.5];
        const h = parseFloat(match[1]) / 360, s = parseInt(match[2]) / 100, l = parseInt(match[3]) / 100;
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
    }

    public updateTerrainTexture(terrain: any, worldSize: { x: number, y: number }) {
        const gl = this.gl; const res = 512; const data = new Uint8Array(res * res * 4);
        for (let y = 0; y < res; y++) {
            for (let x = 0; x < res; x++) {
                const biome = terrain.getBiomeAt((x / res) * worldSize.x, (y / res) * worldSize.y);
                const i = (y * res + x) * 4;
                if (biome === 'GRASS') data[i] = 255; else if (biome === 'CLIFF') { data[i] = 127; data[i + 1] = 255; }
                data[i + 3] = 255;
            }
        }
        gl.bindTexture(gl.TEXTURE_2D, this.terrainTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, res, res, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        this.terrainInitialized = true;
    }

    public render(params: {
        resolution: [number, number], logicalResolution: [number, number],
        worldSize: [number, number], cameraOffset: [number, number], zoom: number, time: number,
        organisms: any[], Flora: any[], selectedId: string | null, hoveredId: string | null,
        isFollowing: boolean, dpr: number, showVision: boolean, showGrid: boolean,
        showHearing: boolean, showCommunication: boolean
    }) {
        const gl = this.gl;

        // 1. Frustum Culling
        const invZoom = 1.0 / params.zoom;
        const minX = (0 - params.cameraOffset[0]) * invZoom - 100;
        const maxX = (params.logicalResolution[0] - params.cameraOffset[0]) * invZoom + 100;
        const minY = (0 - params.cameraOffset[1]) * invZoom - 100;
        const maxY = (params.logicalResolution[1] - params.cameraOffset[1]) * invZoom + 100;

        const visibleOrgs = params.organisms.filter(o =>
            o.position.x > minX && o.position.x < maxX && o.position.y > minY && o.position.y < maxY
        );
        const visibleFlora = params.Flora.filter(f =>
            f.position.x > minX && f.position.x < maxX && f.position.y > minY && f.position.y < maxY
        );

        gl.viewport(0, 0, params.resolution[0], params.resolution[1]);

        // 2. Pack Fauna Data (reuse buffer + caches for performance)
        const orgData = this.orgDataBuffer;
        orgData.fill(0);
        const orgCount = Math.min(visibleOrgs.length, 1024);

        // Build O(1) mate index lookup map
        const idToIdx = new Map<string, number>();
        for (let i = 0; i < orgCount; i++) idToIdx.set(visibleOrgs[i].id, i);

        for (let i = 0; i < orgCount; i++) {
            const org = visibleOrgs[i];
            const visuals = AppearanceMapper.getVisuals(org);

            // Cached HSL parse (colors are static per organism)
            let rgb = this.colorCache.get(org.id);
            if (!rgb) {
                rgb = WebGLRenderer.parseHSL(visuals.primaryColor);
                this.colorCache.set(org.id, rgb);
            }
            const [r, g, b] = rgb;
            const pixSize = UNIT_UTILS.cmToPx(org.expressedStats.size);

            const b0 = i * 4;
            orgData[b0] = org.position.x; orgData[b0 + 1] = org.position.y;
            orgData[b0 + 2] = pixSize * 0.4; orgData[b0 + 3] = pixSize * 0.2;

            const b1 = (1024 + i) * 4;
            orgData[b1] = r; orgData[b1 + 1] = g; orgData[b1 + 2] = b; orgData[b1 + 3] = parseFloat(org.id);

            const b2 = (2048 + i) * 4;
            orgData[b2] = org.velocity.x; orgData[b2 + 1] = org.velocity.y;
            orgData[b2 + 2] = org.expressedStats.sight_fov; orgData[b2 + 3] = org.id === params.selectedId ? 1.0 : 0.0;

            const b3 = (3072 + i) * 4;
            orgData[b3] = (org.bending || 0) * visuals.skeletalRigidity;
            // O(1) mate index lookup
            let mateIdx = -1.0;
            if (org.matingTimer && org.matingTimer > 0 && org.matingTargetId) {
                const mi = idToIdx.get(org.matingTargetId);
                if (mi !== undefined) mateIdx = mi;
            }
            orgData[b3 + 1] = mateIdx;
            orgData[b3 + 2] = UNIT_UTILS.mToPx(org.expressedStats.sight_range);
            orgData[b3 + 3] = UNIT_UTILS.mToPx(org.expressedStats.audible_range || 3.0);

            const b4 = (4096 + i) * 4;
            orgData[b4] = UNIT_UTILS.mToPx(org.expressedStats.communicating_range || 1.5);
            orgData[b4 + 1] = visuals.appearanceType;
            orgData[b4 + 2] = visuals.glowIntensity;

            // Pack turn force (CPU-side cross product of prev vs current velocity)
            const prev = this.prevVelocities.get(org.id);
            if (prev) {
                orgData[b4 + 3] = prev.x * org.velocity.y - prev.y * org.velocity.x;
            } else {
                orgData[b4 + 3] = 0.0;
            }
        }

        // Update prevVelocities for next frame
        for (let i = 0; i < orgCount; i++) {
            const org = visibleOrgs[i];
            this.prevVelocities.set(org.id, { x: org.velocity.x, y: org.velocity.y });
        }
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.orgTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1024, 5, gl.RGBA, gl.FLOAT, orgData);

        // 3. Pack Flora Data (reuse buffer)
        const floraData = this.floraDataBuffer;
        floraData.fill(0);
        const floraCount = Math.min(visibleFlora.length, 1024);
        for (let i = 0; i < floraCount; i++) {
            const f = visibleFlora[i];
            const base = i * 4;
            floraData[base] = f.position.x; floraData[base + 1] = f.position.y;
            floraData[base + 2] = f.growthState; floraData[base + 3] = f.complexity;

            const colorBase = (1024 + i) * 4;
            const hsl = WebGLRenderer.parseHSL(f.color);
            floraData[colorBase] = hsl[0]; floraData[colorBase + 1] = hsl[1];
            floraData[colorBase + 2] = hsl[2]; floraData[colorBase + 3] = parseFloat(f.id);
        }
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.floraTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1024, 2, gl.RGBA, gl.FLOAT, floraData);

        // 4. Pass 1: Terrain & Fauna
        gl.useProgram(this.program);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.orgTexture);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.terrainTexture);

        const setU1 = (p: WebGLProgram, n: string, v: number) => gl.uniform1f(gl.getUniformLocation(p, n), v);
        const setU2 = (p: WebGLProgram, n: string, x: number, y: number) => gl.uniform2f(gl.getUniformLocation(p, n), x, y);
        const setUniforms = (p: WebGLProgram) => {
            setU2(p, 'u_logicalResolution', params.logicalResolution[0], params.logicalResolution[1]);
            setU2(p, 'u_cameraOffset', params.cameraOffset[0], params.cameraOffset[1]);
            setU1(p, 'u_zoom', params.zoom);
            setU1(p, 'u_time', params.time / (SIM_CONSTANTS.FPS || 60));
            setU1(p, 'u_selectedId', params.selectedId ? parseFloat(params.selectedId) : -1);
            setU1(p, 'u_hoveredId', params.hoveredId ? parseFloat(params.hoveredId) : -1);
        };

        setUniforms(this.program);
        setU2(this.program, 'u_resolution', params.resolution[0], params.resolution[1]);
        setU2(this.program, 'u_worldSize', params.worldSize[0], params.worldSize[1]);
        setU1(this.program, 'u_showVision', params.showVision ? 1.0 : 0.0);
        setU1(this.program, 'u_showHearing', params.showHearing ? 1.0 : 0.0);
        setU1(this.program, 'u_showCommunication', params.showCommunication ? 1.0 : 0.0);
        setU1(this.program, 'u_showGrid', params.showGrid ? 1.0 : 0.0);
        gl.uniform1i(gl.getUniformLocation(this.program, "u_orgTexture"), 0);
        gl.uniform1i(gl.getUniformLocation(this.program, "u_terrainTexture"), 1);
        gl.uniform1i(gl.getUniformLocation(this.program, "u_orgCount"), orgCount);

        const selected = params.organisms.find(o => o.id === params.selectedId);
        const hovered = params.organisms.find(o => o.id === params.hoveredId);
        setU2(this.program, "u_selectedPos", selected ? selected.position.x : -1000, selected ? selected.position.y : -1000);
        setU1(this.program, "u_selectedSize", selected ? UNIT_UTILS.cmToPx(selected.expressedStats.size) * 0.5 : 0);
        setU2(this.program, "u_hoveredPos", hovered ? hovered.position.x : -1000, hovered ? hovered.position.y : -1000);
        setU1(this.program, "u_hoveredSize", hovered ? UNIT_UTILS.cmToPx(hovered.expressedStats.size) * 0.5 : 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        const pLoc = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(pLoc); gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // 5. Pass 2: Instanced Fauna
        gl.enable(gl.BLEND);
        // Use ONE, ONE_MINUS_SRC_ALPHA for premultiplied / additive glow + opaque body
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(this.faunaProgram);
        setUniforms(this.faunaProgram);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.orgTexture);
        gl.uniform1i(gl.getUniformLocation(this.faunaProgram, "u_orgTexture"), 0);
        setU1(this.faunaProgram, 'u_showVision', params.showVision ? 1.0 : 0.0);
        setU1(this.faunaProgram, 'u_showHearing', params.showHearing ? 1.0 : 0.0);
        setU1(this.faunaProgram, 'u_showCommunication', params.showCommunication ? 1.0 : 0.0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.faunaUnitQuadBuffer);
        const faunaUnitPLoc = gl.getAttribLocation(this.faunaProgram, 'a_unitPosition');
        gl.enableVertexAttribArray(faunaUnitPLoc); gl.vertexAttribPointer(faunaUnitPLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceIDBuffer);
        const faunaIDLoc = gl.getAttribLocation(this.faunaProgram, 'a_instanceID');
        gl.enableVertexAttribArray(faunaIDLoc); gl.vertexAttribIPointer(faunaIDLoc, 1, gl.INT, 0, 0);
        gl.vertexAttribDivisor(faunaIDLoc, 1);

        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, orgCount);

        // 6. Pass 3: Instanced Flora
        gl.useProgram(this.floraProgram);
        setUniforms(this.floraProgram);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.floraTexture);
        gl.uniform1i(gl.getUniformLocation(this.floraProgram, "u_floraTexture"), 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.floraUnitQuadBuffer);
        const unitPLoc = gl.getAttribLocation(this.floraProgram, 'a_unitPosition');
        gl.enableVertexAttribArray(unitPLoc); gl.vertexAttribPointer(unitPLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceIDBuffer);
        const idLoc = gl.getAttribLocation(this.floraProgram, 'a_instanceID');
        gl.enableVertexAttribArray(idLoc); gl.vertexAttribIPointer(idLoc, 1, gl.INT, 0, 0);
        gl.vertexAttribDivisor(idLoc, 1);

        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, floraCount);
        gl.disableVertexAttribArray(idLoc);
        gl.vertexAttribDivisor(idLoc, 0);
        gl.disable(gl.BLEND);
    }
}
