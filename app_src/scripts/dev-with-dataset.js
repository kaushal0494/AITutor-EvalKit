// #!/usr/bin/env node

/**
 * Development script with custom dataset path support
 * Usage: npm run dev:custom /path/to/dataset.json
 * Or: npm run dev:custom (uses default dataset)
 */

const { spawn } = require("child_process")
const fs = require("fs")
const path = require("path")

const args = process.argv.slice(2)

if (args.length > 0) {
    const datasetPath = args[0]

    // Validate path
    if (!fs.existsSync(datasetPath)) {
        console.error(`❌ Error: File not found: ${datasetPath}`)
        process.exit(1)
    }

    // Check file extension
    if (!datasetPath.endsWith(".json") && !datasetPath.endsWith(".jsonl")) {
        console.error("❌ Error: Dataset must be a .json or .jsonl file")
        process.exit(1)
    }

    console.log(`✅ Using custom dataset: ${datasetPath}`)
    console.log(`🔒 Custom mode enabled - feedback collection disabled`)

    const env = {
        ...process.env,
        DATASET_PATH: datasetPath,
        NEXT_PUBLIC_IS_CUSTOM_MODE: "true",
    }

    const devProcess = spawn("npm", ["run", "dev"], {
        stdio: "inherit",
        env,
        shell: true,
    })

    devProcess.on("error", (error) => {
        console.error("❌ Failed to start dev server:", error)
        process.exit(1)
    })

    devProcess.on("exit", (code) => {
        process.exit(code || 0)
    })
} else {
    console.log("📊 Using default dataset")
    console.log("💡 Tip: To use a custom dataset, run: npm run dev:custom /path/to/dataset.json")

    // Start dev server without custom dataset
    const devProcess = spawn("npm", ["run", "dev"], {
        stdio: "inherit",
        shell: true,
    })

    devProcess.on("error", (error) => {
        console.error("❌ Failed to start dev server:", error)
        process.exit(1)
    })

    devProcess.on("exit", (code) => {
        process.exit(code || 0)
    })
}
