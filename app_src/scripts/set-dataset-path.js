#!/usr/bin/env node

/**
 * Script to set custom dataset path for local development
 * Usage: node scripts/set-dataset-path.js /path/to/dataset.jsonl
 */

const fs = require("fs")
const path = require("path")

const args = process.argv.slice(2)

if (args.length === 0) {
    console.log("Usage: node scripts/set-dataset-path.js /path/to/dataset.jsonl")
    console.log("\nExample:")
    console.log("  node scripts/set-dataset-path.js /users/numaan.naeem/data/test.jsonl")
    process.exit(1)
}

const datasetPath = args[0]

// Validate path
if (!fs.existsSync(datasetPath)) {
    console.error(`Error: File not found: ${datasetPath}`)
    process.exit(1)
}

// Check file extension
if (!datasetPath.endsWith(".json") && !datasetPath.endsWith(".jsonl")) {
    console.error("Error: Dataset must be a .json or .jsonl file")
    process.exit(1)
}

// Create or update .env.local
const envPath = path.join(process.cwd(), ".env.local")
let envContent = ""

if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8")
}

// Remove existing DATASET_PATH if present
const lines = envContent.split("\n").filter((line) => !line.startsWith("DATASET_PATH="))

// Add new DATASET_PATH
lines.push(`DATASET_PATH="${datasetPath}"`)

// Write back
fs.writeFileSync(envPath, lines.join("\n"))

console.log(`✅ Dataset path set to: ${datasetPath}`)
console.log(`📝 Updated .env.local`)
console.log(`\nYou can now run: npm run dev`)
