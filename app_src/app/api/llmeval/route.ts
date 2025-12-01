import { type NextRequest, NextResponse } from "next/server"
import { VLLMClient } from "@/lib/vllm-client"
import { generateId, generateTimestamp } from "@/lib/id-generator"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { conversation, dimensions, model, inputMethod } = body

        if (!conversation || !dimensions || dimensions.length === 0 || !model) {
            return NextResponse.json(
                { error: "Missing required fields: conversation, dimensions, and model" },
                { status: 400 },
            )
        }

        // Initialize vLLM client
        const vllmClient = new VLLMClient()

        // Get responses from vLLM for each dimension
        const responses = await vllmClient.evaluateDimensions(conversation, dimensions)

        // Calculate scores (Yes = 1, No = 0, Error = 0.5)
        const scores = Object.entries(responses).reduce((acc, [dim, response]) => {
            let score = 0.5 // default for errors or unclear responses
            if (response.toLowerCase() === "yes") score = 1.0
            if (response.toLowerCase() === "no") score = 0.0
            return { ...acc, [dim]: score }
        }, {})

        const averageScore = Object.values(scores).reduce((a: any, b: any) => a + b, 0) / dimensions.length

        // Generate LLM analysis based on responses
        const strengths = Object.entries(responses)
            .filter(([_, response]) => response.toLowerCase() === "yes")
            .map(([dim, _]) => `Strong ${dim.toLowerCase()} capabilities`)

        const improvements = Object.entries(responses)
            .filter(([_, response]) => response.toLowerCase() === "no")
            .map(([dim, _]) => `Needs improvement in ${dim.toLowerCase()}`)

        const result = {
            id: generateId(),
            type: "llmeval",
            model,
            timestamp: generateTimestamp(),
            conversation,
            responses,
            dimensions,
            scores,
            inputMethod,
            summary: {
                averageScore,
                totalDimensions: dimensions.length,
                modelUsed: model,
            },
            llmAnalysis: {
                strengths: strengths.length > 0 ? strengths : ["Consistent evaluation approach"],
                improvements: improvements.length > 0 ? improvements : ["Continue current approach"],
                confidence: Math.min(0.9, averageScore + 0.1), // Confidence based on average score
            },
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error("LLMEval API error:", error)
        return NextResponse.json({ error: "Failed to process LLMEval request" }, { status: 500 })
    }
}
