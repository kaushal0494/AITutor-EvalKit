// app/api/save-feedback/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getRedis } from "@/lib/redis"

export const runtime = "nodejs" // Redis needs Node (not Edge)

interface FeedbackEntry {
    id: string
    timestamp: string
    problemTopic?: string
    conversationId?: string
    evaluationType?: string
    firstTutor?: string
    secondTutor?: string
    rating?: string
    preference?: "first" | "second" | "both" | "both-bad"
    module?: string
}

interface FeedbackData {
    feedbacks: FeedbackEntry[]
    metadata: {
        totalFeedbacks: number
        lastUpdated: string
    }
}

const FEEDBACK_KEY = ``

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            problemTopic,
            conversationId,
            evaluationType,
            firstTutor,
            secondTutor,
            rating,
            preference,
            module,
            timestamp: clientTs,
        } = body

        const timestamp = clientTs || new Date().toISOString()
        const feedbackId = `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

        const newFeedback: FeedbackEntry = {
            id: feedbackId,
            timestamp,
            problemTopic,
            conversationId,
            evaluationType,
            firstTutor,
            secondTutor,
            rating,
            preference,
            module,
        }

        const redis = await getRedis()

        // read existing (stored as JSON string)
        const existing = await redis.get(FEEDBACK_KEY)
        const feedbackData: FeedbackData = existing
            ? JSON.parse(existing)
            : { feedbacks: [], metadata: { totalFeedbacks: 0, lastUpdated: timestamp } }

        // update
        feedbackData.feedbacks.push(newFeedback)
        feedbackData.metadata.totalFeedbacks = feedbackData.feedbacks.length
        feedbackData.metadata.lastUpdated = timestamp

        // write back
        await redis.set(feedbackData.feedbacks[0].id, JSON.stringify(feedbackData))

        return NextResponse.json(
            { success: true, message: "Feedback saved successfully!", feedbackId },
            { status: 200 },
        )
    } catch (error) {
        console.error("Error saving feedback:", error)
        return NextResponse.json(
            {
                success: false,
                message: "Failed to save feedback",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const module = searchParams.get("module")
        const problemTopic = searchParams.get("problemTopic")
        const tutor = searchParams.get("tutor")

        const redis = await getRedis()
        const existing = await redis.get(FEEDBACK_KEY)

        if (!existing) {
            return NextResponse.json(
                {
                    feedbacks: [],
                    metadata: { totalFeedbacks: 0, lastUpdated: new Date().toISOString() },
                },
                { status: 200 },
            )
        }

        const feedbackData: FeedbackData = JSON.parse(existing)

        let filtered = feedbackData.feedbacks
        if (module) filtered = filtered.filter((f) => f.module === module)
        if (problemTopic) filtered = filtered.filter((f) => f.problemTopic === problemTopic)
        if (tutor) filtered = filtered.filter((f) => f.firstTutor === tutor || f.secondTutor === tutor)

        return NextResponse.json(
            {
                feedbacks: filtered,
                metadata: { totalFeedbacks: filtered.length, lastUpdated: feedbackData.metadata.lastUpdated },
            },
            { status: 200 },
        )
    } catch (error) {
        console.error("Error retrieving feedback:", error)
        return NextResponse.json(
            {
                success: false,
                message: "Failed to retrieve feedback",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        )
    }
}
