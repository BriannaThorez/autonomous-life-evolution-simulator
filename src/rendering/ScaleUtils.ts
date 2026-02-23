
export const ScaleUtils = {
    /**
     * Calculates the factor needed to neutralize browser zoom (window.devicePixelRatio).
     * This keeps the GUI at a consistent physical size regardless of browser scaling.
     */
    getNeutralizationFactor: () => {
        return 1 / (window.devicePixelRatio || 1);
    },

    /**
     * Returns an ideal scale multiplier based on display resolution.
     * Tries to find a 'sweet spot' for readability.
     */
    getIdealInitialScale: () => {
        // To match standard Chrome text size when neutralization is ON:
        // Final scale = guiScale * (1/devicePixelRatio)
        // We want Final scale to be 1.0 (Standard CSS size)
        // So: guiScale = devicePixelRatio
        return window.devicePixelRatio || 1.0;
    },

    /**
     * Intelligent capping logic to prevent overlapping or tiny text.
     */
    getScaleBounds: (currentWidth: number) => {
        // Minimum: Don't let 10px fonts drop below effective 8px
        const min = Math.max(0.6, 800 / currentWidth);

        // Maximum: Don't let HUD elements take up more than 35% of the screen width
        const max = Math.min(2.0, currentWidth / 1400);

        return { min: Math.min(min, 1.0), max: Math.max(max, 1.2) };
    }
};
