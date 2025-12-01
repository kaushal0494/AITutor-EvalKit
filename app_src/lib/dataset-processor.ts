interface DatasetItem {
    conversation_id: string
    conversation_history: string
    Data: string
    Split: string
    Topic: string
    Ground_Truth_Solution: string
    anno_llm_responses: {
        [model: string]: {
            response: string
            annotation: {
                [dimension: string]: string // "Yes", "No", "To some extent", "Neutral", "Offensive", "Encouraging"
            }
            auto_annotation?: {
                [key: string]: number
            }
            llm_annotation?: {
                [key: string]: number | null
            }
        }
    }
}

interface ProcessedScores {
    [model: string]: {
        [dimension: string]: number[]
    }
}

export class DatasetProcessor {
    private data: DatasetItem[]

    constructor(data: DatasetItem[]) {
        this.data = data
    }

    // Convert annotation values to numerical scores
    private convertAnnotationToScore(value: string, dimension: string): number {
        // Handle Tutor_Tone specifically
        if (dimension === "Tutor_Tone") {
            switch (value.toLowerCase()) {
                case "neutral":
                    return 0.5
                case "encouraging":
                    return 1.0
                case "offensive":
                    return 0.0
                default:
                    return 0.5
            }
        }

        // Handle other dimensions
        switch (value) {
            case "Yes":
                return 1.0
            case "No":
                return 0.0
            case "To some extent":
                return 0.5
            default:
                return 0.5 // Default for unknown values
        }
    }

    // Extract human evaluation scores
    getHumanScores(): ProcessedScores {
        const scores: ProcessedScores = {}

        this.data.forEach((item) => {
            // Add null/undefined check
            if (!item.anno_llm_responses || typeof item.anno_llm_responses !== "object") {
                return // Skip this item
            }

            Object.entries(item.anno_llm_responses).forEach(([model, response]) => {
                // Add null check for response and annotation
                if (!response || !response.annotation || typeof response.annotation !== "object") {
                    return // Skip this response
                }

                if (!scores[model]) scores[model] = {}

                Object.entries(response.annotation).forEach(([dimension, value]) => {
                    if (!scores[model][dimension]) scores[model][dimension] = []
                    // Convert annotation values to scores using the new method
                    const score = this.convertAnnotationToScore(value, dimension)
                    scores[model][dimension].push(score)
                })
            })
        })

        return scores
    }

    // Extract automated evaluation scores
    getAutoScores(): ProcessedScores {
        const scores: ProcessedScores = {}

        this.data.forEach((item) => {
            // Add null/undefined check
            if (!item.anno_llm_responses || typeof item.anno_llm_responses !== "object") {
                return // Skip this item
            }

            Object.entries(item.anno_llm_responses).forEach(([model, response]) => {
                // Add null check for response and auto_annotation
                if (!response || !response.auto_annotation || typeof response.auto_annotation !== "object") {
                    return // Skip this response
                }

                if (!scores[model]) scores[model] = {}

                Object.entries(response.auto_annotation).forEach(([key, value]) => {
                    if (typeof value !== "number") return

                    // Clean up dimension names by removing suffixes
                    const dimension = key
                        .replace("_Heuristic", "")
                        .replace("_BERT", "")
                        .replace("_NLI", "")
                        .replace("_FTRoBERTa", "")
                        .replace("_OGPT2", "")
                        .replace("_Uptake", "")

                    if (!scores[model][dimension]) scores[model][dimension] = []
                    scores[model][dimension].push(value)
                })
            })
        })

        return scores
    }

    // Extract LLM evaluation scores
    getLLMScores(): ProcessedScores {
        const scores: ProcessedScores = {}

        this.data.forEach((item) => {
            // Add null/undefined check
            if (!item.anno_llm_responses || typeof item.anno_llm_responses !== "object") {
                return // Skip this item
            }

            Object.entries(item.anno_llm_responses).forEach(([model, response]) => {
                // Add null check for response and llm_annotation
                if (!response || !response.llm_annotation || typeof response.llm_annotation !== "object") {
                    return // Skip this response
                }

                if (!scores[model]) scores[model] = {}

                Object.entries(response.llm_annotation).forEach(([key, value]) => {
                    if (typeof value !== "number" || value === null) return

                    // Extract dimension name by removing the evaluator model suffix
                    const parts = key.split("_")
                    let dimension = key

                    // Remove common LLM model suffixes
                    if (key.includes("prometheus-eval/prometheus-7b-v2.0")) {
                        dimension = key.replace("_prometheus-eval/prometheus-7b-v2.0", "")
                    } else if (key.includes("meta-llama/Meta-Llama-3.1-8B-Instruct")) {
                        dimension = key.replace("_meta-llama/Meta-Llama-3.1-8B-Instruct", "")
                    }

                    if (!scores[model][dimension]) scores[model][dimension] = []
                    // Normalize LLM scores (assuming they're on a 1-3 scale)
                    const normalizedScore = Math.max(0, Math.min(1, (value - 1) / 2))
                    scores[model][dimension].push(normalizedScore)
                })
            })
        })

        return scores
    }

    // Get average scores for visualization
    getAverageScores(evaluationType: "human" | "auto" | "llm"): { [model: string]: { [dimension: string]: number } } {
        let scores: ProcessedScores

        switch (evaluationType) {
            case "human":
                scores = this.getHumanScores()
                break
            case "auto":
                scores = this.getAutoScores()
                break
            case "llm":
                scores = this.getLLMScores()
                break
        }

        const averageScores: { [model: string]: { [dimension: string]: number } } = {}

        Object.entries(scores).forEach(([model, dimensions]) => {
            averageScores[model] = {}
            Object.entries(dimensions).forEach(([dimension, values]) => {
                const validValues = values.filter((v) => v !== null && !isNaN(v))
                averageScores[model][dimension] =
                    validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0
            })
        })

        return averageScores
    }

    // Get models available in the dataset
    getAvailableModels(): string[] {
        const models = new Set<string>()

        this.data.forEach((item) => {
            // Add null/undefined check
            if (item.anno_llm_responses && typeof item.anno_llm_responses === "object") {
                Object.keys(item.anno_llm_responses).forEach((model) => models.add(model))
            }
        })

        return Array.from(models).sort()
    }

    // Get dimensions available in the dataset
    getAvailableDimensions(): string[] {
        const dimensions = new Set<string>()

        this.data.forEach((item) => {
            // Add null/undefined check
            if (item.anno_llm_responses && typeof item.anno_llm_responses === "object") {
                Object.values(item.anno_llm_responses).forEach((response) => {
                    // Add null check for response and annotation
                    if (response && response.annotation && typeof response.annotation === "object") {
                        Object.keys(response.annotation).forEach((dim) => dimensions.add(dim))
                    }
                })
            }
        })

        return Array.from(dimensions).sort()
    }

    // Get dataset statistics
    getDatasetStats() {
        const totalItems = this.data.length
        const validItems = this.data.filter(
            (item) => item.anno_llm_responses && typeof item.anno_llm_responses === "object",
        ).length

        const models = this.getAvailableModels()
        const dimensions = this.getAvailableDimensions()

        // Count responses per model
        const modelResponseCounts: { [model: string]: number } = {}
        models.forEach((model) => {
            modelResponseCounts[model] = this.data.filter(
                (item) => item.anno_llm_responses && item.anno_llm_responses[model] && item.anno_llm_responses[model].response,
            ).length
        })

        // Get unique topics and splits
        const topics = new Set(this.data.map((item) => item.Topic).filter(Boolean))
        const splits = new Set(this.data.map((item) => item.Split).filter(Boolean))

        return {
            totalItems,
            validItems,
            invalidItems: totalItems - validItems,
            models: models.length,
            dimensions: dimensions.length,
            modelsList: models,
            dimensionsList: dimensions,
            modelResponseCounts,
            topics: Array.from(topics),
            splits: Array.from(splits),
            topicsCount: topics.size,
            splitsCount: splits.size,
        }
    }
}
