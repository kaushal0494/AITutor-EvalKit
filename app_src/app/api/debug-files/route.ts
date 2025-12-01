import { promises as fs } from "fs"
import path from "path"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const projectRoot = process.cwd()
        const dataDir = path.join(projectRoot, "data")

        console.log("Project root:", projectRoot)
        console.log("Data directory:", dataDir)

        // Check if data directory exists
        let dataExists = false
        let files: string[] = []

        try {
            await fs.access(dataDir)
            dataExists = true
            files = await fs.readdir(dataDir)
        } catch (error) {
            console.log("Data directory doesn't exist")
        }

        // List all files in project root
        const rootFiles = await fs.readdir(projectRoot)

        return NextResponse.json({
            projectRoot,
            dataDir,
            dataExists,
            filesInData: files,
            filesInRoot: rootFiles,
        })
    } catch (error) {
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Unknown error",
        })
    }
}
