"use client"

interface HeatmapChartProps {
    data: any[]
}

export function HeatmapChart({ data }: HeatmapChartProps) {
    if (!data || data.length === 0) {
        return <div className="text-center py-8 text-gray-500">No data available</div>
    }

    const dimensions = ["MI", "ML", "RA", "PG", "AC", "CO", "TT", "HM"]

    const getScoreColor = (score: number) => {
        const intensity = Math.round(score * 255)
        return `rgb(${255 - intensity}, ${intensity}, ${Math.round(intensity * 0.5)})`
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-9 gap-1 text-sm">
                <div></div>
                {dimensions.map((dim) => (
                    <div key={dim} className="text-center font-medium p-2">
                        {dim}
                    </div>
                ))}

                {data.map((result, index) => (
                    <div key={result.id} className="contents">
                        <div className="p-2 font-medium text-right text-xs">Result {index + 1}</div>
                        {dimensions.map((dim) => {
                            const score = result.scores?.[dim] || 0
                            return (
                                <div
                                    key={`${result.id}-${dim}`}
                                    className="aspect-square flex items-center justify-center text-xs font-medium text-white rounded"
                                    style={{ backgroundColor: getScoreColor(score) }}
                                    title={`${dim}: ${(score * 100).toFixed(1)}%`}
                                >
                                    {(score * 100).toFixed(0)}
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-center gap-4 text-sm">
                <span>Low</span>
                <div className="flex">
                    {[0, 0.2, 0.4, 0.6, 0.8, 1].map((score) => (
                        <div key={score} className="w-6 h-4" style={{ backgroundColor: getScoreColor(score) }} />
                    ))}
                </div>
                <span>High</span>
            </div>
        </div>
    )
}
