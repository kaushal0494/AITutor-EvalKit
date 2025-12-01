import { NextResponse } from "next/server"
import { loadDataset } from "@/lib/dataset-config"
import crypto from "crypto"

const DATASET_FILE_PATH =
    "/Users/numaannaeem/Numaan/Study/RE_Projects/DEMO/Repo/Demo-AITutor/data/sample_mrbench_out.json"

// Sample data for context requests
const SAMPLE_DATA = [
    {
        conversation_id: "sample_001",
        Problem_topic: "Elliott's Exercise Equation",
        conversation_history:
            "Student: I need help with Elliott's Exercise Equation ||| Tutor: Let's work through this step by step. What do you think we should do first? ||| Student: I'm not sure where to start. ||| Tutor: That's okay! Let's break it down. Elliott's equation relates exercise intensity to heart rate. What do you know about heart rate zones? ||| Student: I know there are different zones for different types of exercise. ||| Tutor: Exactly! Now, can you identify what variables we have in this equation?",
    },
    {
        conversation_id: "sample_002",
        Problem_topic: "Quadratic Functions",
        conversation_history:
            "Student: I'm confused about quadratic functions ||| Tutor: No problem! Let's work on this quadratic function problem. Can you tell me what you see in the equation y = x² + 4x + 3? ||| Student: I see it's a quadratic equation, but I'm not sure how to solve it. ||| Tutor: Good observation! What methods do you know for solving quadratic equations? ||| Student: I think there's factoring and the quadratic formula. ||| Tutor: Excellent! Let's try factoring first. Can you think of two numbers that multiply to 3 and add to 4?",
    },
    {
        conversation_id: "sample_003",
        Problem_topic: "Photosynthesis Process",
        conversation_history:
            "Student: I need help understanding photosynthesis ||| Tutor: Today we're studying photosynthesis. Can you tell me what you already know about this process? ||| Student: I know plants use sunlight to make food, but I'm not sure about the details. ||| Tutor: That's a great start! You're right that plants use sunlight. What do you think plants need besides sunlight to make their food? ||| Student: Maybe water and air? ||| Tutor: Excellent thinking! Yes, water and carbon dioxide from the air are essential. Now, can you think about where in the plant photosynthesis happens?",
    },
]

function normalizeItem(raw: any) {
    const problem_topic = raw.Problem_topic ?? raw.problem_topic ?? raw.Topic ?? "Not Available"

    return {
        conversation_id: raw.conversation_id ?? raw.id ?? crypto.randomUUID(),
        conversation_history: raw.conversation_history ?? "",
        problem_topic,
    }
}

export async function POST(request: Request) {
    console.log("🔍 [LLMEval-Context] POST request received")

    try {
        const { problemTopic } = await request.json()
        console.log("🔍 [LLMEval-Context] Requested topic:", problemTopic)

        if (!problemTopic) {
            console.log("❌ [LLMEval-Context] No problem topic provided")
            return NextResponse.json({ success: false, error: "Problem topic is required" })
        }

        const { data: rawData, error } = await loadDataset("evaluation")

        if (error) {
            console.error("❌ [LLMEval-Context] Error loading dataset:", error)
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

        console.log("📊 [LLMEval-Context] Dataset loaded, total items:", dataset.length)

        // Find the conversation for the given problem topic
        const conversation = dataset.find((item: any) => item.problem_topic === problemTopic)
        console.log("🔍 [LLMEval-Context] Looking for topic:", problemTopic)
        console.log(
            "🔍 [LLMEval-Context] Available topics:",
            dataset.map((item: any) => item.problem_topic),
        )
        console.log("🔍 [LLMEval-Context] Found conversation:", !!conversation)

        if (!conversation) {
            console.log("❌ [LLMEval-Context] No conversation found for topic:", problemTopic)
            return NextResponse.json({
                success: false,
                error: "No conversation found for this topic",
                availableTopics: dataset.map((item: any) => item.problem_topic),
                requestedTopic: problemTopic,
            })
        }

        console.log(
            "✅ [LLMEval-Context] Found conversation history length:",
            conversation.conversation_history?.length || 0,
        )

        const result = {
            success: true,
            conversationHistory: conversation.conversation_history,
            problemTopic,
            conversationId: conversation.conversation_id,
        }

        console.log("✅ [LLMEval-Context] Returning result")
        return NextResponse.json(result)
    } catch (error) {
        console.error("❌ [LLMEval-Context] API error:", error)
        console.error("❌ [LLMEval-Context] Error stack:", error instanceof Error ? error.stack : "No stack trace")

        return NextResponse.json(
            {
                success: false,
                error: "Failed to get conversation context",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        )
    }
}
