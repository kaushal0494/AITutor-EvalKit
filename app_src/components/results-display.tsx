"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, Zap, Calendar, Target } from "lucide-react"

interface ResultsDisplayProps {
    results: any
}

export function ResultsDisplay({ results }: ResultsDisplayProps) {
    const getScoreBadgeVariant = (score: number) => {
        if (score >= 0.8) return "default"
        if (score >= 0.6) return "secondary"
        return "destructive"
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            {results.type === "autoeval" ? <Zap className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                            {results.type === "autoeval" ? "AutoEval" : "LLMEval"} Results
                        </CardTitle>
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(results.timestamp).toLocaleString()}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{(results.summary.averageScore * 100).toFixed(1)}%</div>
                            <div className="text-sm text-gray-600">Average Score</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{results.summary.totalDimensions}</div>
                            <div className="text-sm text-gray-600">Dimensions Evaluated</div>
                        </div>
                        {results.type === "llmeval" && (
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <div className="text-lg font-bold text-purple-600">{results.summary.modelUsed}</div>
                                <div className="text-sm text-gray-600">Model Used</div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Dimension Scores
                        </h3>
                        {results.dimensions.map((dim: string) => {
                            const score = results.scores[dim]
                            return (
                                <div key={dim} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{dim}</span>
                                        <Badge variant={getScoreBadgeVariant(score)}>{(score * 100).toFixed(1)}%</Badge>
                                    </div>
                                    <Progress value={score * 100} className="h-2" />
                                </div>
                            )
                        })}
                    </div>

                    {results.type === "llmeval" && results.llmAnalysis && (
                        <div className="mt-6 space-y-4">
                            <h3 className="text-lg font-semibold">LLM Analysis</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <h4 className="font-medium text-green-800 mb-2">Strengths</h4>
                                    <ul className="text-sm text-green-700 space-y-1">
                                        {results.llmAnalysis.strengths.map((strength: string, index: number) => (
                                            <li key={index}>• {strength}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="p-4 bg-orange-50 rounded-lg">
                                    <h4 className="font-medium text-orange-800 mb-2">Areas for Improvement</h4>
                                    <ul className="text-sm text-orange-700 space-y-1">
                                        {results.llmAnalysis.improvements.map((improvement: string, index: number) => (
                                            <li key={index}>• {improvement}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-blue-800">Confidence Level</span>
                                    <Badge variant="outline">{(results.llmAnalysis.confidence * 100).toFixed(1)}%</Badge>
                                </div>
                                <Progress value={results.llmAnalysis.confidence * 100} className="h-2 mt-2" />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
