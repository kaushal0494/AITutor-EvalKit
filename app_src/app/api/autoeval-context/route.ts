import { type NextRequest, NextResponse } from "next/server"
import { loadDataset, getDatasetPath } from "@/lib/dataset-config"

function normalizeItem(raw: any) {
    const problem_topic = raw.Problem_topic ?? raw.problem_topic ?? raw.Topic ?? "Not Available"

    return {
        conversation_id: raw.conversation_id ?? raw.id ?? crypto.randomUUID(),
        conversation_history: raw.conversation_history ?? "",
        problem_topic,
    }
}

export async function POST(request: NextRequest) {
    console.log("📖 [AutoEval-Context] POST request received")

    try {
        const body = await request.json()
        const { problemTopic } = body

        console.log("📊 [AutoEval-Context] Request for topic:", problemTopic)

        if (!problemTopic) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Problem topic is required",
                },
                { status: 400 },
            )
        }

        const datasetPath = getDatasetPath()
        console.log("📁 [AutoEval-Context] Loading dataset from:", datasetPath)

        const { data: rawData, error } = await loadDataset(datasetPath)

        if (error) {
            console.error("❌ [AutoEval-Context] Error loading dataset:", error)
            return NextResponse.json(
                {
                    success: false,
                    error: error,
                },
                { status: 500 },
            )
        }

        const dataset = rawData.map(normalizeItem)

        console.log("📊 [AutoEval-Context] Dataset loaded, total items:", dataset.length)

        const conversation = dataset.find((item: any) => item.problem_topic === problemTopic)

        if (!conversation) {
            console.log("⚠️ [AutoEval-Context] No conversation found for topic:", problemTopic)
            return NextResponse.json(
                {
                    success: false,
                    error: "No conversation found for this topic",
                },
                { status: 404 },
            )
        }

        console.log("✅ [AutoEval-Context] Found conversation for topic:", problemTopic)
        console.log("📝 [AutoEval-Context] Conversation ID:", conversation.conversation_id)

        const conversationHistory = conversation.conversation_history || ""

        return NextResponse.json({
            success: true,
            conversationHistory: conversationHistory,
            conversationId: conversation.conversation_id || "",
            problemTopic: conversation.problem_topic,
        })
    } catch (error) {
        console.error("❌ [AutoEval-Context] Error:", error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred",
            },
            { status: 500 },
        )
    }
}
