"use client"

import type React from "react"

import { useEffect, useRef, useMemo } from "react"
import * as d3 from "d3"
import { getDimensionAbbreviation, getDimensionDisplayName } from "@/lib/dimension-config"
import { Users, Activity } from "lucide-react"

interface LayeredVsHumanComparisonProps {
    autoData: { [model: string]: { [dimension: string]: number } }
    llmData: { [model: string]: { [dimension: string]: number } }
    humanData: { [model: string]: { [dimension: string]: number } }
    selectedModels: string[]
    selectedDimensions: string[]
}

export function LayeredVsHumanComparison({
    autoData,
    llmData,
    humanData,
    selectedModels,
    selectedDimensions,
}: LayeredVsHumanComparisonProps) {
    const layeredSvgRef = useRef<SVGSVGElement>(null)
    const humanSvgRef = useRef<SVGSVGElement>(null)

    // Create color scale once and reuse it
    const colorScale = useMemo(() => d3.scaleOrdinal(d3.schemeCategory10), [])

    const createLayeredSpiderChart = (
        svgRef: React.RefObject<SVGSVGElement>,
        autoData: { [model: string]: { [dimension: string]: number } },
        llmData: { [model: string]: { [dimension: string]: number } },
        title: string,
    ) => {
        if (!svgRef.current || selectedModels.length === 0 || selectedDimensions.length === 0) {
            return
        }

        const svg = d3.select(svgRef.current)
        svg.selectAll("*").remove()

        const width = 500
        const height = 500
        const margin = { top: 60, right: 60, bottom: 60, left: 60 }
        const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`)

        // Create scales
        const angleScale = d3
            .scaleLinear()
            .domain([0, selectedDimensions.length])
            .range([0, 2 * Math.PI])

        const radiusScale = d3.scaleLinear().domain([0, 1]).range([0, radius])

        // Create grid circles
        const gridLevels = 5
        for (let i = 1; i <= gridLevels; i++) {
            g.append("circle")
                .attr("r", (radius / gridLevels) * i)
                .attr("fill", "none")
                .attr("stroke", "#e5e7eb")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "3,3")
        }

        // Add grid labels
        for (let i = 1; i <= gridLevels; i++) {
            g.append("text")
                .attr("x", 5)
                .attr("y", -((radius / gridLevels) * i))
                .attr("font-size", "10px")
                .attr("fill", "#6b7280")
                .text((i / gridLevels).toFixed(1))
        }

        // Add dimension lines and labels
        selectedDimensions.forEach((dimension, i) => {
            const angle = angleScale(i) - Math.PI / 2
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius

            // Grid lines
            g.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", x)
                .attr("y2", y)
                .attr("stroke", "#e5e7eb")
                .attr("stroke-width", 1)

            // Dimension labels (using abbreviations)
            const labelRadius = radius + 25
            const labelX = Math.cos(angle) * labelRadius
            const labelY = Math.sin(angle) * labelRadius

            const abbreviation = getDimensionAbbreviation(dimension)

            g.append("text")
                .attr("x", labelX)
                .attr("y", labelY)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
                .attr("fill", "#374151")
                .text(abbreviation)
        })

        // Line generator
        const line = d3
            .line<[number, number]>()
            .x((d) => d[0])
            .y((d) => d[1])
            .curve(d3.curveLinearClosed)

        // Draw data for each selected model
        selectedModels.forEach((model, modelIndex) => {
            const color = colorScale(modelIndex.toString())

            // Auto data (outer layer - dashed)
            if (autoData[model]) {
                const autoPoints: [number, number][] = selectedDimensions.map((dimension, i) => {
                    const angle = angleScale(i) - Math.PI / 2
                    const value = autoData[model][dimension] || 0
                    const r = radiusScale(value)
                    return [Math.cos(angle) * r, Math.sin(angle) * r]
                })

                g.append("path")
                    .datum(autoPoints)
                    .attr("d", line)
                    .attr("fill", color)
                    .attr("fill-opacity", 0.1)
                    .attr("stroke", color)
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", "8,4")
                    .attr("stroke-opacity", 0.8)

                // Add dots for auto data
                autoPoints.forEach((point) => {
                    g.append("circle")
                        .attr("cx", point[0])
                        .attr("cy", point[1])
                        .attr("r", 4)
                        .attr("fill", color)
                        .attr("stroke", "white")
                        .attr("stroke-width", 2)
                        .attr("opacity", 0.8)
                })
            }

            // LLM data (inner layer - solid)
            if (llmData[model]) {
                const llmPoints: [number, number][] = selectedDimensions.map((dimension, i) => {
                    const angle = angleScale(i) - Math.PI / 2
                    const value = llmData[model][dimension] || 0
                    const r = radiusScale(value * 0.8) // Scale down slightly for inner layer
                    return [Math.cos(angle) * r, Math.sin(angle) * r]
                })

                g.append("path")
                    .datum(llmPoints)
                    .attr("d", line)
                    .attr("fill", color)
                    .attr("fill-opacity", 0.2)
                    .attr("stroke", color)
                    .attr("stroke-width", 3)
                    .attr("stroke-opacity", 1)

                // Add dots for LLM data
                llmPoints.forEach((point) => {
                    g.append("circle")
                        .attr("cx", point[0])
                        .attr("cy", point[1])
                        .attr("r", 5)
                        .attr("fill", color)
                        .attr("stroke", "white")
                        .attr("stroke-width", 2)
                })
            }
        })

        // Add title
        svg
            .append("text")
            .attr("x", width / 2)
            .attr("y", 25)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .attr("fill", "#1f2937")
            .text(title)
    }

    const createHumanSpiderChart = (
        svgRef: React.RefObject<SVGSVGElement>,
        data: { [model: string]: { [dimension: string]: number } },
        title: string,
    ) => {
        if (!svgRef.current || selectedModels.length === 0 || selectedDimensions.length === 0) {
            return
        }

        const svg = d3.select(svgRef.current)
        svg.selectAll("*").remove()

        const width = 500
        const height = 500
        const margin = { top: 60, right: 60, bottom: 60, left: 60 }
        const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`)

        // Create scales
        const angleScale = d3
            .scaleLinear()
            .domain([0, selectedDimensions.length])
            .range([0, 2 * Math.PI])

        const radiusScale = d3.scaleLinear().domain([0, 1]).range([0, radius])

        // Create grid circles
        const gridLevels = 5
        for (let i = 1; i <= gridLevels; i++) {
            g.append("circle")
                .attr("r", (radius / gridLevels) * i)
                .attr("fill", "none")
                .attr("stroke", "#e5e7eb")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "3,3")
        }

        // Add grid labels
        for (let i = 1; i <= gridLevels; i++) {
            g.append("text")
                .attr("x", 5)
                .attr("y", -((radius / gridLevels) * i))
                .attr("font-size", "10px")
                .attr("fill", "#6b7280")
                .text((i / gridLevels).toFixed(1))
        }

        // Add dimension lines and labels
        selectedDimensions.forEach((dimension, i) => {
            const angle = angleScale(i) - Math.PI / 2
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius

            // Grid lines
            g.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", x)
                .attr("y2", y)
                .attr("stroke", "#e5e7eb")
                .attr("stroke-width", 1)

            // Dimension labels (using abbreviations)
            const labelRadius = radius + 25
            const labelX = Math.cos(angle) * labelRadius
            const labelY = Math.sin(angle) * labelRadius
            const abbreviation = getDimensionAbbreviation(dimension)

            g.append("text")
                .attr("x", labelX)
                .attr("y", labelY)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
                .attr("fill", "#374151")
                .text(abbreviation)
        })

        // Line generator
        const line = d3
            .line<[number, number]>()
            .x((d) => d[0])
            .y((d) => d[1])
            .curve(d3.curveLinearClosed)

        // Draw data for each selected model
        selectedModels.forEach((model, modelIndex) => {
            const color = colorScale(modelIndex.toString())
            if (data[model]) {
                const points: [number, number][] = selectedDimensions.map((dimension, i) => {
                    const angle = angleScale(i) - Math.PI / 2
                    const value = data[model][dimension] || 0
                    const r = radiusScale(value)
                    return [Math.cos(angle) * r, Math.sin(angle) * r]
                })

                g.append("path")
                    .datum(points)
                    .attr("d", line)
                    .attr("fill", color)
                    .attr("fill-opacity", 0.2)
                    .attr("stroke", color)
                    .attr("stroke-width", 2)
                    .attr("stroke-opacity", 1)

                // Add dots
                points.forEach((point) => {
                    g.append("circle")
                        .attr("cx", point[0])
                        .attr("cy", point[1])
                        .attr("r", 4)
                        .attr("fill", color)
                        .attr("stroke", "white")
                        .attr("stroke-width", 2)
                })
            }
        })

        // Add title
        svg
            .append("text")
            .attr("x", width / 2)
            .attr("y", 25)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .attr("fill", "#1f2937")
            .text(title)
    }

    useEffect(() => {
        createLayeredSpiderChart(layeredSvgRef, autoData, llmData, "Auto vs LLM Evaluation")
        createHumanSpiderChart(humanSvgRef, humanData, "Human Annotation")
    }, [autoData, llmData, humanData, selectedModels, selectedDimensions])

    return (
        <div className="flex justify-center gap-8 items-start">
            {/* Layered Chart (Auto + LLM) */}
            <div className="flex-shrink-0">
                <svg ref={layeredSvgRef} className="border rounded-lg bg-white" />
            </div>

            {/* Human Chart */}
            <div className="flex-shrink-0">
                <svg ref={humanSvgRef} className="border rounded-lg bg-white" />
            </div>

            {/* Shared Legend */}
            <div className="flex-shrink-0 space-y-6">
                {/* Clarifying text */}
                <div className="text-base font-semibold text-gray-800">🔍 Interpretation Guide</div>

                {/* Annotation Types with proper dashed/solid lines */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <svg width="24" height="2" className="flex-shrink-0">
                            <line x1="0" y1="1" x2="24" y2="1" stroke="#6b7280" strokeWidth="2" strokeDasharray="4,2" />
                        </svg>
                        <span className="text-sm text-gray-700">Auto Annotation (dashed)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <svg width="24" height="2" className="flex-shrink-0">
                            <line x1="0" y1="1" x2="24" y2="1" stroke="#6b7280" strokeWidth="3" />
                        </svg>
                        <span className="text-sm text-gray-700">LLM Annotation (solid)</span>
                    </div>
                </div>

                {/* Models with correct colors */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold text-gray-800">Models:</span>
                    </div>
                    <div className="space-y-2">
                        {selectedModels.map((model, i) => {
                            const color = colorScale(i.toString())
                            return (
                                <div key={model} className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
                                    <span className="text-sm text-gray-700">{model}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Dimensions */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold text-gray-800">Dimensions:</span>
                    </div>
                    <div className="space-y-1">
                        {selectedDimensions.map((dimension) => {
                            const abbreviation = getDimensionAbbreviation(dimension)
                            const displayName = getDimensionDisplayName(dimension)
                            return (
                                <div key={dimension} className="text-sm text-gray-700">
                                    <span className="font-bold">{abbreviation}:</span> {displayName}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
