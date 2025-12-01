"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    BarChart3,
    Activity,
    TrendingUp,
    Users,
    ThumbsUp,
    ThumbsDown,
    Plus,
    Minus,
    Info,
    TrendingDown,
    Target,
    Crown,
} from "lucide-react"
import { getDimensionAbbreviation, getDimensionDisplayName, getOrderedDimensions } from "@/lib/dimension-config"

type ImageFormat = "png" | "jpeg" | "jpg"
type ChartType = "spider" | "bar" | "differences" | "summary"
type ComparisonMode = "tutors" | "judges"

interface ComparisonData {
    dimension: string
    tutor1Score: number
    tutor2Score: number
    difference: number
    winner: string
    tutor1Original: number | string
    tutor2Original: number | string
}

interface ResponseData {
    id: string
    question: string
    tutor1Response: string
    tutor2Response: string
    humanRating: number
    llmRating: number
    feedback: string
}

interface ComparisonChartProps {
    firstTutorData: { [dimension: string]: number | string }
    secondTutorData: { [dimension: string]: number | string }
    firstTutorName: string
    secondTutorName: string
    dimensions: string[]
    hideSummary?: boolean
    scrollToTutorSelector?: () => void
    tutor1?: string
    tutor2?: string
    judge1?: string
    judge2?: string
    mode?: ComparisonMode
    onScrollToSelector?: () => void
    onTabChange?: (tab: string) => void
}

interface BestResultsDisplayProps {
    bestResults: { [dimension: string]: { score: number; tutors: string[] } }
    dimensions: string[]
    scrollToTutorSelector?: () => void
}

// Updated to use dimension config
const DIMENSION_LABELS: { [key: string]: string } = {
    Mistake_Identification: "Mistake Identification",
    Mistake_Location: "Mistake Location",
    Revealing_of_the_Answer: "Revealing Answer",
    Providing_Guidance: "Guidance",
    Actionability: "Actionability",
    Coherence: "Coherence",
    Tutor_Tone: "Tutor Tone",
    Humanlikeness: "Humanlikeness",
}

export function ComparisonChart({
    firstTutorData,
    secondTutorData,
    firstTutorName,
    secondTutorName,
    dimensions,
    hideSummary = false,
    scrollToTutorSelector,
    tutor1,
    tutor2,
    judge1,
    judge2,
    mode,
    onScrollToSelector,
    onTabChange,
}: ComparisonChartProps) {
    const [activeTab, setActiveTab] = useState(hideSummary ? "spider" : "summary")
    const [mounted, setMounted] = useState(false)
    const [activeChart, setActiveChart] = useState<ChartType>("spider")
    const [isLoading, setIsLoading] = useState(false)
    const [comparisonData, setComparisonData] = useState<ComparisonData[]>([])
    const [responseData, setResponseData] = useState<ResponseData[]>([])
    const [selectedResponse, setSelectedResponse] = useState<string>("")
    const [userFeedback, setUserFeedback] = useState<string>("")

    useEffect(() => {
        setMounted(true)
    }, [])

    // Handle tab change and notify parent
    const handleTabChange = (tab: string) => {
        setActiveTab(tab)
        if (onTabChange) {
            onTabChange(tab)
        }
    }

    // Helper function to format scores (numeric or categorical)
    const formatScoreValue = (score: number | string): string => {
        if (typeof score === "number") {
            return score.toFixed(3)
        }
        return String(score)
    }

    // Helper function to convert categorical to numeric for visualization
    const categoricalToNumeric = (value: number | string): number => {
        if (typeof value === "number") {
            return value
        }
        const lowerValue = String(value).toLowerCase()
        if (lowerValue === "yes") return 1.0
        if (lowerValue === "to some extent") return 0.5
        if (lowerValue === "no") return 0.07
        return 0.07
    }

    const orderedDimensions = getOrderedDimensions(dimensions)

    // Prepare data for charts
    const chartData = orderedDimensions.map((dim) => ({
        dimension: DIMENSION_LABELS[dim] || dim,
        fullDimension: dim,
        tutor1: categoricalToNumeric(firstTutorData[dim] || 0),
        tutor2: categoricalToNumeric(secondTutorData[dim] || 0),
        tutor1Original: firstTutorData[dim] || 0,
        tutor2Original: secondTutorData[dim] || 0,
        difference: categoricalToNumeric(firstTutorData[dim] || 0) - categoricalToNumeric(secondTutorData[dim] || 0),
    }))

    // Calculate differences for the differences tab
    const differences = orderedDimensions.map((dimension) => {
        const firstScore = categoricalToNumeric(firstTutorData[dimension] || 0)
        const secondScore = categoricalToNumeric(secondTutorData[dimension] || 0)
        const difference = firstScore - secondScore
        const winner = difference > 0 ? firstTutorName : difference < 0 ? secondTutorName : "Tie"

        return {
            dimension: DIMENSION_LABELS[dimension] || dimension,
            firstScore,
            secondScore,
            firstScoreOriginal: firstTutorData[dimension] || 0,
            secondScoreOriginal: secondTutorData[dimension] || 0,
            difference,
            winner,
            absWinMargin: Math.abs(difference),
        }
    })

    // Calculate wins, losses, and ties
    const tutor1Wins = chartData.filter((d) => d.tutor1 > d.tutor2).length
    const tutor2Wins = chartData.filter((d) => d.tutor2 > d.tutor1).length
    const ties = chartData.filter((d) => d.tutor1 === d.tutor2).length

    // Determine overall winner based on wins, not averages
    const getOverallWinner = () => {
        if (tutor1Wins > tutor2Wins) return firstTutorName
        if (tutor2Wins > tutor1Wins) return secondTutorName
        return "Tie"
    }

    // Enhanced Spider Chart Component with Abbreviations
    const SpiderChart = () => {
        if (!mounted) return <div>Loading...</div>

        const angleStep = (2 * Math.PI) / orderedDimensions.length
        const centerX = 200
        const centerY = 200
        const maxRadius = 150

        const getPoints = (data: { [key: string]: number | string }) => {
            return orderedDimensions.map((dim, index) => {
                const angle = index * angleStep - Math.PI / 2
                const score = categoricalToNumeric(data[dim] || 0)
                const r = score * maxRadius
                return {
                    x: centerX + r * Math.cos(angle),
                    y: centerY + r * Math.sin(angle),
                }
            })
        }

        const createPath = (points: { x: number; y: number }[]) => {
            if (points.length === 0) return ""
            return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ") + " Z"
        }

        const tutor1Points = getPoints(firstTutorData)
        const tutor2Points = getPoints(secondTutorData)

        return (
            <div className="flex flex-col items-center w-full">
                <div className="flex items-start gap-8 w-full max-w-5xl">
                    <div className="flex-1 flex justify-center">
                        <svg width={400} height={400} className="border rounded-lg bg-white shadow-sm">
                            {/* Grid circles */}
                            {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale) => (
                                <circle
                                    key={scale}
                                    cx={centerX}
                                    cy={centerY}
                                    r={maxRadius * scale}
                                    fill="none"
                                    stroke="#e5e7eb"
                                    strokeWidth="1"
                                />
                            ))}
                            {/* Axis lines */}
                            {orderedDimensions.map((_, index) => {
                                const angle = index * angleStep - Math.PI / 2
                                const x = centerX + maxRadius * Math.cos(angle)
                                const y = centerY + maxRadius * Math.sin(angle)
                                return <line key={index} x1={centerX} y1={centerY} x2={x} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                            })}
                            {/* Tutor 1 polygon */}
                            <path
                                d={createPath(tutor1Points)}
                                fill="rgba(59, 130, 246, 0.2)"
                                stroke="#3b82f6"
                                strokeWidth="3"
                                opacity="0.8"
                            />
                            {/* Tutor 2 polygon */}
                            <path
                                d={createPath(tutor2Points)}
                                fill="rgba(147, 51, 234, 0.2)"
                                stroke="#9333ea"
                                strokeWidth="3"
                                opacity="0.8"
                            />
                            {/* Tutor 1 points */}
                            {tutor1Points.map((point, index) => (
                                <circle key={`t1-${index}`} cx={point.x} cy={point.y} r="4" fill="#3b82f6" />
                            ))}
                            {/* Tutor 2 points */}
                            {tutor2Points.map((point, index) => (
                                <circle key={`t2-${index}`} cx={point.x} cy={point.y} r="4" fill="#9333ea" />
                            ))}
                            {/* Dimension Labels */}
                            {orderedDimensions.map((dimension, index) => {
                                const angle = index * angleStep - Math.PI / 2
                                const labelRadius = 170
                                const x = centerX + labelRadius * Math.cos(angle)
                                const y = centerY + labelRadius * Math.sin(angle)
                                const abbreviation = getDimensionAbbreviation(dimension)
                                return (
                                    <text
                                        key={index}
                                        x={x}
                                        y={y}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="text-sm font-bold fill-gray-700"
                                    >
                                        {abbreviation}
                                    </text>
                                )
                            })}
                        </svg>
                    </div>
                    {/* Legend */}
                    <div className="flex-shrink-0 w-80 space-y-6">
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Tutors:
                            </h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-blue-500" />
                                    <span className="text-sm text-gray-700">{firstTutorName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-purple-500" />
                                    <span className="text-sm text-gray-700">{secondTutorName}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Dimensions:
                            </h4>
                            <div className="space-y-1">
                                {orderedDimensions.map((dim) => {
                                    const abbreviation = getDimensionAbbreviation(dim)
                                    const displayName = getDimensionDisplayName(dim)
                                    return (
                                        <div key={dim} className="flex items-start gap-2 text-sm">
                                            <span className="font-bold text-gray-800 min-w-[28px]">{abbreviation}:</span>
                                            <span className="text-gray-600">{displayName}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Bar Chart Component - RESTORED for Automated and LLM Evaluation modules
    const BarChart = () => {
        if (!mounted) return <div>Loading...</div>

        const maxScore = Math.max(...chartData.flatMap((d) => [d.tutor1, d.tutor2]), 1)

        return (
            <div className="w-full">
                <div className="grid grid-cols-1 gap-4">
                    {chartData.map((item, index) => (
                        <div key={item.dimension} className="flex items-center gap-4">
                            <div className="w-32 text-sm font-semibold text-gray-700 text-right">{item.dimension}</div>
                            <div className="flex-1 flex items-center gap-4">
                                {/* Tutor 1 bar */}
                                <div className="flex items-center gap-1 flex-1">
                                    <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                                        <div
                                            className="h-6 bg-blue-500 rounded-full transition-all duration-700 ease-out"
                                            style={{ width: `${(item.tutor1 / maxScore) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-blue-600 min-w-12 text-left">
                                        {formatScoreValue(item.tutor1Original)}
                                    </span>
                                </div>
                                {/* Tutor 2 bar */}
                                <div className="flex items-center gap-1 flex-1">
                                    <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                                        <div
                                            className="h-6 bg-purple-500 rounded-full transition-all duration-700 ease-out"
                                            style={{ width: `${(item.tutor2 / maxScore) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-purple-600 min-w-12 text-left">
                                        {formatScoreValue(item.tutor2Original)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Legend */}
                <div className="flex justify-center gap-6 mt-6 pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-sm font-medium">{firstTutorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-purple-500 rounded"></div>
                        <span className="text-sm font-medium">{secondTutorName}</span>
                    </div>
                </div>
            </div>
        )
    }

    // Enhanced Difference Chart Component with Clear Explanations
    const DifferenceChart = () => {
        if (!mounted) return <div>Loading...</div>

        const maxDiff = Math.max(...chartData.map((d) => Math.abs(d.difference)), 0.001)

        return (
            <div className="space-y-6 w-full">
                {/* Legend explaining the differences */}
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Info className="w-5 h-5 text-blue-600" />
                            Understanding the Differences
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-1">
                                    <Plus className="w-4 h-4 text-green-600" />
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-green-800">Positive (+)</div>
                                    <div className="text-green-700">{firstTutorName} performs better</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center gap-1">
                                    <Minus className="w-4 h-4 text-red-600" />
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-red-800">Negative (-)</div>
                                    <div className="text-red-700">{secondTutorName} performs better</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-1">
                                    <Minus className="w-4 h-4 text-gray-600" />
                                    <Target className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-800">Zero (0)</div>
                                    <div className="text-gray-700">Both perform equally</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Differences visualization */}
                <div className="space-y-4">
                    {differences.map((item, index) => {
                        const isPositive = item.difference > 0
                        const isTie = Math.abs(item.difference) < 0.001
                        const percentage = maxDiff > 0 ? Math.abs(item.difference) / maxDiff : 0
                        const width = isTie ? 2 : Math.max(percentage * 100, 5)

                        return (
                            <div key={item.dimension} className="space-y-2">
                                <div className="flex items-center gap-4">
                                    <div className="w-32 text-sm font-semibold text-gray-700 text-right">{item.dimension}</div>
                                    <div className="flex-1 relative">
                                        <div className="flex items-center h-8">
                                            <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                                                <div
                                                    className={`h-6 rounded-full transition-all duration-700 ease-out ${isTie ? "bg-gray-400" : isPositive ? "bg-green-500" : "bg-red-500"
                                                        }`}
                                                    style={{ width: `${width}%` }}
                                                />
                                            </div>
                                            <div className="ml-4 min-w-[120px] flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-sm font-bold ${isTie
                                                        ? "bg-gray-100 text-gray-600 border-gray-300"
                                                        : isPositive
                                                            ? "bg-green-100 text-green-700 border-green-300"
                                                            : "bg-red-100 text-red-700 border-red-300"
                                                        }`}
                                                >
                                                    {isTie ? "0.000" : (isPositive ? "+" : "") + item.difference.toFixed(3)}
                                                </Badge>
                                                {!isTie && (
                                                    <div className="flex items-center gap-1">
                                                        {isPositive ? (
                                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                                        ) : (
                                                            <TrendingDown className="w-4 h-4 text-red-600" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Winner indication with scores */}
                                <div className="flex items-center gap-4">
                                    <div className="w-32"></div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded">
                                            <div className="flex items-center gap-4">
                                                <span>
                                                    <strong>{firstTutorName}:</strong> {formatScoreValue(item.firstScoreOriginal)}
                                                </span>
                                                <span>
                                                    <strong>{secondTutorName}:</strong> {formatScoreValue(item.secondScoreOriginal)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {!isTie && <Crown className="w-3 h-3 text-yellow-600" />}
                                                <span className="font-semibold">
                                                    {isTie ? "Tie" : `${item.winner} leads by ${item.absWinMargin.toFixed(3)}`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    // Performance Summary
    const PerformanceSummary = () => {
        const overallWinner = getOverallWinner()
        return (
            <div className="space-y-6">
                {/* Winner Declaration */}
                <Card
                    className={`${overallWinner === "Tie"
                        ? "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
                        : "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200"
                        }`}
                >
                    <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Crown className="w-6 h-6 text-emerald-600" />
                            <div className="text-2xl font-bold text-emerald-600">
                                {overallWinner === "Tie" ? "It's a Tie!" : `${overallWinner} Wins!`}
                            </div>
                        </div>
                        <div className="text-sm text-emerald-700 font-medium">
                            {overallWinner === "Tie" ? "Both tutors performed equally" : "Based on dimension wins"}
                        </div>
                    </CardContent>
                </Card>
                {/* Win/Loss/Tie Statistics */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-4 text-center">
                            <div className="text-3xl font-bold text-blue-600">{tutor1Wins}</div>
                            <div className="text-sm text-blue-700 font-medium">{firstTutorName} Leads</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardContent className="p-4 text-center">
                            <div className="text-3xl font-bold text-purple-600">{tutor2Wins}</div>
                            <div className="text-sm text-purple-700 font-medium">{secondTutorName} Leads</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
                        <CardContent className="p-4 text-center">
                            <div className="text-3xl font-bold text-gray-600">{ties}</div>
                            <div className="text-sm text-gray-700 font-medium">Ties</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (!mounted) {
        return <div>Loading comparison chart...</div>
    }

    // Determine which tabs to show - RESTORED Bar Chart for Automated and LLM Evaluation modules
    const tabsToShow = hideSummary ? ["spider", "bars", "difference"] : ["summary", "spider", "bars", "difference"]
    const tabsConfig = {
        summary: { label: "Summary", icon: TrendingUp, component: PerformanceSummary },
        spider: { label: "Spider Chart", icon: Activity, component: SpiderChart },
        bars: { label: "Bar Chart", icon: BarChart3, component: BarChart },
        difference: { label: "Differences", icon: null, component: DifferenceChart },
    }

    return (
        <div className="w-full">
            {/* This div will be captured by the download function - includes tabs and content */}
            <div id="comparison-full-chart" className="w-full">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className={`grid w-full ${hideSummary ? "grid-cols-3" : "grid-cols-4"} mb-6`}>
                        {tabsToShow.map((tabKey) => {
                            const tab = tabsConfig[tabKey as keyof typeof tabsConfig]
                            return (
                                <TabsTrigger key={tabKey} value={tabKey} className="flex items-center gap-2">
                                    {tab.icon && <tab.icon className="w-4 h-4" />}
                                    {tab.label}
                                </TabsTrigger>
                            )
                        })}
                    </TabsList>
                    {tabsToShow.map((tabKey) => {
                        const tab = tabsConfig[tabKey as keyof typeof tabsConfig]
                        return (
                            <TabsContent key={tabKey} value={tabKey} className="mt-6 w-full">
                                {tab.component()}
                            </TabsContent>
                        )
                    })}
                </Tabs>
            </div>
        </div>
    )
}

// Enhanced Response Comparison Component
export function ResponseComparison({
    firstTutorName,
    firstResponse,
    secondTutorName,
    secondResponse,
    onPreference,
}: {
    firstTutorName: string
    firstResponse: string
    secondTutorName: string
    secondResponse: string
    onPreference: (preference: "first" | "second" | "both_good" | "both_bad") => void
}) {
    const [userPreference, setUserPreference] = useState<"first" | "second" | "both_good" | "both_bad" | null>(null)

    const handlePreference = (preference: "first" | "second" | "both_good" | "both_bad") => {
        setUserPreference(preference)
        onPreference(preference)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-center">Which response do you think is better?</CardTitle>
                <p className="text-sm text-gray-600 text-center">
                    Compare the two tutor responses and let us know your preference
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* First Tutor Response */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-700">{firstTutorName}</Badge>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm">{firstResponse}</p>
                        </div>
                    </div>
                    {/* Second Tutor Response */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-purple-100 text-purple-700">{secondTutorName}</Badge>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-sm">{secondResponse}</p>
                        </div>
                    </div>
                </div>
                {/* Preference Buttons */}
                <div className="flex justify-center gap-4 pt-4 border-t flex-wrap">
                    <button
                        onClick={() => handlePreference("first")}
                        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${userPreference === "first"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                            }`}
                    >
                        <ThumbsUp className="w-4 h-4" />
                        {firstTutorName} is Better
                    </button>
                    <button
                        onClick={() => handlePreference("second")}
                        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${userPreference === "second"
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                            }`}
                    >
                        <ThumbsUp className="w-4 h-4" />
                        {secondTutorName} is Better
                    </button>
                    <button
                        onClick={() => handlePreference("both_good")}
                        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${userPreference === "both_good"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                            }`}
                    >
                        <ThumbsUp className="w-4 h-4" />
                        Both are Good
                    </button>
                    <button
                        onClick={() => handlePreference("both_bad")}
                        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${userPreference === "both_bad"
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                            }`}
                    >
                        <ThumbsDown className="w-4 h-4" />
                        Both are Bad
                    </button>
                </div>
                {/* Feedback Display */}
                {userPreference && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm text-gray-700">
                            <span className="font-medium">Your preference:</span>{" "}
                            {userPreference === "first"
                                ? `${firstTutorName} is better`
                                : userPreference === "second"
                                    ? `${secondTutorName} is better`
                                    : userPreference === "both_good"
                                        ? "Both responses are good"
                                        : "Both responses are bad"}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// New Single Response Rating Component
export function SingleResponseRating({
    tutorName,
    response,
    onRating,
}: {
    tutorName: string
    response: string
    onRating: (rating: "helpful" | "not-helpful") => void
}) {
    const [userRating, setUserRating] = useState<"helpful" | "not-helpful" | null>(null)

    const handleRating = (rating: "helpful" | "not-helpful") => {
        setUserRating(rating)
        onRating(rating)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-center">How helpful is this response?</CardTitle>
                <p className="text-sm text-gray-600 text-center">Rate the tutor's response to help us improve the system</p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Response Display */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-700">{tutorName}</Badge>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm">{response}</p>
                    </div>
                </div>
                {/* Rating Buttons */}
                <div className="flex justify-center gap-4 pt-4 border-t">
                    <button
                        onClick={() => handleRating("helpful")}
                        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${userRating === "helpful"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                            }`}
                    >
                        <ThumbsUp className="w-4 h-4" />
                        Helpful
                    </button>
                    <button
                        onClick={() => handleRating("not-helpful")}
                        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${userRating === "not-helpful"
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                            }`}
                    >
                        <ThumbsDown className="w-4 h-4" />
                        Not Helpful
                    </button>
                </div>
                {/* Feedback Display */}
                {userRating && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm text-gray-700">
                            <span className="font-medium">Your rating:</span>{" "}
                            {userRating === "helpful" ? "👍 This response is helpful" : "👎 This response is not helpful"}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Best Results Component for Single Mode
export function BestResultsDisplay({ bestResults, dimensions, scrollToTutorSelector }: BestResultsDisplayProps) {
    if (!bestResults || Object.keys(bestResults).length === 0) {
        return null
    }

    const handleScrollToTutorSelector = () => {
        if (scrollToTutorSelector) {
            scrollToTutorSelector()
        }
    }

    // Helper function to format score (numeric or categorical)
    const formatBestScore = (score: number | string): string => {
        if (typeof score === "string") {
            return score // Return categorical value as-is
        }
        return score.toFixed(3) // Format numeric value
    }

    // Helper function to get badge color for categorical values
    const getCategoricalBadgeColor = (value: number | string): string => {
        if (typeof value === "number") {
            return "text-amber-600" // Default for numeric
        }
        const lowerValue = String(value).toLowerCase()
        if (lowerValue === "yes") return "text-green-600"
        if (lowerValue === "no") return "text-red-600"
        if (lowerValue.includes("some extent")) return "text-yellow-600"
        return "text-amber-600"
    }

    // Helper function to get full badge styling for categorical badges
    const getCategoricalBadgeStyle = (value: number | string): string => {
        if (typeof value === "number") {
            return "" // No special styling for numeric
        }
        const lowerValue = String(value).toLowerCase()
        if (lowerValue === "yes") return "bg-green-100 text-green-800 border-green-300"
        if (lowerValue === "no") return "bg-red-100 text-red-800 border-red-300"
        if (lowerValue.includes("some extent")) return "bg-yellow-100 text-yellow-800 border-yellow-300"
        return "bg-blue-100 text-blue-800 border-blue-300"
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-600" />
                    Best Performance by Dimension
                </CardTitle>
                <p className="text-sm text-gray-600">Highest scores achieved across all tutors in this conversation according to our evaluation model</p>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(bestResults).map(([dimension, best]) => (
                        <div
                            key={dimension}
                            className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 shadow-sm"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="font-semibold text-gray-800 mb-1">{getDimensionDisplayName(dimension)}</div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm text-amber-700 font-medium">Best:</span>
                                        {best.tutors.length === 1 ? (
                                            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                                                {best.tutors[0]}
                                            </Badge>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {best.tutors.map((tutor, index) => (
                                                    <Badge
                                                        key={`${tutor}-${index}`}
                                                        variant="outline"
                                                        className="bg-amber-100 text-amber-800 border-amber-300"
                                                    >
                                                        {tutor}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {best.tutors.length > 1 && (
                                        <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            Tied for best
                                        </div>
                                    )}
                                </div>
                                <div className="ml-2">
                                    {typeof best.score === "string" ? (
                                        <Badge className={`text-base font-bold px-3 py-1 ${getCategoricalBadgeStyle(best.score)}`}>
                                            {formatBestScore(best.score)}
                                        </Badge>
                                    ) : (
                                        <div className={`text-xl font-bold ${getCategoricalBadgeColor(best.score)}`}>
                                            {formatBestScore(best.score)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-6 border-t">
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-gray-700 mb-2">Would you like to see results for another tutor?</p>
                        <Button
                            variant="link"
                            onClick={handleScrollToTutorSelector}
                            className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors duration-200 hover:bg-blue-100 px-2 py-1 rounded"
                        >
                            Click here to select a different tutor
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
