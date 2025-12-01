import { type NextRequest, NextResponse } from "next/server"
import { VLLMClient } from "@/lib/vllm-client"
import { generateId, generateTimestamp } from "@/lib/id-generator"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { conversation, dimensions, inputMethod } = body

        if (!conversation || !dimensions || dimensions.length === 0) {
            return NextResponse.json({ error: "Missing required fields: conversation and dimensions" }, { status: 400 })
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

        const result = {
            id: generateId(),
            type: "autoeval",
            timestamp: generateTimestamp(),
            conversation,
            responses,
            dimensions,
            scores,
            inputMethod,
            summary: {
                averageScore,
                totalDimensions: dimensions.length,
            },
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error("AutoEval API error:", error)
        return NextResponse.json({ error: "Failed to process AutoEval request" }, { status: 500 })
    }
}
