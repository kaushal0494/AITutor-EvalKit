"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { getDimensionAbbreviation, getDimensionDisplayName } from "@/lib/dimension-config"
import { Users, Activity } from "lucide-react"

interface SingleSpiderChartProps {
    data: { [model: string]: { [dimension: string]: number } }
    selectedModels: string[]
    selectedDimensions: string[]
    evaluationType: "auto" | "llm"
    title: string
}

export function SingleSpiderChart({
    data,
    selectedModels,
    selectedDimensions,
    evaluationType,
    title,
}: SingleSpiderChartProps) {
    const svgRef = useRef<SVGSVGElement>(null)

    // Create color scale outside useEffect to use in legend
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

    useEffect(() => {
        if (!svgRef.current || selectedModels.length === 0 || selectedDimensions.length === 0) {
            return
        }

        const svg = d3.select(svgRef.current)
        svg.selectAll("*").remove()

        const width = 600
        const height = 600
        const margin = { top: 80, right: 80, bottom: 80, left: 80 }
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
            const labelRadius = radius + 30
            const labelX = Math.cos(angle) * labelRadius
            const labelY = Math.sin(angle) * labelRadius

            const abbreviation = getDimensionAbbreviation(dimension)

            g.append("text")
                .attr("x", labelX)
                .attr("y", labelY)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("font-size", "14px")
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
                    .attr("stroke-width", 3)
                    .attr("stroke-opacity", 1)

                // Add dots
                points.forEach((point, i) => {
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

        // Add title only (removed duplicate subtitle)
        svg
            .append("text")
            .attr("x", width / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .attr("font-size", "18px")
            .attr("font-weight", "bold")
            .attr("fill", "#1f2937")
            .text(title)
    }, [data, selectedModels, selectedDimensions, evaluationType, title])

    return (
        <div className="flex justify-center gap-8 items-start">
            {/* Spider Chart - Centered */}
            <div className="flex-shrink-0">
                <svg ref={svgRef} className="border rounded-lg bg-white" />
            </div>

            {/* Legend */}
            <div className="flex-shrink-0 space-y-6">
                {/* Models */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold text-gray-800">Models:</span>
                    </div>
                    <div className="space-y-2">
                        {selectedModels.map((model, i) => (
                            <div key={model} className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScale(i.toString()) }}></div>
                                <span className="text-sm text-gray-700">{model}</span>
                            </div>
                        ))}
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
