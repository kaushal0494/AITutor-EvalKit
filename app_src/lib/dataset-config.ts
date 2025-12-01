
/**
 * Dataset Configuration Module
 * Handles dataset path configuration for both default and custom datasets
 * Supports separate datasets for evaluation tabs and visualization tab
 */

/**
 * Dataset Configuration Module
 * Handles dataset path configuration for both default and custom datasets
 * Supports separate datasets for evaluation tabs and visualization tab
 */

import * as fs from "fs"
import * as path from "path"

export interface DatasetConfig {
    datasetPath: string
    isDefault: boolean
}

const EVALUATION_DATASET = path.join(process.cwd(), "data", "sample_mrbench_out_10examples.json")
const VISUALIZATION_DATASET = path.join(process.cwd(), "data", "bea_dataset_train.json")

const POSSIBLE_DEFAULT_DATASETS = [
    EVALUATION_DATASET,
    VISUALIZATION_DATASET,
    path.join(process.cwd(), "data", "sample_dataset.json"),
]

/**
 * Find the first existing dataset file from the list of possible defaults
 */
function findDefaultDataset(): string {
    console.log("[Dataset Config] Checking for dataset files:")
    for (const datasetPath of POSSIBLE_DEFAULT_DATASETS) {
        const exists = fs.existsSync(datasetPath)
        console.log(`  - ${datasetPath}: ${exists ? "EXISTS" : "NOT FOUND"}`)
        if (exists) {
            return datasetPath
        }
    }
    console.log("[Dataset Config] No dataset files found, using fallback")
    return POSSIBLE_DEFAULT_DATASETS[0]
}

/**
 * Get the configured dataset path based on context
 * @param context - 'evaluation' for autoeval/llmeval tabs, 'visualization' for visualization tab
 * Priority: Environment variable > Context-specific default > First existing default file
 */
export function getDatasetPath(context: "evaluation" | "visualization" = "evaluation"): string {
    // Check if custom path is set via environment variable
    const customPath = process.env.DATASET_PATH

    if (customPath) {
        console.log(`[Dataset Config] Using custom dataset: ${customPath}`)
        return customPath
    }

    // Use context-specific dataset
    const contextDataset = context === "visualization" ? VISUALIZATION_DATASET : EVALUATION_DATASET

    const contextExists = fs.existsSync(contextDataset)
    console.log(`[Dataset Config] Checking ${context} dataset: ${contextDataset}`)
    console.log(`[Dataset Config] File exists: ${contextExists}`)

    if (contextExists) {
        console.log(`[Dataset Config] Using ${context} dataset: ${contextDataset}`)
        return contextDataset
    }

    // Fallback to first existing default
    const defaultPath = findDefaultDataset()
    console.log(`[Dataset Config] Using fallback dataset: ${defaultPath}`)
    return defaultPath
}

/**
 * Validate dataset structure
 * Ensures the dataset follows the expected format
 */
export interface DatasetItem {
    // Support both old and new field names
    id?: string
    conversation_id?: string
    problem_topic?: string
    Problem_topic?: string
    conversation?: any[]
    conversation_history?: string
    tutor_responses?: {
        [tutorName: string]: {
            response?: string
            annotation?: {
                [dimension: string]: string | number
            }
        }
    }
    tutors?: {
        [tutorName: string]: {
            annotation?: {
                [dimension: string]: string | number
            }
            auto_annotations?: {
                [dimension: string]: string | number
            }
            llm_annotations?: {
                [dimension: string]: number
            }
        }
    }
    anno_llm_responses?: {
        [tutorName: string]: {
            annotation?: {
                [dimension: string]: string | number
            }
            auto_annotation?: {
                [dimension: string]: string | number
            }
            llm_annotation?: {
                [dimension: string]: number
            }
        }
    }
}

export function validateDataset(data: any[]): { valid: boolean; error?: string } {
    if (!Array.isArray(data)) {
        return { valid: false, error: "Dataset must be an array" }
    }

    if (data.length === 0) {
        return { valid: false, error: "Dataset cannot be empty" }
    }

    // Check first item structure
    const firstItem = data[0]

    // Check for ID field (either 'id' or 'conversation_id')
    if (!firstItem.id && !firstItem.conversation_id) {
        return { valid: false, error: "Each item must have an 'id' or 'conversation_id' field" }
    }

    // Check for problem topic field (either 'problem_topic' or 'Problem_topic') - optional
    // if (!firstItem.problem_topic && !firstItem.Problem_topic) {
    //   return { valid: false, error: "Each item must have a 'problem_topic' or 'Problem_topic' field" }
    // }

    // Check for tutors/responses field (either 'tutors', 'tutor_responses', or 'anno_llm_responses')
    if (!firstItem.tutors && !firstItem.tutor_responses && !firstItem.anno_llm_responses) {
        return {
            valid: false,
            error: "Each item must have a 'tutors', 'tutor_responses', or 'anno_llm_responses' field",
        }
    }

    const tutorsField = firstItem.tutor_responses || firstItem.tutors || firstItem.anno_llm_responses
    if (typeof tutorsField !== "object") {
        return { valid: false, error: "Tutors/responses field must be an object" }
    }

    return { valid: true }
}

/**
 * Load and validate dataset from file
 * @param context - 'evaluation' or 'visualization' to determine which dataset to load
 */
export async function loadDataset(
    context: "evaluation" | "visualization" = "evaluation",
): Promise<{ data: any[]; error?: string }> {
    const filePath = getDatasetPath(context)

    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return { data: [], error: `Dataset file not found: ${filePath}` }
        }

        // Read file
        const fileContent = fs.readFileSync(filePath, "utf-8")

        // Parse based on file extension
        let data: any[]

        if (filePath.endsWith(".jsonl")) {
            // Parse JSONL (one JSON object per line)
            data = fileContent
                .split("\n")
                .filter((line) => line.trim())
                .map((line) => JSON.parse(line))
        } else if (filePath.endsWith(".json")) {
            // Parse JSON
            const parsed = JSON.parse(fileContent)
            data = Array.isArray(parsed) ? parsed : [parsed]
        } else {
            return { data: [], error: "Unsupported file format. Use .json or .jsonl" }
        }

        // Validate dataset structure
        const validation = validateDataset(data)
        if (!validation.valid) {
            return { data: [], error: validation.error }
        }

        console.log(`[Dataset Config] Successfully loaded ${data.length} items from ${filePath} (${context})`)
        return { data }
    } catch (error) {
        console.error("[Dataset Config] Error loading dataset:", error)
        return {
            data: [],
            error: error instanceof Error ? error.message : "Failed to load dataset",
        }
    }
}

/**
 * Get dataset configuration info
 */
export function getDatasetInfo(context: "evaluation" | "visualization" = "evaluation"): DatasetConfig {
    const datasetPath = getDatasetPath(context)
    const isDefault = POSSIBLE_DEFAULT_DATASETS.includes(datasetPath)

    return {
        datasetPath,
        isDefault,
    }
}
