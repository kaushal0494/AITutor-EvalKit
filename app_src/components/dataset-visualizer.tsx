"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Database, MessageSquare, Users, Target, Activity, BarChart3 } from "lucide-react"
import { DatasetSpiderChart } from "@/components/charts/dataset-spider-chart-flexible"
import { DownloadButton } from "@/components/download-button"

interface DatasetVisualizerProps {
    onResults?: (results: any) => void
}

interface DatasetInfo {
    totalConversations: number
    totalTutors: number
    totalDimensions: number
    dimensions: string[]
    tutors: string[]
    conversationsByTutor: { [tutor: string]: number }
    averageScoresByDimension: { [dimension: string]: number }
    averageScoresByTutor: { [tutor: string]: number }
    averageScoresByTutorAndDimension: { [key: string]: number }
    distributionData: any[]
    categoryDistribution: {
        [key: string]: { yes: number; toSomeExtent: number; no: number; total: number }
    }
}

interface CategoryData {
    tutor: string
    yes: number
    toSomeExtent: number
    no: number
    total: number
}

function StackedBarChart({ data, dimension }: { data: CategoryData[]; dimension: string }) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">No data for selected dimension</p>
            </div>
        )
    }

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
                                                {yesPercent > 0 && (
                                                    <div
                                                        className="bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white text-xs font-semibold transition-all hover:from-green-600 hover:to-green-700"
                                                        style={{ width: `${yesPercent}%` }}
                                                    >
                                                        {yesPercent >= 10 && `${yesPercent.toFixed(1)}%`}
                                                    </div>
                                                )}
                                                {toSomeExtentPercent > 0 && (
                                                    <div
                                                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 flex items-center justify-center text-white text-xs font-semibold transition-all hover:from-yellow-500 hover:to-yellow-600"
                                                        style={{ width: `${toSomeExtentPercent}%` }}
                                                    >
                                                        {toSomeExtentPercent >= 10 && `${toSomeExtentPercent.toFixed(1)}%`}
                                                    </div>
                                                )}
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

export function DatasetVisualizer({ onResults }: DatasetVisualizerProps) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>("")
    const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null)
    const [activeTab, setActiveTab] = useState("spider")

    const [selectedTutors, setSelectedTutors] = useState<string[]>([])
    const [selectedDimensions, setSelectedDimensions] = useState<string[]>([])
    const [selectedDimensionForBar, setSelectedDimensionForBar] = useState<string>("")

    const chartRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadDatasetInfo()
    }, [])

    const loadDatasetInfo = async () => {
        try {
            setLoading(true)
            const response = await fetch("/api/backend-dataset")
            const result = await response.json()

            if (result.success && result.data) {
                setDatasetInfo(result.data)
                setError("")
                if (onResults) {
                    onResults(result.data)
                }
            } else {
                const errorMsg = result.details || result.error || "Failed to load dataset information"
                setError(errorMsg)
            }
        } catch (err) {
            setError("Failed to load dataset")
        } finally {
            setLoading(false)
        }
    }

    const handleTutorToggle = (tutor: string, checked: boolean) => {
        if (checked) {
            setSelectedTutors((prev) => [...prev, tutor])
        } else {
            setSelectedTutors((prev) => prev.filter((t) => t !== tutor))
        }
    }

    const selectAllTutors = () => {
        if (datasetInfo) {
            setSelectedTutors(datasetInfo.tutors)
        }
    }

    const clearAllTutors = () => {
        setSelectedTutors([])
    }

    const handleDimensionToggle = (dimension: string, checked: boolean) => {
        if (checked) {
            setSelectedDimensions((prev) => [...prev, dimension])
        } else {
            setSelectedDimensions((prev) => prev.filter((d) => d !== dimension))
        }
    }

    const selectAllDimensions = () => {
        if (datasetInfo) {
            setSelectedDimensions(datasetInfo.dimensions)
        }
    }

    const clearAllDimensions = () => {
        setSelectedDimensions([])
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading dataset...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <span>{error}</span>
            </div>
        )
    }

    if (!datasetInfo) {
        return (
            <div className="text-center p-8 text-gray-500">
                <span>No dataset information available</span>
            </div>
        )
    }

    const spiderChartData: { [tutor: string]: { [dimension: string]: number } } = {}
    selectedTutors.forEach((tutor) => {
        spiderChartData[tutor] = {}
        selectedDimensions.forEach((dimension) => {
            const key = `${tutor}::${dimension}`
            const dimensionData = datasetInfo.averageScoresByTutorAndDimension[key] || 0
            spiderChartData[tutor][dimension] = dimensionData
        })
    })

    const barChartData = selectedDimensionForBar
        ? selectedTutors.length > 0
            ? selectedTutors.map((tutor) => {
                const key = `${tutor}::${selectedDimensionForBar}`
                const distribution = datasetInfo.categoryDistribution[key] || {
                    yes: 0,
                    toSomeExtent: 0,
                    no: 0,
                    total: 1,
                }
                return {
                    tutor,
                    ...distribution,
                }
            })
            : datasetInfo.tutors.map((tutor) => {
                const key = `${tutor}::${selectedDimensionForBar}`
                const distribution = datasetInfo.categoryDistribution[key] || {
                    yes: 0,
                    toSomeExtent: 0,
                    no: 0,
                    total: 1,
                }
                return {
                    tutor,
                    ...distribution,
                }
            })
        : []

    return (
        <div className="space-y-6">
            {/* Dataset Overview */}
            <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-lg">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-gray-800">
                        <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md">
                            <Database className="w-5 h-5" />
                        </div>
                        Dataset Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-600">Conversations</span>
                            </div>
                            <div className="text-2xl font-bold text-blue-600">{datasetInfo.totalConversations}</div>
                        </div>
                        <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-medium text-gray-600">Tutors</span>
                            </div>
                            <div className="text-2xl font-bold text-indigo-600">{datasetInfo.totalTutors}</div>
                        </div>
                        <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Target className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium text-gray-600">Evaluation Dimensions</span>
                            </div>
                            <div className="text-2xl font-bold text-purple-600">{datasetInfo.totalDimensions}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tutor Performance Summary */}
            <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-gray-800">
                        <div className="p-2 bg-gradient-to-r from-slate-600 to-gray-700 text-white rounded-lg shadow-md">
                            <Users className="w-5 h-5" />
                        </div>
                        Tutor Performance Summary
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-2">
                        Scores reflect averages across all evaluation dimensions. Ratings are assumed as follows: <strong>Yes = 1.0</strong>, <strong>To some extent = 0.5</strong>, <strong>No = 0.0</strong>
                        <br /> <em>*Note: For Novice, only 76 conversations are available.</em>
                    </p>


                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(datasetInfo.averageScoresByTutor)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .map(([tutor, avgScore], index) => {
                                const gradients = [
                                    "from-blue-500 to-blue-600",
                                    "from-indigo-500 to-indigo-600",
                                    "from-purple-500 to-purple-600",
                                    "from-violet-500 to-violet-600",
                                    "from-fuchsia-500 to-fuchsia-600",
                                    "from-pink-500 to-pink-600",
                                    "from-rose-500 to-rose-600",
                                    "from-cyan-500 to-cyan-600",
                                    "from-teal-500 to-teal-600",
                                ]
                                const gradient = gradients[index % gradients.length]

                                return (
                                    <div
                                        key={tutor}
                                        className="relative overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                                    >
                                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
                                        <div className="p-5">
                                            <div className="flex items-start justify-between mb-3">
                                                <Label variant="secondary" className="font-medium px-3 py-1">
                                                    {tutor}
                                                </Label>
                                                <div
                                                    className={`text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
                                                >
                                                    {(avgScore as number).toFixed(3)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                <span>{datasetInfo.conversationsByTutor[tutor]} conversations</span>
                                            </div>
                                            <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full bg-gradient-to-r ${gradient} transition-all duration-500`}
                                                    style={{ width: `${(avgScore as number) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                    </div>
                </CardContent>
            </Card>

            {/* Visualization Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Visualization Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Tutor Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <Label className="text-base font-semibold">Select Tutors to Compare</Label>
                            <div className="flex gap-2 text-sm">
                                <button onClick={selectAllTutors} className="text-blue-600 hover:text-blue-800 font-medium">
                                    Select All
                                </button>
                                <span className="text-gray-400">|</span>
                                <button onClick={clearAllTutors} className="text-gray-600 hover:text-gray-800 font-medium">
                                    Clear All
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {datasetInfo.tutors.map((tutor) => (
                                <div key={tutor} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`tutor-${tutor}`}
                                        checked={selectedTutors.includes(tutor)}
                                        onCheckedChange={(checked) => handleTutorToggle(tutor, checked as boolean)}
                                    />
                                    <Label htmlFor={`tutor-${tutor}`} className="text-sm cursor-pointer font-medium">
                                        {tutor}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">Selected: {selectedTutors.length} model(s)</div>
                    </div>

                    {/* Dimension Selection for Spider Plot and Bar Plot */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Dimension Selection for Spider Plot */}
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <Label className="text-base font-semibold">Select Evaluation Dimensions for Spider Plot</Label>
                                <div className="flex gap-2 text-sm">
                                    <button onClick={selectAllDimensions} className="text-blue-600 hover:text-blue-800 font-medium">
                                        Select All
                                    </button>
                                    <span className="text-gray-400">|</span>
                                    <button onClick={clearAllDimensions} className="text-gray-600 hover:text-gray-800 font-medium">
                                        Clear All
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {datasetInfo.dimensions.map((dimension) => (
                                    <div key={dimension} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`dim-${dimension}`}
                                            checked={selectedDimensions.includes(dimension)}
                                            onCheckedChange={(checked) => handleDimensionToggle(dimension, checked as boolean)}
                                        />
                                        <Label htmlFor={`dim-${dimension}`} className="text-sm cursor-pointer font-medium">
                                            {dimension.replace(/_/g, " ")}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 text-sm text-gray-600">Selected: {selectedDimensions.length} dimension(s)</div>
                        </div>

                        {/* Dimension Selection for Bar Plot */}
                        <div>
                            <Label className="text-base font-semibold mb-3 block">Select Evaluation Dimensions for Bar Plot</Label>
                            <Select value={selectedDimensionForBar} onValueChange={setSelectedDimensionForBar}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a dimension" />
                                </SelectTrigger>
                                <SelectContent>
                                    {datasetInfo.dimensions.map((dimension) => (
                                        <SelectItem key={dimension} value={dimension}>
                                            {dimension.replace(/_/g, " ")}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Visualization Tabs */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Dataset Visualization
                    </CardTitle>
                    <DownloadButton
                        elementRef={chartRef}
                        fileName={`dataset-visualization-${activeTab}-${Date.now()}`}
                        buttonText="Download Current Plot"
                    />
                </CardHeader>
                <CardContent ref={chartRef}>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="spider" className="flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Spider Chart
                            </TabsTrigger>
                            <TabsTrigger value="bar" className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Bar Plot
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="spider" className="mt-6">
                            {selectedTutors.length > 0 && selectedDimensions.length > 0 ? (
                                <DatasetSpiderChart
                                    data={spiderChartData}
                                    selectedModels={selectedTutors}
                                    selectedDimensions={selectedDimensions}
                                />
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                    <p className="font-medium">No data to display</p>
                                    <p className="text-sm mt-1">Please select at least one tutor and one dimension</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="bar" className="mt-6">
                            {selectedDimensionForBar ? (
                                <StackedBarChart data={barChartData} dimension={selectedDimensionForBar} />
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                    <p className="font-medium">No dimension selected</p>
                                    <p className="text-sm mt-1">Please select a dimension from the dropdown above</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
