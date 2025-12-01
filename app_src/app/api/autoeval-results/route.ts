import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { loadDataset } from "@/lib/dataset-config"
import { getOrderedDimensions } from "@/lib/dimension-config"
import crypto from "crypto"

// Sample data for fallback
const SAMPLE_DATA = {
    topics: [
        "Elliott's Exercise Equation",
        "Quadratic Functions",
        "Photosynthesis Process",
        "Chemical Reactions",
        "Linear Algebra Basics",
    ],
    tutors: ["GPT-4", "Claude-3", "Gemini-Pro", "Llama-3-70B", "Phi-3-Medium"],
    results: [
        {
            id: "sample-autoeval-1",
            topic: "Elliott's Exercise Equation",
            tutor: "GPT-4",
            timestamp: new Date().toISOString(),
            type: "autoeval",
            scores: {
                MI: 0.85,
                ML: 0.78,
                RA: 0.92,
                PG: 0.88,
                AC: 0.76,
                CO: 0.91,
                TT: 0.83,
                HM: 0.79,
            },
            conversation:
                "Student: I'm having trouble with this equation...\nTutor: Let me help you break it down step by step...",
            feedback: "The tutor effectively identified the student's mistake and provided clear guidance.",
            ground_truth_solution: "Not Available",
        },
        {
            id: "sample-autoeval-2",
            topic: "Quadratic Functions",
            tutor: "Claude-3",
            timestamp: new Date().toISOString(),
            type: "autoeval",
            scores: {
                MI: 0.82,
                ML: 0.85,
                RA: 0.79,
                PG: 0.91,
                AC: 0.88,
                CO: 0.86,
                TT: 0.92,
                HM: 0.84,
            },
            conversation: "Student: How do I solve x² + 5x + 6 = 0?\nTutor: Great question! Let's use factoring...",
            feedback: "Excellent guidance provided with clear step-by-step explanation.",
            ground_truth_solution: "Not Available",
        },
    ],
}

function normalizeItem(raw: any) {
    const problem_topic = raw.Problem_topic ?? raw.problem_topic ?? raw.Topic ?? "Not Available"
    const ground_truth_solution = raw.Ground_Truth_Solution ?? raw.ground_truth_solution ?? "Not Available"

    // Convert anno_llm_responses to tutors format if needed
    let tutors = raw.tutors
    if (!tutors && raw.anno_llm_responses) {
        tutors = {}
        for (const [model, data] of Object.entries(raw.anno_llm_responses)) {
            const tutorData: any = data
            tutors[model] = {
                response: tutorData.response ?? "",
                annotation: tutorData.annotation ?? {},
                auto_annotations: tutorData.auto_annotation ?? tutorData.annotation ?? {},
                llm_annotations: tutorData.llm_annotation ?? {},
            }
        }
    }

    return {
        conversation_id: raw.conversation_id ?? raw.id ?? crypto.randomUUID(),
        conversation_history: raw.conversation_history ?? "",
        problem_topic,
        tutors: tutors ?? {},
        ground_truth_solution,
    }
}

export async function GET(request: NextRequest) {
    console.log("🔍 [AutoEval-Results] GET request received")

    try {
        const { searchParams } = new URL(request.url)
        const topic = searchParams.get("topic")
        const tutor = searchParams.get("tutor")

        console.log("📊 [AutoEval-Results] Request params:", { topic, tutor })

        // Check if we're in production/Vercel environment
        const isProduction = process.env.VERCEL === "1" || process.env.NODE_ENV === "production"
        console.log("🌍 [AutoEval-Results] Environment:", {
            isProduction,
            vercel: process.env.VERCEL,
            nodeEnv: process.env.NODE_ENV,
        })

        let data = SAMPLE_DATA
        let dataSource = "sample"

        // Try to load from file system (will work locally, fallback in production)
        try {
            const filePath = path.join(process.cwd(), "data", "sample_dataset.json")
            console.log("📁 [AutoEval-Results] Attempting to read file:", filePath)

            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, "utf8")
                const fileData = JSON.parse(fileContent)
                console.log("✅ [AutoEval-Results] File loaded successfully")
                console.log("📊 [AutoEval-Results] File data structure:", Object.keys(fileData))

                if (fileData.autoeval_results) {
                    data = {
                        topics: [...new Set(fileData.autoeval_results.map((r: any) => r.topic))],
                        tutors: [...new Set(fileData.autoeval_results.map((r: any) => r.tutor))],
                        results: fileData.autoeval_results,
                    }
                    dataSource = "file"
                    console.log("✅ [AutoEval-Results] Using file data")
                }
            } else {
                console.log("⚠️ [AutoEval-Results] File does not exist, using sample data")
            }
        } catch (fileError) {
            console.log("⚠️ [AutoEval-Results] File read error, using sample data:", fileError)
        }

        console.log("📊 [AutoEval-Results] Data source:", dataSource)
        console.log("🔍 [AutoEval-Results] Available topics:", data.topics)
        console.log("🔍 [AutoEval-Results] Available tutors:", data.tutors)
        console.log("📈 [AutoEval-Results] Total results:", data.results.length)

        // Filter results based on query parameters
        let filteredResults = data.results

        if (topic) {
            console.log("🔍 [AutoEval-Results] Filtering by topic:", topic)
            filteredResults = filteredResults.filter((r: any) => r.topic === topic)
            console.log("📊 [AutoEval-Results] Results after topic filter:", filteredResults.length)
        }

        if (tutor) {
            console.log("🔍 [AutoEval-Results] Filtering by tutor:", tutor)
            filteredResults = filteredResults.filter((r: any) => r.tutor === tutor)
            console.log("📊 [AutoEval-Results] Results after tutor filter:", filteredResults.length)
        }

        const response = {
            success: true,
            data: {
                topics: data.topics,
                tutors: data.tutors,
                results: filteredResults,
                metadata: {
                    total: filteredResults.length,
                    dataSource,
                    isProduction,
                    timestamp: new Date().toISOString(),
                },
            },
        }

        console.log("✅ [AutoEval-Results] Sending response with", filteredResults.length, "results")
        return NextResponse.json(response)
    } catch (error) {
        console.error("❌ [AutoEval-Results] Error:", error)
        console.error("❌ [AutoEval-Results] Stack trace:", error instanceof Error ? error.stack : "No stack trace")

        // Return sample data as fallback
        return NextResponse.json({
            success: true,
            data: {
                topics: SAMPLE_DATA.topics,
                tutors: SAMPLE_DATA.tutors,
                results: SAMPLE_DATA.results,
                metadata: {
                    total: SAMPLE_DATA.results.length,
                    dataSource: "fallback",
                    error: error instanceof Error ? error.message : "Unknown error",
                    timestamp: new Date().toISOString(),
                },
            },
        })
    }
}

export async function POST(request: NextRequest) {
    console.log("🔍 [AutoEval-Results] POST request received")

    try {
        const body = await request.json()
        const { problemTopic, selectedModel, selectedDimensions, responseOnly, comparisonMode, secondModel } = body

        console.log("📊 [AutoEval-Results] Request params:", {
            problemTopic,
            selectedModel,
            selectedDimensions,
            responseOnly,
        })

        if (!problemTopic || !selectedModel) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Missing required parameters",
                },
                { status: 400 },
            )
        }

        const { data: rawData, error } = await loadDataset("evaluation")

        if (error) {
            console.error("❌ [AutoEval-Results] Error loading dataset:", error)
            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to load dataset",
                    details: error,
                },
                { status: 500 },
            )
        }

        const dataset = rawData.map(normalizeItem)

        console.log("📊 [AutoEval-Results] Dataset loaded, total items:", dataset.length)

        // Find conversations with the selected problem topic
        const conversation = dataset.find((item: any) => item.problem_topic === problemTopic)

        if (!conversation) {
            console.log("❌ [AutoEval-Results] No conversation found for topic:", problemTopic)
            return NextResponse.json(
                {
                    success: false,
                    error: "No conversations found for this topic",
                },
                { status: 404 },
            )
        }

        // Get the tutor data
        const tutorData = conversation.tutors[selectedModel]

        if (!tutorData) {
            console.log("❌ [AutoEval-Results] No data found for model:", selectedModel)
            return NextResponse.json(
                {
                    success: false,
                    error: `No data found for model: ${selectedModel}`,
                },
                { status: 404 },
            )
        }

        if (responseOnly) {
            return NextResponse.json({
                success: true,
                modelResponse: tutorData.response,
                conversationId: conversation.conversation_id,
                groundTruthSolution: conversation.ground_truth_solution,
            })
        }

        const orderedDimensions = getOrderedDimensions(selectedDimensions)

        const results: { [dimension: string]: number | string } = {}
        orderedDimensions.forEach((dimension: string) => {
            if (tutorData.auto_annotations && tutorData.auto_annotations[dimension] !== undefined) {
                results[dimension] = tutorData.auto_annotations[dimension]
            }
        })

        const bestResults: { [dimension: string]: { score: number | string; tutors: string[] } } = {}

        orderedDimensions.forEach((dimension: string) => {
            const scoresMap: { [tutor: string]: number | string } = {}

            // Collect scores from all tutors for this dimension
            Object.entries(conversation.tutors).forEach(([tutorName, data]: [string, any]) => {
                if (data.auto_annotations && data.auto_annotations[dimension] !== undefined) {
                    scoresMap[tutorName] = data.auto_annotations[dimension]
                }
            })

            // Find the best score
            const scores = Object.entries(scoresMap)
            if (scores.length > 0) {
                // Check if scores are categorical (Yes/No/To some extent) or numeric
                const firstScore = scores[0][1]
                const isCategorical = typeof firstScore === "string"

                if (isCategorical) {
                    // For categorical, "Yes" is the best
                    const yesScores = scores.filter(([_, score]) => score === "Yes")
                    if (yesScores.length > 0) {
                        bestResults[dimension] = {
                            score: "Yes",
                            tutors: yesScores.map(([tutor]) => tutor),
                        }
                    } else {
                        // If no "Yes", find "To some extent"
                        const someExtentScores = scores.filter(([_, score]) => score === "To some extent")
                        if (someExtentScores.length > 0) {
                            bestResults[dimension] = {
                                score: "To some extent",
                                tutors: someExtentScores.map(([tutor]) => tutor),
                            }
                        }
                    }
                } else {
                    // For numeric, find the highest score
                    const maxScore = Math.max(...scores.map(([_, score]) => Number(score)))
                    const bestTutors = scores.filter(([_, score]) => Number(score) === maxScore).map(([tutor]) => tutor)

                    bestResults[dimension] = {
                        score: maxScore,
                        tutors: bestTutors,
                    }
                }
            }
        })

        console.log("🏆 [AutoEval-Results] Best results calculated:", bestResults)

        if (comparisonMode && secondModel) {
            const secondTutorData = conversation.tutors[secondModel]

            if (!secondTutorData) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `No data found for second model: ${secondModel}`,
                    },
                    { status: 404 },
                )
            }

            const secondResults: { [dimension: string]: number | string } = {}
            orderedDimensions.forEach((dimension: string) => {
                if (secondTutorData.auto_annotations && secondTutorData.auto_annotations[dimension] !== undefined) {
                    secondResults[dimension] = secondTutorData.auto_annotations[dimension]
                }
            })

            return NextResponse.json({
                success: true,
                results,
                secondResults,
                bestResults,
                conversationHistory: conversation.conversation_history,
                conversationId: conversation.conversation_id,
                modelResponse: tutorData.response,
                secondModelResponse: secondTutorData.response,
                modelName: selectedModel,
                secondModelName: secondModel,
                problemTopic,
                comparisonMode: true,
                groundTruthSolution: conversation.ground_truth_solution,
            })
        }

        const response = {
            success: true,
            results,
            bestResults,
            conversationHistory: conversation.conversation_history,
            conversationId: conversation.conversation_id,
            modelResponse: tutorData.response,
            modelName: selectedModel,
            problemTopic,
            groundTruthSolution: conversation.ground_truth_solution,
        }

        console.log("✅ [AutoEval-Results] Returning results with bestResults")
        return NextResponse.json(response)
    } catch (error) {
        console.error("❌ [AutoEval-Results] Error:", error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred",
            },
            { status: 500 },
        )
    }
}
