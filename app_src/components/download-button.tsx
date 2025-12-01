"use client"

import type React from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, FileImage, FileJson } from "lucide-react"
import { toPng, toJpeg } from "html-to-image"

interface DownloadButtonProps {
    elementRef: React.RefObject<HTMLElement>
    fileName?: string
    buttonText?: string
    jsonData?: any
    enableJsonExport?: boolean
}

export function DownloadButton({
    elementRef,
    fileName = "evaluation",
    buttonText = "Download Results",
    jsonData,
    enableJsonExport = false,
}: DownloadButtonProps) {
    const downloadImage = async (format: "png" | "jpeg") => {
        if (!elementRef.current) {
            console.error("Element to download not found.")
            return
        }

        try {
            let dataUrl
            const options = { cacheBust: true, backgroundColor: "#ffffff", pixelRatio: 2 }
            if (format === "png") {
                dataUrl = await toPng(elementRef.current, options)
            } else {
                dataUrl = await toJpeg(elementRef.current, { ...options, quality: 0.95 })
            }

            const link = document.createElement("a")
            link.download = `${fileName}.${format}`
            link.href = dataUrl
            link.click()
        } catch (error) {
            console.error("Failed to download image:", error)
        }
    }

    const downloadJSON = () => {
        if (!jsonData) {
            console.error("No JSON data provided")
            return
        }

        try {
            const jsonString = JSON.stringify(jsonData, null, 2)
            const blob = new Blob([jsonString], { type: "application/json" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.download = `${fileName}.json`
            link.href = url
            link.click()
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Failed to download JSON:", error)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent hover:bg-accent hover:text-accent-foreground h-9 px-3">
                <Download className="w-4 h-4" />
                <span>{buttonText}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => downloadImage("png")} className="cursor-pointer flex items-start gap-2 p-3">
                    <FileImage className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col gap-0.5">
                        <span className="font-medium">PNG</span>
                        <span className="text-xs text-muted-foreground">High quality, lossless</span>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadImage("jpeg")} className="cursor-pointer flex items-start gap-2 p-3">
                    <FileImage className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col gap-0.5">
                        <span className="font-medium">JPEG</span>
                        <span className="text-xs text-muted-foreground">Compressed, smaller file</span>
                    </div>
                </DropdownMenuItem>
                {enableJsonExport && jsonData && (
                    <DropdownMenuItem onClick={downloadJSON} className="cursor-pointer flex items-start gap-2 p-3">
                        <FileJson className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div className="flex flex-col gap-0.5">
                            <span className="font-medium">JSON</span>
                            <span className="text-xs text-muted-foreground">Structured data</span>
                        </div>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
