"use client"

interface DatasetViolinChartProps {
    data: Array<{ dimension: string; score: number }>
    dimensions: string[]
    title?: string
}

export function DatasetViolinChart({ data, dimensions, title = "Score Distribution" }: DatasetViolinChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">No distribution data available</p>
                <p className="text-sm">Violin plot requires score data across multiple conversations</p>
            </div>
        )
    }

    const dimensionStats = dimensions.map((dimension) => {
        const scores = data.filter((d) => d.dimension === dimension).map((d) => d.score)

        if (scores.length === 0) {
            return {
                dimension,
                average: 0,
                min: 0,
                max: 0,
                count: 0,
                scores: [],
            }
        }

        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
        const min = Math.min(...scores)
        const max = Math.max(...scores)

        return {
            dimension,
            average,
            min,
            max,
            count: scores.length,
            scores,
        }
    })

    const maxScore = 1
    const overallAverage = dimensionStats.reduce((sum, stat) => sum + stat.average, 0) / dimensionStats.length

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
                <div className="text-sm text-gray-600">
                    Overall Average: <span className="font-bold text-blue-600">{(overallAverage * 100).toFixed(1)}%</span>
                </div>
            </div>

            <div className="space-y-4">
                {dimensionStats.map((stat, index) => {
                    const colors = [
                        { bar: "bg-blue-600", light: "bg-blue-100" },
                        { bar: "bg-indigo-600", light: "bg-indigo-100" },
                        { bar: "bg-purple-600", light: "bg-purple-100" },
                        { bar: "bg-violet-600", light: "bg-violet-100" },
                    ]
                    const color = colors[index % colors.length]

                    return (
                        <div key={stat.dimension} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${color.bar}`} />
                                    <span className="text-sm font-medium text-gray-700">{stat.dimension}</span>
                                </div>
                                <span className="text-xs text-gray-500">{stat.count} data points</span>
                            </div>

                            <div className="relative">
                                <div className={`w-full ${color.light} rounded-full h-10 relative overflow-hidden`}>
                                    <div
                                        className={`${color.bar} h-10 rounded-full flex items-center justify-end pr-3 transition-all duration-500 relative`}
                                        style={{ width: `${(stat.average / maxScore) * 100}%` }}
                                    >
                                        <span className="text-white text-xs font-semibold">{(stat.average * 100).toFixed(1)}%</span>
                                    </div>

                                    {stat.min !== stat.max && (
                                        <>
                                            <div
                                                className="absolute top-0 bottom-0 w-0.5 bg-gray-400 opacity-50"
                                                style={{ left: `${(stat.min / maxScore) * 100}%` }}
                                                title={`Min: ${(stat.min * 100).toFixed(0)}%`}
                                            />
                                            <div
                                                className="absolute top-0 bottom-0 w-0.5 bg-gray-700 opacity-50"
                                                style={{ left: `${(stat.max / maxScore) * 100}%` }}
                                                title={`Max: ${(stat.max * 100).toFixed(0)}%`}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between text-xs text-gray-500 px-1">
                                <span>Min: {(stat.min * 100).toFixed(0)}%</span>
                                <span>Avg: {(stat.average * 100).toFixed(1)}%</span>
                                <span>Max: {(stat.max * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <h5 className="font-semibold text-gray-800 mb-3">Overall Statistics</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{dimensionStats.length}</div>
                        <div className="text-xs text-gray-600 mt-1">Dimensions</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">
                            {dimensionStats.reduce((sum, stat) => sum + stat.count, 0)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Total Scores</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{(overallAverage * 100).toFixed(1)}%</div>
                        <div className="text-xs text-gray-600 mt-1">Average Score</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-violet-600">
                            {(Math.max(...dimensionStats.map((s) => s.average)) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Highest Avg</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
