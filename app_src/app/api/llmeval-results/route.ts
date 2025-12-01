import { NextResponse } from "next/server"
import { loadDataset } from "@/lib/dataset-config"
import { crypto } from "crypto"

function normalizeItem(raw: any) {
    const problem_topic = raw.Problem_topic ?? raw.problem_topic ?? raw.Topic ?? "Not Available"

    // Convert anno_llm_responses to tutors format if needed
    let tutors = raw.tutors
    if (!tutors && raw.anno_llm_responses) {
        tutors = {}
        for (const [model, data] of Object.entries(raw.anno_llm_responses)) {
            const tutorData: any = data
            tutors[model] = {
                response: tutorData.response ?? "",
                annotation: tutorData.annotation ?? {},
                auto_annotations: tutorData.auto_annotation ?? {},
                llm_annotations: tutorData.llm_annotation ?? {},
            }
        }
    }

    return {
        conversation_id: raw.conversation_id ?? raw.id ?? crypto.randomUUID(),
        conversation_history: raw.conversation_history ?? "",
        problem_topic,
        tutors: tutors ?? {},
    }
}

export async function POST(request: Request) {
    try {
        const {
            problemTopic,
            selectedModel,
            selectedDimensions,
            judgeLLM,
            comparisonMode,
            judgeComparisonMode,
            secondModel,
            secondJudgeLLM,
            contextOnly,
            responseOnly,
        } = await request.json()

        console.log("LLMEval API called with:", {
            problemTopic,
            selectedModel,
            judgeLLM,
            comparisonMode,
            judgeComparisonMode,
            secondModel,
            secondJudgeLLM,
            contextOnly,
            responseOnly,
        })

        const { data: rawData, error } = await loadDataset("evaluation")

        if (error) {
            console.error("❌ [LLMEval-Results] Error loading dataset:", error)
            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to load dataset",
                    details: error,
                },
                { status: 500 },
            )
        }

        const data = rawData.map(normalizeItem)

        // Find conversations with the selected problem topic
        const topicConversations = data.filter((item) => item.problem_topic === problemTopic)

        if (topicConversations.length === 0) {
            return NextResponse.json({
                success: false,
                error: "No conversations found for this topic",
            })
        }

        // Get the first conversation for this topic
        const conversation = topicConversations[0]

        // If contextOnly flag is set, just return the conversation history
        if (contextOnly) {
            return NextResponse.json({
                success: true,
                conversationHistory: conversation.conversation_history,
                problemTopic,
                conversationId: conversation.conversation_id,
            })
        }

        // If responseOnly flag is set, just return the model response
        if (responseOnly) {
            if (!conversation.tutors[selectedModel]) {
                return NextResponse.json({
                    success: false,
                    error: `No data found for model: ${selectedModel}`,
                })
            }

            const groundTruthSolution =
                (rawData.find((item: any) => (item.problem_topic ?? item.Problem_topic ?? item.Topic) === problemTopic) as any)
                    ?.Ground_Truth_Solution ?? "Not Available"

            return NextResponse.json({
                success: true,
                modelResponse: conversation.tutors[selectedModel].response,
                modelName: selectedModel,
                problemTopic,
                conversationId: conversation.conversation_id,
                groundTruthSolution,
            })
        }

        const getScoreForDimension = (
            llmAnnotation: any,
            dimension: string,
            judge: string,
        ): number | string | undefined => {
            // Try new categorical format first: "Dimension/JudgeName"
            const categoricalKey = `${dimension}/${judge}`
            if (llmAnnotation[categoricalKey] !== undefined && llmAnnotation[categoricalKey] !== null) {
                return llmAnnotation[categoricalKey] // Return categorical value as-is
            }

            // Try old numeric format: "Dimension_judge-model-path"
            const numericKey = `${dimension}_${judge}`
            const score = llmAnnotation[numericKey]

            if (score === null || score === undefined) {
                return undefined
            }

            // Normalize LLM scores from 1-3 scale to 0-1 scale
            return Math.max(0, Math.min(1, (score - 1) / 2))
        }

        // Helper function to extract scores for a model with a specific judge
        const extractScores = (modelName: string, judgeModel: string) => {
            if (!conversation.tutors[modelName]) {
                return null
            }

            const modelResponse = conversation.tutors[modelName]
            const llmAnnotation = modelResponse.llm_annotations || {}
            const results: { [dimension: string]: number | string } = {}

            selectedDimensions.forEach((dimension: string) => {
                const score = getScoreForDimension(llmAnnotation, dimension, judgeModel)
                if (score !== undefined) {
                    results[dimension] = score
                }
            })

            return {
                results,
                response: modelResponse.response,
            }
        }

        // Extract data for primary model with primary judge
        const primaryData = extractScores(selectedModel, judgeLLM)
        if (!primaryData) {
            return NextResponse.json({
                success: false,
                error: `No data found for model: ${selectedModel}`,
            })
        }

        const bestResults: { [dimension: string]: { score: number | string; tutors: string[] } } = {}

        selectedDimensions.forEach((dimension: string) => {
            let bestScore: number | string = -1
            const bestTutors: string[] = []
            let isCategorical = false

            // First pass: find the highest score across all models for this judge
            Object.entries(conversation.tutors).forEach(([tutorName, tutorData]) => {
                if (tutorData.llm_annotations) {
                    const score = getScoreForDimension(tutorData.llm_annotations, dimension, judgeLLM)
                    if (score !== undefined) {
                        if (typeof score === "string") {
                            isCategorical = true
                            // For categorical: "Yes" > "To some extent" > "No"
                            const scoreValue = score.toLowerCase() === "yes" ? 2 : score.toLowerCase().includes("some extent") ? 1 : 0
                            const bestValue =
                                typeof bestScore === "string"
                                    ? bestScore.toLowerCase() === "yes"
                                        ? 2
                                        : bestScore.toLowerCase().includes("some extent")
                                            ? 1
                                            : 0
                                    : bestScore
                            if (scoreValue > bestValue) {
                                bestScore = score
                            }
                        } else if (typeof score === "number" && score > (bestScore as number)) {
                            bestScore = score
                        }
                    }
                }
            })

            // Second pass: find all tutors with the highest score
            Object.entries(conversation.tutors).forEach(([tutorName, tutorData]) => {
                if (tutorData.llm_annotations) {
                    const score = getScoreForDimension(tutorData.llm_annotations, dimension, judgeLLM)
                    if (score !== undefined) {
                        if (isCategorical && typeof score === "string" && typeof bestScore === "string") {
                            if (score.toLowerCase() === bestScore.toLowerCase()) {
                                bestTutors.push(tutorName)
                            }
                        } else if (typeof score === "number" && typeof bestScore === "number") {
                            if (Math.abs(score - bestScore) < 0.001) {
                                bestTutors.push(tutorName)
                            }
                        }
                    }
                }
            })

            if (bestTutors.length > 0) {
                bestResults[dimension] = { score: bestScore, tutors: bestTutors }
            }
        })

        const responseData: any = {
            success: true,
            results: primaryData.results,
            conversationHistory: conversation.conversation_history,
            conversationId: conversation.conversation_id,
            modelResponse: primaryData.response,
            modelName: selectedModel,
            judgeLLM: judgeLLM,
            totalConversationsForTopic: topicConversations.length,
            comparisonMode: comparisonMode || false,
            judgeComparisonMode: judgeComparisonMode || false,
            bestResults: bestResults,
        }

        // Handle comparison modes
        if (comparisonMode && secondModel) {
            // Model comparison: different models, same judge
            const secondaryData = extractScores(secondModel, judgeLLM)
            if (!secondaryData) {
                return NextResponse.json({
                    success: false,
                    error: `No data found for second model: ${secondModel}`,
                })
            }

            responseData.secondResults = secondaryData.results
            responseData.secondModelResponse = secondaryData.response
            responseData.secondModelName = secondModel
        } else if (judgeComparisonMode && secondJudgeLLM) {
            // Judge comparison: same model, different judges
            const secondaryData = extractScores(selectedModel, secondJudgeLLM)
            if (!secondaryData) {
                return NextResponse.json({
                    success: false,
                    error: `No data found for judge: ${secondJudgeLLM}`,
                })
            }

            responseData.secondResults = secondaryData.results
            responseData.secondModelResponse = secondaryData.response // Same response
            responseData.secondModelName = selectedModel // Same model
            responseData.secondJudgeLLM = secondJudgeLLM
        }

        console.log("Returning response data:", responseData)
        return NextResponse.json(responseData)
    } catch (error) {
        console.error("LLMEval results API error:", error)
        return NextResponse.json({ success: false, error: "Failed to get results" }, { status: 500 })
    }
}
