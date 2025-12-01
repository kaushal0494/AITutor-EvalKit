"use client"

interface DatasetViolinChartProps {
    data: { [model: string]: { [dimension: string]: number } }
    selectedDimension: string
}

export function DatasetViolinChart({ data, selectedDimension }: DatasetViolinChartProps) {
    if (!data || Object.keys(data).length === 0) {
        return <div className="text-center py-8 text-gray-500">No data available</div>
    }

    // Extract scores for the selected dimension across all models
    const modelScores = Object.entries(data)
        .map(([model, dimensions]) => ({
            model,
            score: dimensions[selectedDimension] || 0,
        }))
        .filter((item) => item.score > 0)

    if (modelScores.length === 0) {
        return <div className="text-center py-8 text-gray-500">No data for selected dimension</div>
    }

    const maxScore = 1
    const chartWidth = 600
    const barHeight = 40

    return (
        <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-700">Distribution for: {selectedDimension}</h4>

            {modelScores.map((item, index) => (
                <div key={item.model} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium text-gray-700 text-right">{item.model}</div>
                    <div className="flex-1">
                        <div className="relative">
                            <div className="w-full bg-gray-200 rounded-full h-8">
                                <div
                                    className="bg-blue-600 h-8 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                                    style={{ width: `${(item.score / maxScore) * 100}%` }}
                                >
                                    <span className="text-white text-xs font-medium">{(item.score * 100).toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-700 mb-2">Statistics:</h5>
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Average: </span>
                        <span className="font-medium">
                            {((modelScores.reduce((sum, item) => sum + item.score, 0) / modelScores.length) * 100).toFixed(1)}%
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-600">Max: </span>
                        <span className="font-medium">
                            {(Math.max(...modelScores.map((item) => item.score)) * 100).toFixed(1)}%
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-600">Min: </span>
                        <span className="font-medium">
                            {(Math.min(...modelScores.map((item) => item.score)) * 100).toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
