"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    AlertCircle,
    MessageSquare,
    Loader2,
    Users,
    Target,
    Layers,
    GitCompare,
    Brain,
    CheckCircle2,
} from "lucide-react"
import { ComparisonChart, BestResultsDisplay } from "@/components/charts/comparison-chart"
import { DownloadButton } from "@/components/download-button"
import { getOrderedDimensions } from "@/lib/dimension-config"

interface LLMEvalDatasetProps {
    onResults: (results: any) => void
    results: any[]
}

interface LLMEvalData {
    problemTopics: string[]
    models: string[]
    dimensions: string[]
    judgeLLMs: string[]
    totalConversations: number
}

interface EvalResults {
    results: { [dimension: string]: number | string }
    conversationHistory: string
    conversationId: string
    modelResponse: string
    modelName: string
    judgeLLM: string
    totalConversationsForTopic: number
    comparisonMode?: boolean
    judgeComparisonMode?: boolean
    secondResults?: { [dimension: string]: number | string }
    secondModelResponse?: string
    secondModelName?: string
    secondJudgeLLM?: string
    bestResults?: { [dimension: string]: { score: number | string; tutors: string[] } }
}

const DIMENSION_LABELS: { [key: string]: string } = {
    Mistake_Identification: "Mistake Identification",
    Mistake_Location: "Mistake Location",
    Revealing_of_the_Answer: "Revealing Answer",
    Providing_Guidance: "Providing Guidance",
    Actionability: "Actionability",
    Coherence: "Coherence",
    Tutor_Tone: "Tutor Tone",
    Humanlikeness: "Humanlikeness",
}

const JUDGE_LLM_LABELS: { [key: string]: string } = {
    GPT5: "GPT-5",
    Prometheus: "Prometheus",
}

const formatScore = (score: number | string): string => {
    if (typeof score === "string") {
        return score
    }
    return score.toFixed(3)
}

const getCategoricalBadgeColor = (value: string): string => {
    const lowerValue = value.toLowerCase()
    if (lowerValue === "yes") return "bg-green-100 text-green-800 border-green-300"
    if (lowerValue === "no") return "bg-red-100 text-red-800 border-red-300"
    if (lowerValue.includes("some extent")) return "bg-yellow-100 text-yellow-800 border-yellow-300"
    return "bg-gray-100 text-gray-800 border-gray-300"
}

export function LLMEvalDataset({ onResults, results }: LLMEvalDatasetProps) {
    const [data, setData] = useState<LLMEvalData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>("")
    const [selectionError, setSelectionError] = useState<string>("")
    const [selectedTopic, setSelectedTopic] = useState<string>("")
    const [selectedModel, setSelectedModel] = useState<string>("")
    const [selectedDimensions, setSelectedDimensions] = useState<string[]>([])
    const [selectedJudgeLLM, setSelectedJudgeLLM] = useState<string>("")
    const [evalResults, setEvalResults] = useState<EvalResults | null>(null)
    const [evaluating, setEvaluating] = useState(false)

    const [comparisonMode, setComparisonMode] = useState(false)
    const [secondModel, setSecondModel] = useState<string>("")

    const [judgeComparisonMode, setJudgeComparisonMode] = useState(false)
    const [secondJudgeLLM, setSecondJudgeLLM] = useState<string>("")

    const [contextLoading, setContextLoading] = useState(false)
    const [conversationContext, setConversationContext] = useState<string>("")
    const [conversationId, setConversationId] = useState<string>("")
    const [tutorResponseLoading, setTutorResponseLoading] = useState(false)
    const [tutorResponse, setTutorResponse] = useState<string>("")
    const [secondTutorResponse, setSecondTutorResponse] = useState<string>("")

    const [selectedPreference, setSelectedPreference] = useState<string>("")
    const [feedbackSaving, setFeedbackSaving] = useState(false)
    const [feedbackSaved, setFeedbackSaved] = useState(false)
    const [feedbackError, setFeedbackError] = useState<string>("")

    const [groundTruthSolution, setGroundTruthSolution] = useState<string>("")
    const [showGroundTruth, setShowGroundTruth] = useState(false)

    const isCustomMode = process.env.NEXT_PUBLIC_IS_CUSTOM_MODE === "true"

    const resultsRef = useRef<HTMLDivElement>(null)
    const scoresRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<HTMLDivElement>(null)

    const prevTopicRef = useRef<string>("")

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if (!comparisonMode && !judgeComparisonMode) {
            setSelectedModel("")
            setSecondModel("")
            setSelectedJudgeLLM("")
            setSecondJudgeLLM("")
            setSelectedDimensions([])
            setEvalResults(null)
            setTutorResponse("")
            setSecondTutorResponse("")
            // so the selected problem's context remains visible
            // setConversationContext("")
            // setConversationId("")
            setGroundTruthSolution("")
            setShowGroundTruth(false)
            setSelectedPreference("")
            setFeedbackSaved(false)
            setFeedbackError("")
        }
    }, [comparisonMode, judgeComparisonMode])

    useEffect(() => {
        if (comparisonMode && selectedTopic && selectedModel && !tutorResponse) {
            fetchTutorResponse(selectedTopic, selectedModel, false)
        }
    }, [comparisonMode, selectedTopic, selectedModel, tutorResponse])

    useEffect(() => {
        if (selectedModel) {
            setEvalResults(null)
            setSelectedDimensions([])
        }
    }, [selectedModel])

    useEffect(() => {
        if (secondModel) {
            setEvalResults(null)
            setSelectedDimensions([])
        }
    }, [secondModel])

    useEffect(() => {
        if (
            prevTopicRef.current &&
            prevTopicRef.current !== "" &&
            prevTopicRef.current !== selectedTopic &&
            selectedTopic !== ""
        ) {
            setSelectedModel("")
            setSecondModel("")
            setSelectedJudgeLLM("")
            setSecondJudgeLLM("")
            setEvalResults(null)
            setSelectedDimensions([])
            setComparisonMode(false)
            setJudgeComparisonMode(false)
            setGroundTruthSolution("")
            setShowGroundTruth(false)
            setTutorResponse("")
            setSecondTutorResponse("")
            // Don't reset conversationId or conversationContext - they're handled by fetchConversationContext
            setSelectedPreference("")
            setFeedbackSaved(false)
            setFeedbackError("")
        }

        // Update the ref to track current topic
        prevTopicRef.current = selectedTopic
    }, [selectedTopic])

    const loadData = async () => {
        try {
            setLoading(true)
            const response = await fetch("/api/llmeval-data")
            const result = await response.json()
            if (result.success) {
                setData(result)
            } else {
                setError(result.error || "Failed to load data")
            }
        } catch (err) {
            setError("Failed to load dataset")
        } finally {
            setLoading(false)
        }
    }

    const handleDimensionChange = (dimension: string, checked: boolean) => {
        if (checked) {
            setSelectedDimensions((prev) => [...prev, dimension])
        } else {
            setSelectedDimensions((prev) => prev.filter((d) => d !== dimension))
        }
    }

    const handleSelectAll = () => {
        if (data) {
            setSelectedDimensions([...data.dimensions])
        }
    }

    const handleClearAll = () => {
        setSelectedDimensions([])
        setEvalResults(null)
    }

    const saveFeedback = async (feedbackData: {
        preference?: string // Changed from union type to string to accept tutor names
    }) => {
        if (!selectedTopic || !selectedModel || !conversationId) {
            setFeedbackError("Missing required data to save feedback")
            return
        }

        try {
            setFeedbackSaving(true)
            setFeedbackError("")

            const response = await fetch("/api/save-feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    problemTopic: selectedTopic,
                    conversationId: conversationId,
                    evaluationType: comparisonMode ? "comparison" : "single",
                    firstTutor: selectedModel,
                    secondTutor: comparisonMode ? secondModel : undefined,
                    preference: feedbackData.preference,
                    module: "llmeval",
                    timestamp: new Date().toISOString(),
                }),
            })

            const result = await response.json()

            if (result.success) {
                setFeedbackSaved(true)
                console.log("✅ Feedback saved successfully:", result.feedbackId)
            } else {
                setFeedbackError(result.error || "Failed to save feedback")
            }
        } catch (err) {
            console.error("Error saving feedback:", err)
            setFeedbackError("Failed to save feedback. Please try again.")
        } finally {
            setFeedbackSaving(false)
        }
    }

    const handlePreference = async (preference: "first" | "second" | "both" | "both-bad") => {
        setSelectedPreference(preference)

        // Convert preference to actual value to store
        let preferenceValue: string
        if (preference === "first") {
            preferenceValue = selectedModel
        } else if (preference === "second") {
            preferenceValue = secondModel
        } else if (preference === "both") {
            preferenceValue = "Both Good"
        } else {
            preferenceValue = "Both Bad"
        }

        console.log("User preference:", preferenceValue)
        await saveFeedback({ preference: preferenceValue })
    }

    const handleJudgeLLMChange = (judge: string) => {
        setSelectedJudgeLLM(judge)
        setSelectionError("")
        if (judgeComparisonMode && judge === secondJudgeLLM && judge !== "") {
            setSelectionError("Please select different judge LLMs for comparison")
            return
        }
    }

    const handleSecondJudgeLLMChange = (judge: string) => {
        setSecondJudgeLLM(judge)
        setSelectionError("")
        if (judgeComparisonMode && judge === selectedJudgeLLM && judge !== "") {
            setSelectionError("Please select different judge LLMs for comparison")
            return
        }
    }

    const handleModelChange = (model: string) => {
        setSelectedModel(model)
        setSelectionError("")
        setSelectedPreference("")
        setFeedbackSaved(false)
        setFeedbackError("")
        setShowGroundTruth(false)

        if (comparisonMode && !judgeComparisonMode && model === secondModel && model !== "") {
            setSelectionError("Please select different tutors for comparison")
            return
        }
        if (selectedTopic && model) {
            fetchTutorResponse(selectedTopic, model, false)
        }
    }

    const handleSecondModelChange = (model: string) => {
        setSecondModel(model)
        setSelectionError("")
        setSelectedPreference("")
        setFeedbackSaved(false)
        setFeedbackError("")
        setShowGroundTruth(false)

        if (comparisonMode && !judgeComparisonMode && model === selectedModel && model !== "") {
            setSelectionError("Please select different tutors for comparison")
            return
        }
        if (selectedTopic && model) {
            fetchTutorResponse(selectedTopic, model, true)
        }
    }

    const handleEvaluate = async () => {
        if (!selectedTopic || !selectedModel || !selectedJudgeLLM || selectedDimensions.length === 0) {
            setError("Please select a topic, model, judge LLM, and at least one dimension")
            return
        }
        if (comparisonMode && !judgeComparisonMode && !secondModel) {
            setError("Please select a second tutor for comparison")
            return
        }
        if (judgeComparisonMode && !secondJudgeLLM) {
            setError("Please select a second judge LLM for comparison")
            return
        }
        if (comparisonMode && !judgeComparisonMode && selectedModel === secondModel) {
            setError("Please select different tutors for comparison")
            return
        }
        if (judgeComparisonMode && selectedJudgeLLM === secondJudgeLLM) {
            setError("Please select different judge LLMs for comparison")
            return
        }

        try {
            setEvaluating(true)
            setError("")
            const response = await fetch("/api/llmeval-results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    problemTopic: selectedTopic,
                    selectedModel,
                    selectedDimensions,
                    judgeLLM: selectedJudgeLLM,
                    comparisonMode,
                    judgeComparisonMode,
                    secondModel: comparisonMode && !judgeComparisonMode ? secondModel : undefined,
                    secondJudgeLLM: judgeComparisonMode ? secondJudgeLLM : undefined,
                }),
            })
            const result = await response.json()
            if (result.success) {
                setEvalResults(result)
                onResults(result)
                if (result.conversationId) {
                    setConversationId(result.conversationId)
                }
            } else {
                setError(result.error || "Failed to get results")
            }
        } catch (err) {
            setError("Failed to evaluate")
        } finally {
            setEvaluating(false)
        }
    }

    const formatConversationHistory = (history: string) => {
        // This regex uses positive lookahead to split before each speaker label while keeping the label with its content
        const regex = /(?=(Tutor:|Student:))/i
        const parts = history.split(regex).filter((part) => part.trim() !== "")

        const messages: { speaker: string; text: string }[] = []

        for (const part of parts) {
            const trimmedPart = part.trim()
            if (!trimmedPart) continue

            // Check if this part starts with Tutor: or Student:
            if (trimmedPart.match(/^(Tutor|Student):/i)) {
                // Extract speaker and content
                const colonIndex = trimmedPart.indexOf(":")
                if (colonIndex > 0) {
                    const speaker = trimmedPart.substring(0, colonIndex).trim()
                    const content = trimmedPart.substring(colonIndex + 1).trim()

                    if (content) {
                        const normalizedSpeaker = speaker.toLowerCase().includes("tutor") ? "Tutor" : "Student"
                        messages.push({
                            speaker: normalizedSpeaker,
                            text: content,
                        })
                    }
                }
            }
        }

        return messages
    }

    const fetchConversationContext = async (topic: string) => {
        try {
            setContextLoading(true)
            const response = await fetch("/api/llmeval-context", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ problemTopic: topic }),
            })
            const result = await response.json()
            if (result.success) {
                setConversationContext(result.conversationHistory)
                if (result.conversationId) {
                    setConversationId(result.conversationId)
                }
            } else {
                setConversationContext("")
                setConversationId("")
            }
        } catch (err) {
            setConversationContext("")
            setConversationId("")
        } finally {
            setContextLoading(false)
        }
    }

    const fetchTutorResponse = async (topic: string, model: string, isSecondModel = false) => {
        if (!topic || !model) return
        try {
            setTutorResponseLoading(true)
            const response = await fetch("/api/llmeval-results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    problemTopic: topic,
                    selectedModel: model,
                    responseOnly: true,
                }),
            })
            const result = await response.json()
            if (result.success) {
                if (isSecondModel) {
                    setSecondTutorResponse(result.modelResponse || "")
                } else {
                    setTutorResponse(result.modelResponse || "")
                }
                if (result.conversationId && !conversationId) {
                    setConversationId(result.conversationId)
                }
                if (result.groundTruthSolution) {
                    setGroundTruthSolution(result.groundTruthSolution)
                }
            } else {
                if (isSecondModel) {
                    setSecondTutorResponse("")
                } else {
                    setTutorResponse("")
                }
            }
        } catch (err) {
            if (isSecondModel) {
                setSecondTutorResponse("")
            } else {
                setTutorResponse("")
            }
        } finally {
            setTutorResponseLoading(false)
        }
    }

    const handleTopicChange = (topic: string) => {
        setSelectedTopic(topic)
        setTutorResponse("")
        setSecondTutorResponse("")
        setConversationId("")
        setSelectedPreference("")
        setFeedbackSaved(false)
        setFeedbackError("")

        if (topic) {
            fetchConversationContext(topic)
        } else {
            setConversationContext("")
        }
    }

    const handleTutorSelect = (tutor: string) => {
        setSelectedModel(tutor)
        if (selectedTopic) {
            fetchTutorResponse(selectedTopic, tutor)
        }
    }

    const scrollToTutorSelector = () => {
        if (comparisonMode) {
            if (judgeComparisonMode) {
                const firstJudgeSection = document.querySelector('[data-judge="first"]')
                const secondJudgeSection = document.querySelector('[data-judge="second"]')

                if (firstJudgeSection) {
                    const rect = firstJudgeSection.getBoundingClientRect()
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
                    const targetPosition = rect.top + scrollTop - 100

                    window.scrollTo({
                        top: targetPosition,
                        behavior: "smooth",
                    })

                    firstJudgeSection.classList.add(
                        "ring-4",
                        "ring-purple-500",
                        "ring-opacity-75",
                        "transition-all",
                        "duration-500",
                    )
                    if (secondJudgeSection) {
                        secondJudgeSection.classList.add(
                            "ring-4",
                            "ring-pink-500",
                            "ring-opacity-75",
                            "transition-all",
                            "duration-500",
                        )
                    }

                    setTimeout(() => {
                        firstJudgeSection.classList.remove(
                            "ring-4",
                            "ring-purple-500",
                            "ring-opacity-75",
                            "transition-all",
                            "duration-500",
                        )
                        if (secondJudgeSection) {
                            secondJudgeSection.classList.remove(
                                "ring-4",
                                "ring-pink-500",
                                "ring-opacity-75",
                                "transition-all",
                                "duration-500",
                            )
                        }
                    }, 3000)
                }
            } else {
                const firstTutorSection = document.querySelector('[data-tutor="first"]')
                const secondTutorSection = document.querySelector('[data-tutor="second"]')

                if (firstTutorSection) {
                    const rect = firstTutorSection.getBoundingClientRect()
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
                    const targetPosition = rect.top + scrollTop - 100

                    window.scrollTo({
                        top: targetPosition,
                        behavior: "smooth",
                    })

                    firstTutorSection.classList.add(
                        "ring-4",
                        "ring-blue-500",
                        "ring-opacity-75",
                        "transition-all",
                        "duration-500",
                    )
                    if (secondTutorSection) {
                        secondTutorSection.classList.add(
                            "ring-4",
                            "ring-purple-500",
                            "ring-opacity-75",
                            "transition-all",
                            "duration-500",
                        )
                    }

                    setTimeout(() => {
                        firstTutorSection.classList.remove(
                            "ring-4",
                            "ring-blue-500",
                            "ring-opacity-75",
                            "transition-all",
                            "duration-500",
                        )
                        if (secondTutorSection) {
                            secondTutorSection.classList.remove(
                                "ring-4",
                                "ring-purple-500",
                                "ring-opacity-75",
                                "transition-all",
                                "duration-500",
                            )
                        }
                    }, 3000)
                }
            }
        } else {
            const tutorSection = document.querySelector('[data-tutor="first"]')

            if (tutorSection) {
                const rect = tutorSection.getBoundingClientRect()
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop
                const targetPosition = rect.top + scrollTop - 100

                window.scrollTo({
                    top: targetPosition,
                    behavior: "smooth",
                })

                tutorSection.classList.add("ring-4", "ring-blue-500", "ring-opacity-75", "transition-all", "duration-500")
                setTimeout(() => {
                    tutorSection.classList.remove("ring-4", "ring-blue-500", "ring-opacity-75", "transition-all", "duration-500")
                }, 3000)
            }
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading dataset...</span>
            </div>
        )
    }

    if (error && !data) {
        return (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
            </div>
        )
    }

    const getDownloadButtonText = (tabValue: string) => {
        switch (tabValue) {
            case "spider":
                return "Download Spider Chart"
            case "difference":
                return "Download Differences"
            default:
                return "Download Chart"
        }
    }

    // New handler functions for comparison mode changes
    const handleComparisonModeChange = (checked: boolean) => {
        setComparisonMode(checked as boolean)
        if (checked) setJudgeComparisonMode(false)
        setSelectionError("")
        setSelectedPreference("")
        setFeedbackSaved(false)
        setFeedbackError("")
        setShowGroundTruth(false) // Reset ground truth visibility when mode changes
    }

    const handleJudgeComparisonModeChange = (checked: boolean) => {
        setJudgeComparisonMode(checked as boolean)
        if (checked) setComparisonMode(false)
        setSelectionError("")
        setShowGroundTruth(false) // Reset ground truth visibility when mode changes
    }

    const prepareJSONExport = () => {
        if (!evalResults) return null

        if (!comparisonMode && !judgeComparisonMode) {
            // Single tutor, single judge mode
            return {
                id: conversationId,
                problemTopic: selectedTopic,
                tutor: selectedModel,
                judgeLLM: selectedJudgeLLM,
                evaluationType: "single",
                dimensions: evalResults.results,
                timestamp: new Date().toISOString(),
            }
        } else if (comparisonMode && !judgeComparisonMode) {
            // Tutor comparison mode
            return {
                id: conversationId,
                problemTopic: selectedTopic,
                judgeLLM: selectedJudgeLLM,
                evaluationType: "tutor-comparison",
                firstTutor: {
                    name: selectedModel,
                    dimensions: evalResults.results,
                },
                secondTutor: {
                    name: secondModel,
                    dimensions: evalResults.secondResults,
                },
                timestamp: new Date().toISOString(),
            }
        } else if (judgeComparisonMode) {
            // Judge comparison mode
            return {
                id: conversationId,
                problemTopic: selectedTopic,
                tutor: selectedModel,
                evaluationType: "judge-comparison",
                firstJudge: {
                    name: selectedJudgeLLM,
                    dimensions: evalResults.results,
                },
                secondJudge: {
                    name: secondJudgeLLM,
                    dimensions: evalResults.secondResults,
                },
                timestamp: new Date().toISOString(),
            }
        }
    }

    return (
        <div className="space-y-6">
            {data && (
                <Card className="bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 border-0 shadow-lg">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3 text-gray-800">
                            <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg shadow-md">
                                <Brain className="w-5 h-5" />
                            </div>
                            Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm font-medium text-gray-600">Topics</span>
                                </div>
                                <div className="text-2xl font-bold text-purple-600">{data.problemTopics.length}</div>
                            </div>
                            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                                    <span className="text-sm font-medium text-gray-600">Conversations</span>
                                </div>
                                <div className="text-2xl font-bold text-emerald-600">{data.totalConversations}</div>
                            </div>
                            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="w-4 h-4 text-pink-600" />
                                    <span className="text-sm font-medium text-gray-600">Tutors</span>
                                </div>
                                <div className="text-2xl font-bold text-pink-600">{data.models.length}</div>
                            </div>
                            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Layers className="w-4 h-4 text-indigo-600" />
                                    <span className="text-sm font-medium text-gray-600">Evaluation Dimensions</span>
                                </div>
                                <div className="text-2xl font-bold text-indigo-600">{data.dimensions.length}</div>
                            </div>
                            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Brain className="w-4 h-4 text-violet-600" />
                                    <span className="text-sm font-medium text-gray-600">Judge LLMs</span>
                                </div>
                                <div className="text-2xl font-bold text-violet-600">{data.judgeLLMs.length}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="comparison-mode"
                                checked={comparisonMode}
                                onCheckedChange={handleComparisonModeChange} // Use new handler
                            />
                            <Label htmlFor="comparison-mode" className="flex items-center gap-2 text-sm font-medium">
                                <GitCompare className="w-4 h-4" />
                                Enable Tutor Comparison Mode (Compare Two Tutors)
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="judge-comparison-mode"
                                checked={judgeComparisonMode}
                                onCheckedChange={handleJudgeComparisonModeChange} // Use new handler
                            />
                            <Label htmlFor="judge-comparison-mode" className="flex items-center gap-2 text-sm font-medium">
                                <Brain className="w-4 h-4" />
                                Enable Judge Comparison Mode (Compare Two Judge LLMs)
                            </Label>
                        </div>
                        {(comparisonMode || judgeComparisonMode) && (
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                {comparisonMode
                                    ? "Compare responses from two different tutor models"
                                    : "Compare evaluations from two different judge LLMs"}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-2">
                <Label htmlFor="topic-select">Problem Topic</Label>
                <Select value={selectedTopic} onValueChange={handleTopicChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a problem topic..." />
                    </SelectTrigger>
                    <SelectContent>
                        {data?.problemTopics.map((topic) => (
                            <SelectItem key={topic} value={topic}>
                                {topic}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedTopic && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Context
                        </CardTitle>
                        <div className="flex gap-2 text-sm text-gray-600">
                            <Badge variant="outline">{selectedTopic}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {contextLoading ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                <span>Loading conversation context...</span>
                            </div>
                        ) : conversationContext ? (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {formatConversationHistory(conversationContext).map((turn, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-lg ${turn.speaker === "Tutor"
                                            ? "bg-blue-50 border-l-4 border-blue-400"
                                            : "bg-green-50 border-l-4 border-green-400"
                                            }`}
                                    >
                                        <div className="font-medium text-sm mb-1 text-gray-700">{turn.speaker}:</div>
                                        <div className="text-sm">{turn.text}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500 italic p-4 text-center">
                                No conversation context available for this topic.
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="space-y-6">
                {!comparisonMode && !judgeComparisonMode ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2" data-judge="first">
                            <Label htmlFor="judge-select">Judge LLM</Label>
                            <Select value={selectedJudgeLLM} onValueChange={handleJudgeLLMChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a judge LLM..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {data?.judgeLLMs.map((judge) => (
                                        <SelectItem key={judge} value={judge}>
                                            <div className="flex items-center gap-2">
                                                <Brain className="w-4 h-4" />
                                                {JUDGE_LLM_LABELS[judge] || judge}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2" data-tutor="first">
                            <Label htmlFor="model-select">Tutor</Label>
                            <Select value={selectedModel} onValueChange={handleModelChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a tutor..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {data?.models.map((model) => (
                                        <SelectItem key={model} value={model}>
                                            {model}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                ) : comparisonMode ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2" data-tutor="first">
                                <Label htmlFor="model-select">First Tutor</Label>
                                <Select value={selectedModel} onValueChange={handleModelChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a tutor..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {data?.models
                                            .filter((model) => model !== secondModel)
                                            .map((model) => (
                                                <SelectItem key={model} value={model}>
                                                    {model}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2" data-tutor="second">
                                <Label htmlFor="second-model-select">Second Tutor</Label>
                                <Select value={secondModel} onValueChange={handleSecondModelChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select second tutor..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {data?.models
                                            .filter((model) => model !== selectedModel)
                                            .map((model) => (
                                                <SelectItem key={model} value={model}>
                                                    {model}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2" data-judge="first">
                            <Label htmlFor="judge-select">Judge LLM</Label>
                            <Select value={selectedJudgeLLM} onValueChange={handleJudgeLLMChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a judge LLM..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {data?.judgeLLMs.map((judge) => (
                                        <SelectItem key={judge} value={judge}>
                                            <div className="flex items-center gap-2">
                                                <Brain className="w-4 h-4" />
                                                {JUDGE_LLM_LABELS[judge] || judge}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                ) : judgeComparisonMode ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2" data-judge="first">
                                <Label htmlFor="judge-select">First Judge LLM</Label>
                                <Select value={selectedJudgeLLM} onValueChange={handleJudgeLLMChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a judge LLM..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {data?.judgeLLMs
                                            .filter((judge) => judge !== secondJudgeLLM)
                                            .map((judge) => (
                                                <SelectItem key={judge} value={judge}>
                                                    <div className="flex items-center gap-2">
                                                        <Brain className="w-4 h-4" />
                                                        {JUDGE_LLM_LABELS[judge] || judge}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2" data-judge="second">
                                <Label htmlFor="second-judge-select">Second Judge LLM</Label>
                                <Select value={secondJudgeLLM} onValueChange={handleSecondJudgeLLMChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select second judge LLM..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {data?.judgeLLMs
                                            .filter((judge) => judge !== selectedJudgeLLM)
                                            .map((judge) => (
                                                <SelectItem key={judge} value={judge}>
                                                    <div className="flex items-center gap-2">
                                                        <Brain className="w-4 h-4" />
                                                        {JUDGE_LLM_LABELS[judge] || judge}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2" data-tutor="first">
                            <Label htmlFor="model-select">Tutor</Label>
                            <Select value={selectedModel} onValueChange={handleModelChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a tutor..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {data?.models.map((model) => (
                                        <SelectItem key={model} value={model}>
                                            {model}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                ) : null}
            </div>

            {selectionError && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>{selectionError}</span>
                </div>
            )}

            {selectedTopic && selectedModel && !selectionError && (
                <div className="space-y-4">
                    {!comparisonMode && !judgeComparisonMode ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Tutor Response
                                </CardTitle>
                                <div className="flex gap-2 text-sm text-gray-600">
                                    <Badge variant="outline">{selectedModel}</Badge>
                                    <Badge variant="outline">{selectedTopic}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {tutorResponseLoading ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        <span>Loading tutor response...</span>
                                    </div>
                                ) : tutorResponse ? (
                                    <div className="p-4 bg-purple-50 border-l-4 border-purple-400 rounded-lg">
                                        <div className="text-sm">{tutorResponse}</div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500 italic p-4 text-center">
                                        No response available for this tutor and topic.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : comparisonMode ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Badge variant="default">{selectedModel}</Badge>
                                        Response
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {tutorResponseLoading ? (
                                        <div className="flex items-center justify-center p-4">
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            <span>Loading...</span>
                                        </div>
                                    ) : tutorResponse ? (
                                        <div className="p-3 bg-purple-50 border-l-4 border-purple-400 rounded-lg">
                                            <div className="text-sm">{tutorResponse}</div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500 italic p-4 text-center">No response available.</div>
                                    )}
                                </CardContent>
                            </Card>
                            {secondModel && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Badge variant="secondary">{secondModel}</Badge>
                                            Response
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {tutorResponseLoading ? (
                                            <div className="flex items-center justify-center p-4">
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                <span>Loading...</span>
                                            </div>
                                        ) : secondTutorResponse ? (
                                            <div className="p-3 bg-pink-50 border-l-4 border-pink-400 rounded-lg">
                                                <div className="text-sm">{secondTutorResponse}</div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-500 italic p-4 text-center">No response available.</div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    ) : judgeComparisonMode ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Tutor Response
                                </CardTitle>
                                <div className="flex gap-2 text-sm text-gray-600">
                                    <Badge variant="outline">{selectedModel}</Badge>
                                    <Badge variant="outline">{selectedTopic}</Badge>
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                        Comparing Judges
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {tutorResponseLoading ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        <span>Loading tutor response...</span>
                                    </div>
                                ) : tutorResponse ? (
                                    <div className="p-4 bg-purple-50 border-l-4 border-purple-400 rounded-lg">
                                        <div className="text-sm">{tutorResponse}</div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500 italic p-4 text-center">
                                        No response available for this tutor and topic.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : null}
                </div>
            )}

            {feedbackSaved && (
                <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200 shadow-sm">
                    <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
                        <CheckCircle2 className="w-6 h-6" />
                        <p className="text-base font-semibold">Feedback Saved Successfully!</p>
                    </div>
                    <p className="text-sm text-green-600">Thank you for your input. Your feedback has been recorded.</p>
                </div>
            )}
            {feedbackError && (
                <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200 shadow-sm">
                    <div className="flex items-center justify-center gap-2 text-red-700 mb-1">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm font-semibold">Error Saving Feedback</p>
                    </div>
                    <p className="text-sm text-red-600">{feedbackError}</p>
                </div>
            )}

            {groundTruthSolution &&
                !judgeComparisonMode &&
                selectedModel &&
                ((comparisonMode && secondModel && (tutorResponse || secondTutorResponse)) ||
                    (!comparisonMode && tutorResponse)) && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowGroundTruth(!showGroundTruth)}
                                    className="w-full flex items-center justify-center bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border-amber-300 text-amber-900"
                                >
                                    <span className="font-semibold">
                                        {showGroundTruth ? "Hide the correct solution" : "Show the correct solution?"}
                                    </span>
                                    <span className="text-xl ml-2">{showGroundTruth ? "▲" : "▼"}</span>
                                </Button>

                                {showGroundTruth && (
                                    <div className="p-4 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 border-l-4 border-amber-500 rounded-lg shadow-sm">
                                        <div className="font-semibold text-sm mb-2 text-amber-900 flex items-center gap-2">
                                            <span className="text-lg">🏆</span>
                                            Gold Answer:
                                        </div>
                                        <div className="text-sm text-gray-800 whitespace-pre-line">{groundTruthSolution}</div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Evaluation Dimensions</Label>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                            disabled={selectedDimensions.length === data?.dimensions.length}
                        >
                            Select All
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleClearAll} disabled={selectedDimensions.length === 0}>
                            Clear All
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {data &&
                        getOrderedDimensions(data.dimensions).map((dimension) => (
                            <div key={dimension} className="flex items-center space-x-2">
                                <Checkbox
                                    id={dimension}
                                    checked={selectedDimensions.includes(dimension)}
                                    onCheckedChange={(checked) => handleDimensionChange(dimension, checked as boolean)}
                                />
                                <Label htmlFor={dimension} className="text-sm">
                                    {DIMENSION_LABELS[dimension] || dimension}
                                </Label>
                            </div>
                        ))}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            <Button
                onClick={handleEvaluate}
                disabled={
                    evaluating ||
                    !selectedTopic ||
                    !selectedModel ||
                    !selectedJudgeLLM ||
                    selectedDimensions.length === 0 ||
                    (comparisonMode && !judgeComparisonMode && !secondModel) ||
                    (comparisonMode && !judgeComparisonMode && selectedModel === secondModel && selectedModel !== "") ||
                    (judgeComparisonMode && !secondJudgeLLM) ||
                    (judgeComparisonMode && selectedJudgeLLM === secondJudgeLLM && selectedJudgeLLM !== "") ||
                    selectionError !== ""
                }
                className="w-full"
            >
                {evaluating ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Evaluating...
                    </>
                ) : comparisonMode ? (
                    "Compare Tutor Responses (LLM Judge)"
                ) : judgeComparisonMode ? (
                    "Compare Judge LLM Evaluations"
                ) : (
                    "Get LLM Evaluation Results"
                )}
            </Button>

            {evalResults && (
                <div className="space-y-6 pt-6 border-t">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Evaluation Scores</CardTitle>
                            <DownloadButton
                                elementRef={scoresRef}
                                fileName={
                                    comparisonMode
                                        ? `llmeval-scores-comparison-${evalResults.modelName}-vs-${evalResults.secondModelName}`
                                        : judgeComparisonMode
                                            ? `llmeval-scores-judge-comparison`
                                            : `llmeval-scores-${evalResults.modelName}-${selectedTopic}`
                                }
                                jsonData={prepareJSONExport()}
                                enableJsonExport={true}
                            />
                        </CardHeader>
                        <CardContent>
                            <div ref={scoresRef} className="p-6 bg-white rounded-lg">
                                {!comparisonMode && !judgeComparisonMode ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {getOrderedDimensions(Object.keys(evalResults.results)).map((dimension) => {
                                            const score = evalResults.results[dimension]
                                            return (
                                                <div key={dimension} className="text-center p-4 bg-purple-50 rounded-lg border">
                                                    <div className="text-sm font-medium text-gray-600 mb-1">
                                                        {DIMENSION_LABELS[dimension] || dimension}
                                                    </div>
                                                    {typeof score === "string" ? (
                                                        <Badge className={`text-sm font-semibold ${getCategoricalBadgeColor(score)}`}>
                                                            {score}
                                                        </Badge>
                                                    ) : (
                                                        <div className="text-2xl font-bold text-purple-600">{formatScore(score)}</div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="default">
                                                    {comparisonMode
                                                        ? evalResults.modelName
                                                        : JUDGE_LLM_LABELS[evalResults.judgeLLM] || evalResults.judgeLLM}
                                                </Badge>
                                                <span className="font-semibold">Results</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {getOrderedDimensions(Object.keys(evalResults.results)).map((dimension) => {
                                                    const score = evalResults.results[dimension]
                                                    return (
                                                        <div key={dimension} className="text-center p-3 bg-purple-50 rounded-lg border">
                                                            <div className="text-xs font-medium text-gray-600 mb-1">
                                                                {DIMENSION_LABELS[dimension] || dimension}
                                                            </div>
                                                            {typeof score === "string" ? (
                                                                <Badge className={`text-xs font-semibold ${getCategoricalBadgeColor(score)}`}>
                                                                    {score}
                                                                </Badge>
                                                            ) : (
                                                                <div className="text-lg font-bold text-purple-600">{formatScore(score)}</div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                        {evalResults.secondResults && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary">
                                                        {comparisonMode
                                                            ? evalResults.secondModelName
                                                            : JUDGE_LLM_LABELS[evalResults.secondJudgeLLM!] || evalResults.secondJudgeLLM}
                                                    </Badge>
                                                    <span className="font-semibold">Results</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {evalResults.secondResults &&
                                                        getOrderedDimensions(Object.keys(evalResults.secondResults)).map((dimension) => {
                                                            const score = evalResults.secondResults![dimension]
                                                            return (
                                                                <div key={dimension} className="text-center p-3 bg-pink-50 rounded-lg border">
                                                                    <div className="text-xs font-medium text-gray-600 mb-1">
                                                                        {DIMENSION_LABELS[dimension] || dimension}
                                                                    </div>
                                                                    {typeof score === "string" ? (
                                                                        <Badge className={`text-xs font-semibold ${getCategoricalBadgeColor(score)}`}>
                                                                            {score}
                                                                        </Badge>
                                                                    ) : (
                                                                        <div className="text-lg font-bold text-pink-600">{formatScore(score)}</div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    {!comparisonMode && !judgeComparisonMode && evalResults.bestResults && (
                        <BestResultsDisplay
                            bestResults={evalResults.bestResults}
                            dimensions={selectedDimensions}
                            scrollToTutorSelector={scrollToTutorSelector}
                        />
                    )}
                    {(comparisonMode || judgeComparisonMode) && evalResults.secondResults && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Comparison Visualization</CardTitle>
                                <DownloadButton
                                    elementRef={chartRef}
                                    fileName={
                                        comparisonMode
                                            ? `llmeval-chart-comparison-${evalResults.modelName}-vs-${evalResults.secondModelName}`
                                            : `llmeval-chart-judge-comparison`
                                    }
                                    jsonData={prepareJSONExport()}
                                    enableJsonExport={true}
                                />
                            </CardHeader>
                            <CardContent>
                                <div ref={chartRef} className="p-6 bg-white rounded-lg">
                                    <ComparisonChart
                                        firstTutorData={evalResults.results}
                                        secondTutorData={evalResults.secondResults}
                                        firstTutorName={
                                            comparisonMode
                                                ? evalResults.modelName
                                                : JUDGE_LLM_LABELS[evalResults.judgeLLM] || evalResults.judgeLLM
                                        }
                                        secondTutorName={
                                            comparisonMode
                                                ? evalResults.secondModelName || ""
                                                : JUDGE_LLM_LABELS[evalResults.secondJudgeLLM!] || evalResults.secondJudgeLLM || ""
                                        }
                                        dimensions={selectedDimensions}
                                        hideSummary={judgeComparisonMode}
                                        scrollToTutorSelector={scrollToTutorSelector}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    )
}
