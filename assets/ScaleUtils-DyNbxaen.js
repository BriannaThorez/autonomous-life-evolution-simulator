const e=`\r
export const ScaleUtils = {\r
    /**\r
     * Calculates the factor needed to neutralize browser zoom (window.devicePixelRatio).\r
     * This keeps the GUI at a consistent physical size regardless of browser scaling.\r
     */\r
    getNeutralizationFactor: () => {\r
        return 1 / (window.devicePixelRatio || 1);\r
    },\r
\r
    /**\r
     * Returns an ideal scale multiplier based on display resolution.\r
     * Tries to find a 'sweet spot' for readability.\r
     */\r
    getIdealInitialScale: () => {\r
        // To match standard Chrome text size when neutralization is ON:\r
        // Final scale = guiScale * (1/devicePixelRatio)\r
        // We want Final scale to be 1.0 (Standard CSS size)\r
        // So: guiScale = devicePixelRatio\r
        return window.devicePixelRatio || 1.0;\r
    },\r
\r
    /**\r
     * Intelligent capping logic to prevent overlapping or tiny text.\r
     */\r
    getScaleBounds: (currentWidth: number) => {\r
        // Minimum: Don't let 10px fonts drop below effective 8px\r
        const min = Math.max(0.6, 800 / currentWidth);\r
\r
        // Maximum: Don't let HUD elements take up more than 35% of the screen width\r
        const max = Math.min(2.0, currentWidth / 1400);\r
\r
        return { min: Math.min(min, 1.0), max: Math.max(max, 1.2) };\r
    }\r
};\r
`;export{e as default};
