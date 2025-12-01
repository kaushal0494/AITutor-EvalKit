// Dimension configuration for consistent ordering and abbreviations
export const DIMENSION_CONFIG = {
    // Ordered list of dimensions (this order will be used everywhere)
    ORDERED_DIMENSIONS: [
        "Mistake_Identification", // MI - 1st
        "Mistake_Location", // ML - 2nd
        "Providing_Guidance", // PG - 3rd
        "Actionability", // AC - 4th
        "Revealing_of_the_Answer",
        "Coherence",
        "Tutor_Tone",
        "Humanlikeness",
    ],

    // Dimension abbreviations for spider plots
    ABBREVIATIONS: {
        Mistake_Identification: "MI",
        Mistake_Location: "ML",
        Revealing_of_the_Answer: "RA",
        Providing_Guidance: "PG",
        Actionability: "AC",
        Coherence: "CO",
        Tutor_Tone: "TT",
        Humanlikeness: "HL",
    },

    // Full display names
    DISPLAY_NAMES: {
        Mistake_Identification: "Mistake Identification",
        Mistake_Location: "Mistake Location",
        Revealing_of_the_Answer: "Revealing Answer",
        Providing_Guidance: "Providing Guidance",
        Actionability: "Actionability",
        Coherence: "Coherence",
        Tutor_Tone: "Tutor Tone",
        Humanlikeness: "Humanlikeness",
    },

    // Descriptions for tooltips/help text
    DESCRIPTIONS: {
        Mistake_Identification: "Whether the tutor identifies student mistakes",
        Mistake_Location: "Whether the tutor locates where the mistake occurred",
        Revealing_of_the_Answer: "Whether the tutor reveals the correct answer",
        Providing_Guidance: "Whether the tutor provides helpful guidance",
        Actionability: "Whether the feedback is actionable for the student",
        Coherence: "How coherent and logical the response is",
        Tutor_Tone: "The tone of the tutor's response",
        Humanlikeness: "How human-like the tutor response sounds",
    },
}

// Helper functions
export function getDimensionAbbreviation(dimension: string): string {
    return DIMENSION_CONFIG.ABBREVIATIONS[dimension as keyof typeof DIMENSION_CONFIG.ABBREVIATIONS] || dimension
}

export function getDimensionDisplayName(dimension: string): string {
    return DIMENSION_CONFIG.DISPLAY_NAMES[dimension as keyof typeof DIMENSION_CONFIG.DISPLAY_NAMES] || dimension
}

export function getDimensionDescription(dimension: string): string {
    return DIMENSION_CONFIG.DESCRIPTIONS[dimension as keyof typeof DIMENSION_CONFIG.DESCRIPTIONS] || ""
}

export function getOrderedDimensions(availableDimensions: string[]): string[] {
    // Filter and order dimensions based on the predefined order
    return DIMENSION_CONFIG.ORDERED_DIMENSIONS.filter((dim) => availableDimensions.includes(dim))
}
