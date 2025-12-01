"use client"

interface SpiderChartProps {
    data: any
}

export function SpiderChart({ data }: SpiderChartProps) {
    if (!data || !data.scores) {
        return <div className="text-center py-8 text-gray-500">No data available</div>
    }

    const dimensions = Object.keys(data.scores)
    const scores = Object.values(data.scores) as number[]

    // Create a simple radar chart using SVG
    const size = 300
    const center = size / 2
    const radius = 100
    const angleStep = (2 * Math.PI) / dimensions.length

    const points = scores.map((score, index) => {
        const angle = index * angleStep - Math.PI / 2
        const r = score * radius
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle),
        }
    })

    const axisPoints = dimensions.map((_, index) => {
        const angle = index * angleStep - Math.PI / 2
        return {
            x: center + radius * Math.cos(angle),
            y: center + radius * Math.sin(angle),
            labelX: center + (radius + 20) * Math.cos(angle),
            labelY: center + (radius + 20) * Math.sin(angle),
        }
    })

    const pathData = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ") + " Z"

    return (
        <div className="flex justify-center">
            <svg width={size} height={size} className="border rounded">
                {/* Grid circles */}
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale) => (
                    <circle key={scale} cx={center} cy={center} r={radius * scale} fill="none" stroke="#e5e7eb" strokeWidth="1" />
                ))}

                {/* Axis lines */}
                {axisPoints.map((point, index) => (
                    <line key={index} x1={center} y1={center} x2={point.x} y2={point.y} stroke="#e5e7eb" strokeWidth="1" />
                ))}

                {/* Data polygon */}
                <path d={pathData} fill="rgba(59, 130, 246, 0.3)" stroke="#3b82f6" strokeWidth="2" />

                {/* Data points */}
                {points.map((point, index) => (
                    <circle key={index} cx={point.x} cy={point.y} r="4" fill="#3b82f6" />
                ))}

                {/* Labels */}
                {axisPoints.map((point, index) => (
                    <text
                        key={index}
                        x={point.labelX}
                        y={point.labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-medium fill-gray-700"
                    >
                        {dimensions[index]}
                    </text>
                ))}
            </svg>
        </div>
    )
}
