"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderOpen, FileText, ChevronRight, Home } from "lucide-react"

interface FileBrowserProps {
    onFileSelect: (filePath: string) => void
    currentPath?: string
}

interface FileItem {
    name: string
    path: string
    isFile: boolean
}

export function FileBrowser({ onFileSelect, currentPath = "" }: FileBrowserProps) {
    const [directory, setDirectory] = useState<string>(currentPath || "/")
    const [files, setFiles] = useState<FileItem[]>([])
    const [directories, setDirectories] = useState<FileItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string>("")

    const loadDirectory = useCallback(async (dirPath: string) => {
        setIsLoading(true)
        setError("")

        try {
            const response = await fetch("/api/list-files", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ directory: dirPath }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to load directory")
            }

            const data = await response.json()
            setFiles(data.jsonFiles || [])
            setDirectories(data.directories || [])
            setDirectory(dirPath)
        } catch (error) {
            console.error("Error loading directory:", error)
            setError(error instanceof Error ? error.message : "Failed to load directory")
        } finally {
            setIsLoading(false)
        }
    }, [])

    const handleDirectoryChange = useCallback(
        (newPath: string) => {
            loadDirectory(newPath)
        },
        [loadDirectory],
    )

    const handleFileSelect = useCallback(
        (filePath: string) => {
            onFileSelect(filePath)
        },
        [onFileSelect],
    )

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    File Browser
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Directory Input */}
                <div className="flex gap-2">
                    <Input
                        value={directory}
                        onChange={(e) => setDirectory(e.target.value)}
                        placeholder="/path/to/directory"
                        className="flex-1"
                    />
                    <Button onClick={() => loadDirectory(directory)} disabled={isLoading} className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" />
                        {isLoading ? "Loading..." : "Browse"}
                    </Button>
                </div>

                {/* Quick Navigation */}
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDirectoryChange("/")}
                        className="flex items-center gap-1"
                    >
                        <Home className="w-3 h-3" />
                        Root
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDirectoryChange("/home")}
                        className="flex items-center gap-1"
                    >
                        <FolderOpen className="w-3 h-3" />
                        Home
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDirectoryChange("/l/users/numaan.naeem/BEA_PAPERS")}
                        className="flex items-center gap-1"
                    >
                        <FolderOpen className="w-3 h-3" />
                        BEA Papers
                    </Button>
                </div>

                {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}

                {/* Directory Contents */}
                {(directories.length > 0 || files.length > 0) && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {/* Directories */}
                        {directories.map((dir) => (
                            <div
                                key={dir.path}
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                onClick={() => handleDirectoryChange(dir.path)}
                            >
                                <FolderOpen className="w-4 h-4 text-blue-600" />
                                <span className="flex-1 text-sm">{dir.name}</span>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                        ))}

                        {/* JSON Files */}
                        {files.map((file) => (
                            <div
                                key={file.path}
                                className="flex items-center gap-2 p-2 hover:bg-green-50 rounded cursor-pointer"
                                onClick={() => handleFileSelect(file.path)}
                            >
                                <FileText className="w-4 h-4 text-green-600" />
                                <span className="flex-1 text-sm">{file.name}</span>
                                <Button variant="ghost" size="sm" className="text-xs">
                                    Select
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && directories.length === 0 && files.length === 0 && directory && (
                    <div className="text-center py-4 text-gray-500 text-sm">No JSON files found in this directory</div>
                )}
            </CardContent>
        </Card>
    )
}
