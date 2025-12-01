"use client"

import { DIMENSION_CONFIG, getDimensionAbbreviation, getDimensionDisplayName } from "@/lib/dimension-config"

interface DatasetSpiderChartFlexibleProps {
    data: { [model: string]: { [dimension: string]: number } }
    selectedModels: string[]
    selectedDimensions: string[]
}

export function DatasetSpiderChartFlexible({
    data,
    selectedModels,
    selectedDimensions,
}: DatasetSpiderChartFlexibleProps) {
    if (!data || Object.keys(data).length === 0) {
        return <div className="text-center py-8 text-gray-500">No data available</div>
    }

    if (selectedDimensions.length === 0) {
        return <div className="text-center py-8 text-gray-500">Please select at least one dimension to display</div>
    }

    if (selectedModels.length === 0) {
        return <div className="text-center py-8 text-gray-500">Please select at least one model to display</div>
    }

    // Use selected dimensions instead of fixed ones
    const dimensions = selectedDimensions

    const dimensionNames = DIMENSION_CONFIG.ABBREVIATIONS

    // Increased size and better spacing for labels
    const svgWidth = 700
    const svgHeight = 600
    const center = { x: svgWidth / 2, y: svgHeight / 2 }
    const radius = 140
    const labelRadius = 180
    const angleStep = (2 * Math.PI) / dimensions.length

    const colors = [
        "#3b82f6", // Blue
        "#ef4444", // Red
        "#10b981", // Green
        "#f59e0b", // Amber
        "#8b5cf6", // Purple
        "#06b6d4", // Cyan
        "#f97316", // Orange
        "#84cc16", // Lime
        "#ec4899", // Pink
        "#6366f1", // Indigo
    ]

    const axisPoints = dimensions.map((_, index) => {
        const angle = index * angleStep - Math.PI / 2
        return {
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle),
            labelX: center.x + labelRadius * Math.cos(angle),
            labelY: center.y + labelRadius * Math.sin(angle),
            angle: angle,
        }
    })

    // Helper function to get dimension score from data
    const getDimensionScore = (modelData: any, dimension: string): number => {
        return modelData[dimension] || 0
    }

    return (
        <div className="flex justify-center items-center">
            <div className="flex items-start gap-6">
                <svg width={svgWidth} height={svgHeight} className="border rounded bg-white">
                    {/* Grid circles */}
                    {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale) => (
                        <circle
                            key={scale}
                            cx={center.x}
                            cy={center.y}
                            r={radius * scale}
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="1"
                        />
                    ))}

                    {/* Axis lines */}
                    {axisPoints.map((point, index) => (
                        <line key={index} x1={center.x} y1={center.y} x2={point.x} y2={point.y} stroke="#e5e7eb" strokeWidth="1" />
                    ))}

                    {/* Data for each selected model */}
                    {selectedModels.map((model, modelIndex) => {
                        if (!data[model]) return null

                        const points = dimensions.map((dim, index) => {
                            const angle = index * angleStep - Math.PI / 2
                            const score = getDimensionScore(data[model], dim)
                            const r = score * radius
                            return {
                                x: center.x + r * Math.cos(angle),
                                y: center.y + r * Math.sin(angle),
                            }
                        })

                        const pathData =
                            points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ") + " Z"

                        const color = colors[modelIndex % colors.length]

                        return (
                            <g key={model}>
                                {/* Data polygon */}
                                <path d={pathData} fill={`${color}30`} stroke={color} strokeWidth="2" />

                                {/* Data points */}
                                {points.map((point, index) => (
                                    <circle key={index} cx={point.x} cy={point.y} r="4" fill={color} />
                                ))}
                            </g>
                        )
                    })}

                    {/* Labels with improved positioning */}
                    {axisPoints.map((point, index) => {
                        const dimension = dimensions[index]

                        const displayLabel = getDimensionAbbreviation(dimension)

                        // Calculate text anchor and positioning based on angle
                        let textAnchor = "middle"
                        let dx = 0
                        let dy = 0

                        // Adjust positioning based on quadrant
                        const normalizedAngle = (point.angle + Math.PI * 2) % (Math.PI * 2)

                        if (normalizedAngle > Math.PI * 0.25 && normalizedAngle < Math.PI * 0.75) {
                            // Bottom quadrant
                            textAnchor = "middle"
                            dy = 15
                        } else if (normalizedAngle > Math.PI * 0.75 && normalizedAngle < Math.PI * 1.25) {
                            // Left quadrant
                            textAnchor = "end"
                            dx = -10
                        } else if (normalizedAngle > Math.PI * 1.25 && normalizedAngle < Math.PI * 1.75) {
                            // Top quadrant
                            textAnchor = "middle"
                            dy = -10
                        } else {
                            // Right quadrant
                            textAnchor = "start"
                            dx = 10
                        }

                        return (
                            <text
                                key={index}
                                x={point.labelX + dx}
                                y={point.labelY + dy}
                                textAnchor={textAnchor}
                                dominantBaseline="middle"
                                className="text-xs font-medium fill-gray-700"
                                style={{ fontSize: "12px" }}
                            >
                                {displayLabel}
                            </text>
                        )
                    })}

                    {/* Scale labels */}
                    {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale) => (
                        <text
                            key={scale}
                            x={center.x + 5}
                            y={center.y - radius * scale}
                            className="text-xs fill-gray-500"
                            style={{ fontSize: "10px" }}
                        >
                            {(scale * 100).toFixed(0)}%
                        </text>
                    ))}
                </svg>

                {/* Enhanced Legend */}
                <div className="space-y-4 min-w-[200px]">
                    <h4 className="font-medium text-gray-700 text-sm">Models:</h4>
                    {selectedModels.map((model, index) => (
                        <div key={model} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: colors[index % colors.length] }} />
                            <span className="text-sm text-gray-700">{model}</span>
                        </div>
                    ))}

                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-700 text-sm mb-2">Dimensions:</h4>
                        <div className="text-xs text-gray-600 space-y-1">
                            {selectedDimensions.map((dim) => (
                                <div key={dim} className="flex gap-2">
                                    <strong>{getDimensionAbbreviation(dim)}:</strong>
                                    <span>{getDimensionDisplayName(dim)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export { DatasetSpiderChartFlexible as DatasetSpiderChart }
