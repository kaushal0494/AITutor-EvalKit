"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, BarChart3, PieChart, Activity } from "lucide-react"
import { SpiderChart } from "./charts/spider-chart"
import { ViolinChart } from "./charts/violin-chart"
import { HeatmapChart } from "./charts/heatmap-chart"

interface EmbeddedVisualizerProps {
    results: any[]
    type: "autoeval" | "llmeval"
}

export function EmbeddedVisualizer({ results, type }: EmbeddedVisualizerProps) {
    const [selectedResult, setSelectedResult] = useState<string>("")
    const [chartType, setChartType] = useState<"spider" | "violin" | "heatmap">("spider")

    const downloadChart = (chartType: string) => {
        // In a real implementation, you would capture the chart as an image/PDF
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (ctx) {
            canvas.width = 800
            canvas.height = 600
            ctx.fillStyle = "white"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.fillStyle = "black"
            ctx.font = "20px Arial"
            ctx.fillText(`${chartType} Chart - ${type.toUpperCase()} Results`, 50, 50)

            const link = document.createElement("a")
            link.download = `${type}-${chartType}-chart-${Date.now()}.png`
            link.href = canvas.toDataURL()
            link.click()
        }
    }

    if (results.length === 0) {
        return (
            <Card className="mt-6">
                <CardContent className="text-center py-8">
                    <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Results to Visualize</h3>
                    <p className="text-gray-600">Run an evaluation to see visualizations here.</p>
                </CardContent>
            </Card>
        )
    }

    const selectedResultData = results.find((r) => r.id.toString() === selectedResult) || results[results.length - 1]

    return (
        <Card className="mt-6">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        {type === "autoeval" ? "AutoEval" : "LLMEval"} Visualizations
                    </CardTitle>
                    <Button variant="outline" onClick={() => downloadChart(chartType)} className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Download Chart
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {results.length > 1 && (
                    <div className="mb-6">
                        <Select
                            value={selectedResult || results[results.length - 1]?.id.toString()}
                            onValueChange={setSelectedResult}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select evaluation result to visualize" />
                            </SelectTrigger>
                            <SelectContent>
                                {results.map((result) => (
                                    <SelectItem key={result.id} value={result.id.toString()}>
                                        {type === "autoeval" ? "AutoEval" : "LLMEval"} - {new Date(result.timestamp).toLocaleDateString()} -{" "}
                                        {(result.summary.averageScore * 100).toFixed(1)}%{result.type === "llmeval" && ` (${result.model})`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <Tabs value={chartType} onValueChange={(value) => setChartType(value as any)}>
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="spider" className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Spider Plot
                        </TabsTrigger>
                        <TabsTrigger value="violin" className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Distribution
                        </TabsTrigger>
                        <TabsTrigger value="heatmap" className="flex items-center gap-2">
                            <PieChart className="w-4 h-4" />
                            Heatmap
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="spider">
                        <div className="border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-4">Dimension Scores Overview</h4>
                            <SpiderChart data={selectedResultData} />
                        </div>
                    </TabsContent>

                    <TabsContent value="violin">
                        <div className="border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-4">Score Distribution Analysis</h4>
                            <ViolinChart data={results} />
                        </div>
                    </TabsContent>

                    <TabsContent value="heatmap">
                        <div className="border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-4">Comparative Analysis</h4>
                            <HeatmapChart data={results} />
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
