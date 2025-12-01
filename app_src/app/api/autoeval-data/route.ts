import { NextResponse } from "next/server"
import { loadDataset } from "@/lib/dataset-config"

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
                // Keep the base annotation (4 dimensions for evaluation dataset)
                annotation: tutorData.annotation ?? {},
                // Keep auto_annotation for scores
                auto_annotations: tutorData.auto_annotation ?? {},
                // Keep llm_annotation for LLM evaluations
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

export async function GET() {
    console.log("🔍 [AutoEval-Data] GET request received")

    try {
        const { data: rawData, error } = await loadDataset("evaluation")

        if (error) {
            console.error("❌ [AutoEval-Data] Error loading dataset:", error)
            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to load dataset",
                    details: error,
                    dataSource: "error",
                },
                { status: 500 },
            )
        }

        const datasetData = rawData.map(normalizeItem)

        console.log("✅ [AutoEval-Data] Successfully loaded dataset")
        console.log("📊 [AutoEval-Data] Total items:", datasetData.length)

        // Extract unique problem topics
        const problemTopics = [...new Set(datasetData.map((item: any) => item.problem_topic))].filter(Boolean)
        console.log("📋 [AutoEval-Data] Problem topics found:", problemTopics)

        // Extract unique models (tutors)
        const models = new Set<string>()
        datasetData.forEach((item: any) => {
            if (item.tutors) {
                Object.keys(item.tutors).forEach((model) => models.add(model))
            }
        })
        const modelsList = Array.from(models)
        console.log("🤖 [AutoEval-Data] Models found:", modelsList)

        const dimensions = new Set<string>()
        datasetData.forEach((item: any) => {
            if (item.tutors) {
                Object.values(item.tutors).forEach((tutor: any) => {
                    // Use the base annotation field which has the 4 core dimensions
                    if (tutor.annotation) {
                        Object.keys(tutor.annotation).forEach((dim) => dimensions.add(dim))
                    }
                })
            }
        })
        const dimensionsList = Array.from(dimensions)
        console.log("📐 [AutoEval-Data] Dimensions found (4 core):", dimensionsList)

        const totalConversations = datasetData.length
        console.log("💬 [AutoEval-Data] Total conversations:", totalConversations)

        const result = {
            success: true,
            problemTopics,
            models: modelsList,
            dimensions: dimensionsList,
            totalConversations,
            dataSource: "evaluation",
        }

        console.log("✅ [AutoEval-Data] Returning result:", JSON.stringify(result, null, 2))
        return NextResponse.json(result)
    } catch (error) {
        console.error("❌ [AutoEval-Data] API error:", error)
        console.error("❌ [AutoEval-Data] Error stack:", error instanceof Error ? error.stack : "No stack trace")

        return NextResponse.json(
            {
                success: false,
                error: "Failed to load dataset",
                details: error instanceof Error ? error.message : "Unknown error",
                dataSource: "error",
            },
            { status: 500 },
        )
    }
}
