import { promises as fs } from "fs"
import path from "path"

// Use process.cwd() to get the current working directory in production
const DATASET_FILE_PATH = path.join(process.cwd(), "data", "sample_mrbench_out_10_examples.json")

export interface DatasetResult {
    success: boolean
    data?: any[]
    filePath?: string
    size?: number
    itemCount?: number
    error?: string
}

export async function loadBackendDataset(): Promise<DatasetResult> {
    try {
        console.log("🔍 Attempting to load dataset from:", DATASET_FILE_PATH)

        // Check if file exists
        try {
            await fs.access(DATASET_FILE_PATH)
        } catch (accessError) {
            throw new Error(`Dataset file not found at: ${DATASET_FILE_PATH}`)
        }

        // Read the file
        const fileContent = await fs.readFile(DATASET_FILE_PATH, "utf-8")
        const stats = await fs.stat(DATASET_FILE_PATH)

        // Parse JSON
        let jsonData: any[]
        try {
            jsonData = JSON.parse(fileContent)
        } catch (parseError) {
            throw new Error("Invalid JSON format in dataset file")
        }

        if (!Array.isArray(jsonData)) {
            throw new Error("Dataset must be an array")
        }

        if (jsonData.length === 0) {
            throw new Error("Dataset is empty")
        }

        // Validate dataset structure
        const firstItem = jsonData[0]
        if (!firstItem || typeof firstItem !== "object") {
            throw new Error("Invalid dataset format: items must be objects")
        }

        console.log(`✅ Dataset loaded successfully: ${jsonData.length} items`)
        return {
            success: true,
            data: jsonData,
            filePath: DATASET_FILE_PATH,
            size: stats.size,
            itemCount: jsonData.length,
        }
    } catch (error) {
        console.error("❌ Error loading dataset:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}
