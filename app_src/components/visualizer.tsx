"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, BarChart3, PieChart, Activity } from "lucide-react"
import { DIMENSION_CONFIG } from "@/lib/dimension-config"

interface VisualizerProps {
    results: any[]
}

export function Visualizer({ results }: VisualizerProps) {
    const [selectedResult, setSelectedResult] = useState<string>("")
    const [chartType, setChartType] = useState<"spider" | "violin" | "heatmap">("spider")
    const [selectedDimension, setSelectedDimension] = useState<string>("")
    const [selectedTutors, setSelectedTutors] = useState<string[]>([])

    // Get available dimensions and tutors from results
    const availableDimensions = Object.keys(DIMENSION_CONFIG)
    const availableTutors = results.length > 0 ? [...new Set(results.flatMap((r) => r.tutors || []))] : []

    const downloadChart = (type: string) => {
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
            ctx.fillText(`${type} Chart - AI Tutor Evaluation`, 50, 50)

            const link = document.createElement("a")
            link.download = `${type}-chart-${Date.now()}.png`
            link.href = canvas.toDataURL()
            link.click()
        }
    }

    if (results.length === 0) {
        return (
            <Card>
                <CardContent className="text-center py-12">
                    <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Results to Visualize</h3>
                    <p className="text-gray-600">Run AutoEval or LLMEval to generate results that can be visualized here.</p>
                </CardContent>
            </Card>
        )
    }

    const selectedResultData = results.find((r) => r.id.toString() === selectedResult) || results[0]

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <Select value={selectedResult} onValueChange={setSelectedResult}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select evaluation result to visualize" />
                        </SelectTrigger>
                        <SelectContent>
                            {results.map((result) => (
                                <SelectItem key={result.id} value={result.id.toString()}>
                                    {result.type === "autoeval" ? "AutoEval" : "LLMEval"} -{" "}
                                    {new Date(result.timestamp).toLocaleDateString()}
                                    {result.type === "llmeval" && ` (${result.model})`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="outline" onClick={() => downloadChart(chartType)} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download Chart
                </Button>
            </div>

            <Tabs value={chartType} onValueChange={(value) => setChartType(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="spider" className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Spider Plot
                    </TabsTrigger>
                    <TabsTrigger value="violin" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Bar Plot
                    </TabsTrigger>
                    <TabsTrigger value="heatmap" className="flex items-center gap-2">
                        <PieChart className="w-4 h-4" />
                        Heatmap
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="spider">
                    <Card>
                        <CardHeader>
                            <CardTitle>Spider Plot - Dimension Scores</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-96 flex items-center justify-center text-gray-500">
                                Spider Chart Visualization (Chart library needed)
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="violin">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bar Plot - Score Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Dimension for Bar Plot
                                        </label>
                                        <Select value={selectedDimension} onValueChange={setSelectedDimension}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select dimension" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableDimensions.map((dim) => (
                                                    <SelectItem key={dim} value={dim}>
                                                        {DIMENSION_CONFIG[dim]?.displayName || dim}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Tutors</label>
                                        <Select
                                            value={selectedTutors.join(",")}
                                            onValueChange={(value) => setSelectedTutors(value ? value.split(",") : [])}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select tutors" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableTutors.map((tutor) => (
                                                    <SelectItem key={tutor} value={tutor}>
                                                        {tutor}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <div className="h-96 flex items-center justify-center text-gray-500">
                                {selectedDimension && selectedTutors.length > 0 ? (
                                    <div className="text-center">
                                        <p>Bar Chart for: {DIMENSION_CONFIG[selectedDimension]?.displayName}</p>
                                        <p>Tutors: {selectedTutors.join(", ")}</p>
                                        <p className="text-sm text-gray-400 mt-2">(Chart library needed)</p>
                                    </div>
                                ) : (
                                    <p>Please select dimension and tutors to view bar chart</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="heatmap">
                    <Card>
                        <CardHeader>
                            <CardTitle>Heatmap - Comparative Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-96 flex items-center justify-center text-gray-500">
                                Heatmap Visualization (Chart library needed)
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
