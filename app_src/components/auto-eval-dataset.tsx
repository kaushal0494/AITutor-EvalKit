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
    Database,
    Target,
    Layers,
    GitCompare,
    ThumbsUp,
    ThumbsDown,
    CheckCircle2,
    Minus,
} from "lucide-react"
import { ComparisonChart, BestResultsDisplay } from "@/components/charts/comparison-chart"
import { DownloadButton } from "@/components/download-button"
import { getOrderedDimensions } from "@/lib/dimension-config"

interface AutoEvalDatasetProps {
    onResults: (results: any) => void
    results: any[]
}

interface AutoEvalData {
    problemTopics: string[]
    models: string[]
    dimensions: string[]
    totalConversations: number
}

interface EvalResults {
    results: { [dimension: string]: number | string } // Changed to accommodate string scores
    conversationHistory: string
    conversationId: string
    modelResponse: string
    modelName: string
    totalConversationsForTopic: number
    comparisonMode?: boolean
    secondResults?: { [dimension: string]: number | string } // Changed to accommodate string scores
    secondModelResponse?: string
    secondModelName?: string
    bestResults?: { [dimension: string]: { score: number; tutors: string[] } }
    groundTruthSolution?: string
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

const formatScore = (score: number | string): string => {
    if (typeof score === "number") {
        return score.toFixed(3)
    }
    return String(score)
}

const getCategoricalBadgeColor = (value: string): string => {
    const lowerValue = String(value).toLowerCase()
    if (lowerValue === "yes") return "bg-green-100 text-green-800 border-green-300"
    if (lowerValue === "no") return "bg-red-100 text-red-800 border-red-300"
    if (lowerValue === "to some extent") return "bg-yellow-100 text-yellow-800 border-yellow-300"
    return "bg-blue-100 text-blue-800 border-blue-300"
}

export function AutoEvalDataset({ onResults, results }: AutoEvalDatasetProps) {
    const [data, setData] = useState<AutoEvalData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>("")
    const [selectionError, setSelectionError] = useState<string>("")
    const [selectedTopic, setSelectedTopic] = useState<string>("")
    const [selectedModel, setSelectedModel] = useState<string>("")
    const [selectedDimensions, setSelectedDimensions] = useState<string[]>([])
    const [evalResults, setEvalResults] = useState<EvalResults | null>(null)
    const [evaluating, setEvaluating] = useState(false)

    // Comparison mode states
    const [comparisonMode, setComparisonMode] = useState(false)
    const [secondModel, setSecondModel] = useState<string>("")
    const [contextLoading, setContextLoading] = useState(false)
    const [conversationContext, setConversationContext] = useState<string>("")
    const [tutorResponseLoading, setTutorResponseLoading] = useState(false)
    const [tutorResponse, setTutorResponse] = useState<string>("")
    const [secondTutorResponse, setSecondTutorResponse] = useState<string>("")
    const [conversationId, setConversationId] = useState<string>("")

    const [groundTruthSolution, setGroundTruthSolution] = useState<string>("")
    const [showGroundTruth, setShowGroundTruth] = useState(false)

    // Rating feedback states - now persistent
    const [selectedRating, setSelectedRating] = useState<string>("")
    const [selectedPreference, setSelectedPreference] = useState<string>("")
    const [feedbackSaving, setFeedbackSaving] = useState(false)
    const [feedbackSaved, setFeedbackSaved] = useState(false)
    const [feedbackError, setFeedbackError] = useState<string>("")

    const resultsRef = useRef<HTMLDivElement>(null)
    const scoresRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<HTMLDivElement>(null)

    const prevTopicRef = useRef<string>("")

    // Load initial data
    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if (!comparisonMode) {
            setSelectedModel("")
            setSecondModel("")
            setSelectedDimensions([])
            setEvalResults(null)
            setTutorResponse("")
            setSecondTutorResponse("")
            // so the selected problem's context remains visible
            // setConversationContext("")
            // setConversationId("")
            setGroundTruthSolution("")
            setShowGroundTruth(false)
            setSelectedRating("")
            setSelectedPreference("")
            setFeedbackSaved(false)
            setFeedbackError("")
        }
    }, [comparisonMode])

    // Effect to handle comparison mode changes - preserve first tutor response
    useEffect(() => {
        if (comparisonMode && selectedTopic && selectedModel && !tutorResponse) {
            fetchTutorResponse(selectedTopic, selectedModel, false)
        }
    }, [comparisonMode, selectedTopic, selectedModel, tutorResponse])

    useEffect(() => {
        if (selectedModel) {
            setEvalResults(null)
            setShowGroundTruth(false)
            setSelectedDimensions([])
        }
    }, [selectedModel])

    useEffect(() => {
        if (secondModel) {
            setEvalResults(null)
            setShowGroundTruth(false)
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
            setEvalResults(null)
            setSelectedDimensions([])
            setComparisonMode(false)
            setGroundTruthSolution("")
            setShowGroundTruth(false)
            setTutorResponse("")
            setSecondTutorResponse("")
            // Don't reset conversationId or conversationContext - they're handled by fetchConversationContext
            setSelectedRating("")
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
            const response = await fetch("/api/autoeval-data")
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

    const handleEvaluate = async () => {
        if (!selectedTopic || !selectedModel || selectedDimensions.length === 0) {
            setError("Please select a topic, model, and at least one dimension")
            return
        }

        if (comparisonMode && !secondModel) {
            setError("Please select a second model for comparison")
            return
        }

        if (comparisonMode && selectedModel === secondModel) {
            setError("Please select different tutors for comparison")
            return
        }

        try {
            setEvaluating(true)
            setError("")
            const response = await fetch("/api/autoeval-results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    problemTopic: selectedTopic,
                    selectedModel,
                    selectedDimensions,
                    comparisonMode,
                    secondModel: comparisonMode ? secondModel : undefined,
                }),
            })

            const result = await response.json()
            if (result.success) {
                setEvalResults(result)
                onResults(result)
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

    const saveFeedback = async (feedbackData: {
        rating?: "helpful" | "not-helpful" | "to-some-extent"
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
                    rating: feedbackData.rating,
                    preference: feedbackData.preference,
                    module: "autoeval",
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

    const handleRating = async (rating: "helpful" | "not-helpful" | "to-some-extent") => {
        setSelectedRating(rating)
        console.log("User rating:", rating)
        await saveFeedback({ rating })
    }

    const fetchConversationContext = async (topic: string) => {
        try {
            setContextLoading(true)
            const response = await fetch("/api/autoeval-context", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ problemTopic: topic }),
            })
            const result = await response.json()

            console.log("📖 [Frontend] Context response:", result)

            if (result.success) {
                setConversationContext(result.conversationHistory)
                if (result.conversationId) {
                    setConversationId(result.conversationId)
                    console.log("✅ [Frontend] Conversation ID set:", result.conversationId)
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
            const response = await fetch("/api/autoeval-results", {
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
                if (result.groundTruthSolution && !isSecondModel) {
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
        setSelectedRating("")
        setSelectedPreference("")
        setFeedbackSaved(false)
        setFeedbackError("")
        setGroundTruthSolution("")
        setShowGroundTruth(false)

        if (topic) {
            fetchConversationContext(topic)
        } else {
            setConversationContext("")
        }
    }

    const handleModelChange = (model: string) => {
        setSelectedModel(model)
        setSelectionError("")
        setSelectedRating("")
        setSelectedPreference("")
        setFeedbackSaved(false)
        setFeedbackError("")
        setShowGroundTruth(false)

        if (comparisonMode && model === secondModel && model !== "") {
            setSelectionError("Please select different tutors for comparison")
            return
        }

        if (selectedTopic && model) {
            fetchTutorResponse(selectedTopic, model)
        }
    }

    const handleSecondModelChange = (model: string) => {
        setSecondModel(model)
        setSelectionError("")
        setSelectedRating("")
        setSelectedPreference("")
        setFeedbackSaved(false)
        setFeedbackError("")
        setShowGroundTruth(false)

        if (comparisonMode && model === selectedModel && model !== "") {
            setSelectionError("Please select different tutors for comparison")
            return
        }

        if (selectedTopic && model) {
            fetchTutorResponse(selectedTopic, model, true)
        }
    }

    const handleComparisonModeChange = (checked: boolean) => {
        setComparisonMode(checked)
        setSelectedRating("")
        setSelectedPreference("")
        setFeedbackSaved(false)
        setFeedbackError("")
        setSelectionError("")
        setShowGroundTruth(false)

        if (checked && selectedTopic && selectedModel && !tutorResponse) {
            fetchTutorResponse(selectedTopic, selectedModel, false)
        }
    }

    const scrollToTutorSelector = () => {
        if (comparisonMode) {
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

                firstTutorSection.classList.add("ring-4", "ring-blue-500", "ring-opacity-75", "transition-all", "duration-500")
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

    const isCustomMode = process.env.NEXT_PUBLIC_IS_CUSTOM_MODE === "true"

    const prepareJSONExport = () => {
        if (!evalResults) return null

        if (!comparisonMode) {
            // Single tutor mode
            return {
                id: conversationId,
                problemTopic: selectedTopic,
                tutor: selectedModel,
                evaluationType: "single",
                dimensions: evalResults.results,
                timestamp: new Date().toISOString(),
            }
        } else {
            // Comparison mode
            return {
                id: conversationId,
                problemTopic: selectedTopic,
                evaluationType: "comparison",
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
        }
    }

    return (
        <div className="space-y-6">
            {data && (
                <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-lg">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3 text-gray-800">
                            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md">
                                <Database className="w-5 h-5" />
                            </div>
                            Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-gray-600">Topics</span>
                                </div>
                                <div className="text-2xl font-bold text-blue-600">{data.problemTopics.length}</div>
                            </div>
                            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="w-4 h-4 text-indigo-600" />
                                    <span className="text-sm font-medium text-gray-600">Models</span>
                                </div>
                                <div className="text-2xl font-bold text-indigo-600">{data.models.length}</div>
                            </div>
                            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Layers className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm font-medium text-gray-600">Dimensions</span>
                                </div>
                                <div className="text-2xl font-bold text-purple-600">{data.dimensions.length}</div>
                            </div>
                            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                                    <span className="text-sm font-medium text-gray-600">Conversations</span>
                                </div>
                                <div className="text-2xl font-bold text-emerald-600">{data.totalConversations}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="comparison-mode" checked={comparisonMode} onCheckedChange={handleComparisonModeChange} />
                        <Label htmlFor="comparison-mode" className="flex items-center gap-2 text-sm font-medium">
                            <GitCompare className="w-4 h-4" />
                            Enable Tutor Comparison Mode (Compare Two Tutors)
                        </Label>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2" data-tutor="first">
                    <Label htmlFor="model-select">{comparisonMode ? "First Tutor" : "Tutor"}</Label>
                    <Select value={selectedModel} onValueChange={handleModelChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a tutor..." />
                        </SelectTrigger>
                        <SelectContent>
                            {data?.models
                                .filter((model) => !comparisonMode || model !== secondModel)
                                .map((model) => (
                                    <SelectItem key={model} value={model}>
                                        {model}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>

                {comparisonMode && (
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
                )}
            </div>

            {selectionError && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>{selectionError}</span>
                </div>
            )}

            {selectedTopic && selectedModel && !selectionError && (
                <div className="space-y-4">
                    {!comparisonMode ? (
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
                                    <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                                        <div className="text-sm">{tutorResponse}</div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500 italic p-4 text-center">
                                        No response available for this tutor and topic.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
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
                                        <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
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
                                            <div className="p-3 bg-purple-50 border-l-4 border-purple-400 rounded-lg">
                                                <div className="text-sm">{secondTutorResponse}</div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-500 italic p-4 text-center">No response available.</div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            )}

            {!isCustomMode &&
                selectedTopic &&
                selectedModel &&
                !selectionError &&
                (tutorResponse || (comparisonMode && secondTutorResponse)) && (
                    <div className="space-y-3">
                        {!comparisonMode ? (
                            <div className="flex flex-col items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 shadow-sm">
                                <span className="text-sm font-medium text-gray-700">
                                    Would you consider this response useful as a student?
                                </span>
                                <div className="flex gap-3">
                                    <Button
                                        variant={selectedRating === "helpful" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleRating("helpful")}
                                        disabled={feedbackSaving || feedbackSaved}
                                        className={`flex items-center gap-1.5 transition-all duration-300 ${selectedRating === "helpful"
                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                                            : "hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                                            }`}
                                    >
                                        {feedbackSaving && selectedRating === "helpful" ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <ThumbsUp className="w-4 h-4" />
                                        )}
                                        Helpful
                                        {selectedRating === "helpful" && feedbackSaved && <span className="ml-1">✓</span>}
                                    </Button>
                                    <Button
                                        variant={selectedRating === "to-some-extent" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleRating("to-some-extent")}
                                        disabled={feedbackSaving || feedbackSaved}
                                        className={`flex items-center gap-1.5 transition-all duration-300 ${selectedRating === "to-some-extent"
                                            ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
                                            : "hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700"
                                            }`}
                                    >
                                        {feedbackSaving && selectedRating === "to-some-extent" ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Minus className="w-4 h-4" />
                                        )}
                                        To Some Extent
                                        {selectedRating === "to-some-extent" && feedbackSaved && <span className="ml-1">✓</span>}
                                    </Button>
                                    <Button
                                        variant={selectedRating === "not-helpful" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleRating("not-helpful")}
                                        disabled={feedbackSaving || feedbackSaved}
                                        className={`flex items-center gap-1.5 transition-all duration-300 ${selectedRating === "not-helpful"
                                            ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600"
                                            : "hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700"
                                            }`}
                                    >
                                        {feedbackSaving && selectedRating === "not-helpful" ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <ThumbsDown className="w-4 h-4" />
                                        )}
                                        Not Helpful
                                        {selectedRating === "not-helpful" && feedbackSaved && <span className="ml-1">✓</span>}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 shadow-sm">
                                <span className="text-sm font-medium text-gray-700">Which response is better?</span>
                                <div className="flex gap-3 flex-wrap justify-center">
                                    <Button
                                        variant={selectedPreference === selectedModel ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handlePreference("first")}
                                        disabled={feedbackSaving || feedbackSaved}
                                        className={`flex items-center gap-1.5 transition-all duration-300 ${selectedPreference === selectedModel
                                            ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
                                            : "hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700"
                                            }`}
                                    >
                                        {feedbackSaving && selectedPreference === selectedModel ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Badge
                                                variant={selectedPreference === selectedModel ? "secondary" : "default"}
                                                className="text-xs px-1.5 py-0.5"
                                            >
                                                {selectedModel}
                                            </Badge>
                                        )}
                                        {selectedPreference === selectedModel && feedbackSaved && <span className="ml-1">✓</span>}
                                    </Button>
                                    <Button
                                        variant={selectedPreference === secondModel ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handlePreference("second")}
                                        disabled={feedbackSaving || feedbackSaved}
                                        className={`flex items-center gap-1.5 transition-all duration-300 ${selectedPreference === secondModel
                                            ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                                            : "hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"
                                            }`}
                                    >
                                        {feedbackSaving && selectedPreference === secondModel ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Badge
                                                variant={selectedPreference === secondModel ? "secondary" : "default"}
                                                className="text-xs px-1.5 py-0.5"
                                            >
                                                {secondModel}
                                            </Badge>
                                        )}
                                        {selectedPreference === secondModel && feedbackSaved && <span className="ml-1">✓</span>}
                                    </Button>
                                    <Button
                                        variant={selectedPreference === "both" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handlePreference("both")}
                                        disabled={feedbackSaving || feedbackSaved}
                                        className={`flex items-center gap-1.5 transition-all duration-300 ${selectedPreference === "both"
                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                                            : "hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                                            }`}
                                    >
                                        {feedbackSaving && selectedPreference === "both" ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            "Both Good"
                                        )}
                                        {selectedPreference === "both" && feedbackSaved && <span className="ml-1">✓</span>}
                                    </Button>
                                    <Button
                                        variant={selectedPreference === "both-bad" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handlePreference("both-bad")}
                                        disabled={feedbackSaving || feedbackSaved}
                                        className={`flex items-center gap-1.5 transition-all duration-300 ${selectedPreference === "both-bad"
                                            ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600"
                                            : "hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700"
                                            }`}
                                    >
                                        {feedbackSaving && selectedPreference === "both-bad" ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            "Both Bad"
                                        )}
                                        {selectedPreference === "both-bad" && feedbackSaved && <span className="ml-1">✓</span>}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            {feedbackSaved && (
                <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200 shadow-sm">
                    <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
                        <CheckCircle2 className="w-6 h-6" />
                        <p className="text-base font-semibold">Feedback Saved Successfully!</p>
                    </div>
                    <p className="text-sm text-green-600">Thank you for your input.</p>
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
                selectedModel &&
                (comparisonMode ? secondModel : true) &&
                (tutorResponse || (comparisonMode && secondTutorResponse)) && (
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
                    selectedDimensions.length === 0 ||
                    (comparisonMode && !secondModel) ||
                    (comparisonMode && selectedModel === secondModel && selectedModel !== "") ||
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
                    "Compare Tutor Responses"
                ) : (
                    "Get Auto-Evaluation Results"
                )}
            </Button>

            {evalResults && (
                <div className="space-y-6 pt-6 border-t">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Evaluation Scores</CardTitle>
                            <div className="flex items-center">
                                <DownloadButton
                                    elementRef={scoresRef}
                                    fileName={`autoeval-scores-${evalResults.modelName}-${selectedTopic}`}
                                    jsonData={prepareJSONExport()}
                                    enableJsonExport={true}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div ref={scoresRef} className="p-6 bg-white rounded-lg">
                                {!comparisonMode ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {Object.entries(evalResults.results).map(([dimension, score]) => (
                                            <div key={dimension} className="text-center p-4 bg-blue-50 rounded-lg border">
                                                <div className="text-sm font-medium text-gray-600 mb-1">
                                                    {DIMENSION_LABELS[dimension] || dimension}
                                                </div>
                                                {typeof score === "number" ? (
                                                    <div className="text-2xl font-bold text-blue-600">{formatScore(score)}</div>
                                                ) : (
                                                    <div
                                                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getCategoricalBadgeColor(score)}`}
                                                    >
                                                        {score}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="default">{evalResults.modelName}</Badge>
                                                <span className="font-semibold">Results</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {Object.entries(evalResults.results).map(([dimension, score]) => (
                                                    <div key={dimension} className="text-center p-3 bg-blue-50 rounded-lg border">
                                                        <div className="text-xs font-medium text-gray-600 mb-1">
                                                            {DIMENSION_LABELS[dimension] || dimension}
                                                        </div>
                                                        {typeof score === "number" ? (
                                                            <div className="text-lg font-bold text-blue-600">{formatScore(score)}</div>
                                                        ) : (
                                                            <div
                                                                className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border ${getCategoricalBadgeColor(score)}`}
                                                            >
                                                                {score}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {evalResults.secondResults && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary">{evalResults.secondModelName}</Badge>
                                                    <span className="font-semibold">Results</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {Object.entries(evalResults.secondResults).map(([dimension, score]) => (
                                                        <div key={dimension} className="text-center p-3 bg-purple-50 rounded-lg border">
                                                            <div className="text-xs font-medium text-gray-600 mb-1">
                                                                {DIMENSION_LABELS[dimension] || dimension}
                                                            </div>
                                                            {typeof score === "number" ? (
                                                                <div className="text-lg font-bold text-purple-600">{formatScore(score)}</div>
                                                            ) : (
                                                                <div
                                                                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border ${getCategoricalBadgeColor(score)}`}
                                                                >
                                                                    {score}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {comparisonMode && evalResults.secondResults && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Comparison Visualization</CardTitle>
                                <div className="flex items-center">
                                    <DownloadButton
                                        elementRef={chartRef}
                                        fileName={`autoeval-comparison-${evalResults.modelName}-vs-${evalResults.secondModelName}-${selectedTopic}`}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div ref={chartRef}>
                                    <ComparisonChart
                                        firstTutorData={evalResults.results}
                                        secondTutorData={evalResults.secondResults}
                                        firstTutorName={evalResults.modelName}
                                        secondTutorName={evalResults.secondModelName || ""}
                                        dimensions={selectedDimensions}
                                        scrollToTutorSelector={scrollToTutorSelector}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {evalResults.bestResults && (
                        <div className="space-y-6">
                            <BestResultsDisplay
                                bestResults={evalResults.bestResults}
                                dimensions={selectedDimensions}
                                scrollToTutorSelector={scrollToTutorSelector}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default AutoEvalDataset
