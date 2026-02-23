#version 300 es
in vec2 a_position;
out vec2 v_texCoord;
void main() {
    v_texCoord = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
// --- SPLIT ---
#version 300 es
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
uniform vec2 u_hoveredPos;
uniform float u_hoveredSize;
uniform float u_hoveredId;
uniform float u_isFollowing;

uniform sampler2D u_orgTexture;
uniform int u_orgCount;

uniform sampler2D u_terrainTexture;

uniform sampler2D u_FloraTexture;
uniform int u_FloraCount;

float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

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
    vec2 fragCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y) * u_logicalResolution;
    vec2 worldCoord = (fragCoord - u_cameraOffset) / u_zoom;
    
    vec2 terrainUV = vec2(worldCoord.x / u_worldSize.x, 1.0 - worldCoord.y / u_worldSize.y);
    vec4 terrainData = texture(u_terrainTexture, terrainUV);
    
    vec3 grassColor = vec3(0.12, 0.25, 0.15);
    vec3 aridColor = vec3(0.25, 0.2, 0.1);
    vec3 cliffColor = vec3(0.1, 0.1, 0.1);
    
    vec3 background;
    if (terrainData.g > 0.8) {
        background = cliffColor;
    } else {
        background = mix(aridColor, grassColor, terrainData.r);
    }
    
    if (worldCoord.x < 0.0 || worldCoord.x > u_worldSize.x || worldCoord.y < 0.0 || worldCoord.y > u_worldSize.y) {
        background = vec3(0.002, 0.004, 0.003);
    }

    vec4 resColor = vec4(background, 1.0); 
    
    vec2 gridUV = fract(worldCoord / 60.0);
    float grid = smoothstep(0.02, 0.0, abs(gridUV.x - 0.5)) + smoothstep(0.02, 0.0, abs(gridUV.y - 0.5));
    resColor.rgb += vec3(0.1, 0.2, 0.15) * grid * 0.2;

    float dOrg = 10000.0;
    vec4 sumOrgColor = vec4(0.0);
    float totalWeight = 0.0;
    float k = 14.0; 

    float lod = u_zoom < 0.45 ? 2.0 : (u_zoom < 0.85 ? 1.0 : 0.0);
    float softness = mix(0.1, 10.0, clamp(1.0 - u_zoom * 1.4, 0.0, 1.0));

    for(int i = 0; i < u_orgCount; i++) {
        float tx = (float(i) + 0.5) / 1024.0;
        vec4 d1 = texture(u_orgTexture, vec2(tx, 0.125));
        vec2 pos = d1.xy;
        float size = d1.z;
        float skeletalLength = d1.w;

        float distToEdge = length(worldCoord - pos) - (size + skeletalLength * 0.4);
        if (distToEdge > 30.0 + softness) continue; 

        vec4 d2 = texture(u_orgTexture, vec2(tx, 0.375)); // col.rgb, id
        vec4 d3 = texture(u_orgTexture, vec2(tx, 0.625)); // vel.xy, fov, isSelected
        vec4 d4 = texture(u_orgTexture, vec2(tx, 0.875)); // bending, isMating
        
        vec2 vel = d3.xy;
        vec3 col = d2.rgb;
        float id = d2.w;
        float isMating = d4.y;
        float isSelected = d3.w;

        float d;
        if (lod >= 2.0) {
            d = sdCircle(worldCoord - pos, size);
        } else {
            float bending = d4.x;
            vec2 dir = length(vel) > 0.001 ? normalize(vel) : vec2(1.0, 0.0);
            vec2 perp = vec2(-dir.y, dir.x);
            vec2 localP = worldCoord - pos;
            float distAlong = dot(localP, dir);
            vec2 warpedP = worldCoord - (perp * bending * 0.02 * distAlong);
            
            vec2 pA = pos + dir * (skeletalLength * 0.35);
            vec2 pB = pos - dir * (skeletalLength * 0.35);
            float r = (size + sin(u_time * 0.15 + id) * 1.5) * (0.95 + 0.05 * sin(u_time * 0.1 + id * 0.5));
            d = sdCapsule(warpedP, pA, pB, r);
        }
        
        float weight = exp(-d * 0.18); 
        sumOrgColor += vec4(col, 1.0) * weight;
        totalWeight += weight;

        float k_local = isMating > 0.5 ? 14.0 : 0.01;
        dOrg = smin(dOrg, d, k_local);

        if (isMating > 0.5) {
            float pulse = 0.5 + 0.5 * sin(u_time * 0.5);
            float dHeart = sdCircle(worldCoord - (pos + vec2(0.0, size * 1.5)), size * 0.4);
            if (dHeart < 0.0) {
                resColor.rgb = mix(resColor.rgb, vec3(1.0, 0.4, 0.6), pulse);
            }
            float dAura = abs(d - 5.0) - 2.0;
            if (dAura < 0.0) {
                resColor.rgb = mix(resColor.rgb, vec3(1.0, 0.5, 0.7), 0.3 * pulse);
            }
        }

        if (lod < 1.0 && d < 15.0) {
            vec2 velDir = length(vel) > 0.001 ? normalize(vel) : vec2(1.0, 0.0);
            vec2 eyeP1 = pos + rotate(vec2(size * 0.75, size * 0.5), velDir);
            vec2 eyeP2 = pos + rotate(vec2(size * 0.75, -size * 0.5), velDir);
            float eyeSize = size * 0.35;
            float dEye = min(sdCircle(worldCoord - eyeP1, eyeSize), sdCircle(worldCoord - eyeP2, eyeSize));
            if (dEye < 0.0) {
                resColor.rgb = mix(resColor.rgb, vec3(1.0), 1.0); 
                float pupilSize = eyeSize * 0.6;
                float dPupil = min(sdCircle(worldCoord - (eyeP1 + velDir * eyeSize * 0.2), pupilSize), 
                                   sdCircle(worldCoord - (eyeP2 + velDir * eyeSize * 0.2), pupilSize));
                if (dPupil < 0.0) resColor.rgb = vec3(0.05);
            }
        }
    }

    if (u_selectedSize > 0.0 || u_hoveredSize > 0.0) {
        if (u_selectedSize > 0.0) {
            vec2 relPos = worldCoord - u_selectedPos;
            float dist = length(relPos);
            float angle = atan(relPos.y, relPos.x);
            float ringPulse = sin(u_time * 0.1 + u_selectedSize) * 1.5;
            float ringSize = u_selectedSize + 16.0 + ringPulse;
            float dash = step(0.4, fract(angle * 8.0 / 6.28318 + u_time * 0.1));
            float dRing = abs(dist - ringSize) - 2.0;
            if (dRing < 4.0) {
                float glow = exp(-abs(dRing) * 1.5);
                resColor.rgb = mix(resColor.rgb, vec3(0.2, 0.8, 1.0), glow * 0.9 * (0.6 + 0.4 * dash));
            }
            float bSize = ringSize + 10.0;
            float bLen = 8.0;
            vec2 aP = abs(relPos);
            float dBox = max(aP.x, aP.y) - bSize;
            if (abs(dBox) < 1.2 && min(aP.x, aP.y) > bSize - bLen) {
                resColor.rgb = mix(resColor.rgb, vec3(1.0, 1.0, 0.4), 1.0);
            }
            if (u_isFollowing > 0.5) {
                float compassDist = bSize + 12.0;
                float dCompass = abs(dist - compassDist) - 1.0;
                float cDash = step(0.92, cos(angle * 4.0 - u_time * 0.2));
                if (dCompass < 0.0) resColor.rgb = mix(resColor.rgb, vec3(1.0, 0.7, 0.1), cDash);
                float dCore = dist - (u_selectedSize * 0.35);
                if (dCore < 0.0) {
                    float coreGlow = 0.4 + 0.3 * sin(u_time * 0.4);
                    resColor.rgb = mix(resColor.rgb, vec3(1.0, 0.6, 0.0), coreGlow);
                }
            }
        }
        if (u_hoveredSize > 0.0) {
            vec2 relPos = worldCoord - u_hoveredPos;
            float dist = length(relPos);
            float ringSize = u_hoveredSize + 16.0;
            float dRing = abs(dist - ringSize) - 0.8;
            if (dRing < 4.0) {
                float angle = atan(relPos.y, relPos.x);
                float dash = step(0.4, fract(angle * 4.0 / 6.28318 + u_time * 0.1));
                float glow = exp(-abs(dRing) * 1.5);
                resColor.rgb = mix(resColor.rgb, vec3(0.6), glow * 0.4 * dash);
            }
        }
    }
    
    if (dOrg < 30.0 + softness) {
        vec4 dynamicColor = totalWeight > 0.0 ? sumOrgColor / totalWeight : vec4(0.0);
        
        // Bioluminescent Refinement: Using centered color instead of white-wash
        float glowIntensity = 1.0; // Base intensity for legacy shader
        float glowFalloff = exp(-max(0.0, dOrg) * (0.2 / (1.0 + softness * 0.1)));
        
        if (dOrg < 0.0) {
            float edge = 1.0 - abs(dOrg) / (6.0 + softness);
            resColor.rgb = mix(resColor.rgb, dynamicColor.rgb, 0.85);
            // Saturated inner highlight instead of pure white
            resColor.rgb += dynamicColor.rgb * pow(clamp(edge, 0.0, 1.0), 3.0) * 0.5;
        } else {
            resColor.rgb += dynamicColor.rgb * glowFalloff * 0.7 * glowIntensity;
        }
        
        if (lod >= 1.0) {
            float grey = dot(resColor.rgb, vec3(0.299, 0.587, 0.114));
            resColor.rgb = mix(resColor.rgb, vec3(grey), 0.15 * softness/10.0);
        }
    }
    
    for(int i = 0; i < u_FloraCount; i++) {
        float tx = (float(i) + 0.5) / 1024.0;
        vec4 d1 = texture(u_FloraTexture, vec2(tx, 0.25));
        vec2 fPos = d1.xy;
        float fSize = d1.z;
        if (length(worldCoord - fPos) > fSize + 15.0) continue;
        vec4 d2 = texture(u_FloraTexture, vec2(tx, 0.75));
        vec4 fCol = vec4(d2.rgb, 1.0);
        float dF = sdCircle(worldCoord - fPos, fSize);
        float pulse = 0.8 + 0.2 * sin(u_time * 0.05 + fPos.x);
        if (dF < 0.0) {
            resColor.rgb = mix(resColor.rgb, fCol.rgb, 0.9 * pulse);
        } else {
            resColor.rgb += fCol.rgb * exp(-dF * 0.6) * 0.5 * pulse;
        }
    }
    outColor = vec4(resColor.rgb, 1.0);
}
