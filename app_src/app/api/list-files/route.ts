import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function POST(request: NextRequest) {
    try {
        const { directory } = await request.json()

        if (!directory) {
            return NextResponse.json({ error: "Directory path is required" }, { status: 400 })
        }

        console.log(`📂 Listing files in directory: ${directory}`)

        // Security check - prevent directory traversal attacks
        const normalizedPath = path.normalize(directory)
        if (normalizedPath.includes("..")) {
            return NextResponse.json({ error: "Invalid directory path" }, { status: 400 })
        }

        // Check if directory exists and is readable
        try {
            await fs.access(normalizedPath, fs.constants.R_OK)
        } catch (error) {
            console.error(`Directory access error: ${error}`)
            return NextResponse.json({ error: `Directory not found or not readable: ${normalizedPath}` }, { status: 404 })
        }

        // Read directory contents
        try {
            const files = await fs.readdir(normalizedPath, { withFileTypes: true })

            const jsonFiles = files
                .filter((file) => file.isFile() && file.name.endsWith(".json"))
                .map((file) => ({
                    name: file.name,
                    path: path.join(normalizedPath, file.name),
                    isFile: true,
                }))

            const directories = files
                .filter((file) => file.isDirectory())
                .map((file) => ({
                    name: file.name,
                    path: path.join(normalizedPath, file.name),
                    isFile: false,
                }))

            console.log(`✅ Found ${jsonFiles.length} JSON files and ${directories.length} directories`)

            return NextResponse.json({
                success: true,
                directory: normalizedPath,
                jsonFiles,
                directories,
                totalFiles: jsonFiles.length,
                totalDirectories: directories.length,
            })
        } catch (readError) {
            console.error(`Directory read error: ${readError}`)
            return NextResponse.json({ error: "Failed to read directory contents" }, { status: 500 })
        }
    } catch (error) {
        console.error("List files API error:", error)
        return NextResponse.json({ error: "Failed to list files" }, { status: 500 })
    }
}
