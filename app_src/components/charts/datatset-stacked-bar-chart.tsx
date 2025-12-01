"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

interface CategoryData {
    tutor: string
    yes: number
    toSomeExtent: number
    no: number
    total: number
}

interface DatasetStackedBarChartProps {
    data: CategoryData[]
    dimension: string
}

export function DatasetStackedBarChart({ data, dimension }: DatasetStackedBarChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">No data for selected dimension</p>
            </div>
        )
    }

    // Calculate statistics
    const allYesPercentages = data.map((d) => (d.yes / d.total) * 100)
    const allToSomeExtentPercentages = data.map((d) => (d.toSomeExtent / d.total) * 100)
    const allNoPercentages = data.map((d) => (d.no / d.total) * 100)

    const avgYes = allYesPercentages.reduce((a, b) => a + b, 0) / allYesPercentages.length
    const avgToSomeExtent = allToSomeExtentPercentages.reduce((a, b) => a + b, 0) / allToSomeExtentPercentages.length
    const avgNo = allNoPercentages.reduce((a, b) => a + b, 0) / allNoPercentages.length

    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 via-yellow-50 to-red-50">
                    <CardTitle className="text-lg font-semibold text-gray-800">Bar Plot - Response Distribution</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                        Response distribution for dimension: {dimension.replace(/_/g, " ")}
                    </p>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700 mb-4">Distribution for: {dimension.replace(/_/g, " ")}</h3>

                        {data.map((item) => {
                            const yesPercent = (item.yes / item.total) * 100
                            const toSomeExtentPercent = (item.toSomeExtent / item.total) * 100
                            const noPercent = (item.no / item.total) * 100

                            return (
                                <div key={item.tutor} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700 w-32">{item.tutor}</span>
                                        <div className="flex-1 ml-4">
                                            <div className="flex h-8 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                                {/* Yes - Green */}
                                                {yesPercent > 0 && (
                                                    <div
                                                        className="bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white text-xs font-semibold transition-all hover:from-green-600 hover:to-green-700"
                                                        style={{ width: `${yesPercent}%` }}
                                                    >
                                                        {yesPercent >= 10 && `${yesPercent.toFixed(1)}%`}
                                                    </div>
                                                )}
                                                {/* To Some Extent - Yellow */}
                                                {toSomeExtentPercent > 0 && (
                                                    <div
                                                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 flex items-center justify-center text-white text-xs font-semibold transition-all hover:from-yellow-500 hover:to-yellow-600"
                                                        style={{ width: `${toSomeExtentPercent}%` }}
                                                    >
                                                        {toSomeExtentPercent >= 10 && `${toSomeExtentPercent.toFixed(1)}%`}
                                                    </div>
                                                )}
                                                {/* No - Red */}
                                                {noPercent > 0 && (
                                                    <div
                                                        className="bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-semibold transition-all hover:from-red-600 hover:to-red-700"
                                                        style={{ width: `${noPercent}%` }}
                                                    >
                                                        {noPercent >= 10 && `${noPercent.toFixed(1)}%`}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Detailed percentages below bar */}
                                    <div className="flex ml-36 text-xs text-gray-600 gap-4">
                                        <span className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded bg-green-500" />
                                            Yes: {yesPercent.toFixed(1)}%
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded bg-yellow-400" />
                                            To some extent: {toSomeExtentPercent.toFixed(1)}%
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded bg-red-500" />
                                            No: {noPercent.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Statistics Summary */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h4 className="font-semibold text-gray-700 mb-4">Average Statistics:</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                                <div className="text-sm text-gray-600 mb-1">Average "Yes"</div>
                                <div className="text-2xl font-bold text-green-700">{avgYes.toFixed(1)}%</div>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                                <div className="text-sm text-gray-600 mb-1">Average "To some extent"</div>
                                <div className="text-2xl font-bold text-yellow-700">{avgToSomeExtent.toFixed(1)}%</div>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                                <div className="text-sm text-gray-600 mb-1">Average "No"</div>
                                <div className="text-2xl font-bold text-red-700">{avgNo.toFixed(1)}%</div>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-gradient-to-r from-green-500 to-green-600" />
                                <span className="text-gray-700 font-medium">Yes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-gradient-to-r from-yellow-400 to-yellow-500" />
                                <span className="text-gray-700 font-medium">To Some Extent</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-gradient-to-r from-red-500 to-red-600" />
                                <span className="text-gray-700 font-medium">No</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
