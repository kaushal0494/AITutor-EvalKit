import { NextResponse } from "next/server"
import { loadDataset } from "@/lib/dataset-config"

export async function GET() {
    try {
        console.log("[v0] Backend-dataset API: Loading visualization dataset")
        const result = await loadDataset("visualization")

        console.log("[v0] Dataset load result:", {
            hasError: !!result.error,
            hasData: !!result.data,
            dataLength: result.data?.length || 0,
            error: result.error,
        })

        if (result.error || !result.data || result.data.length === 0) {
            const errorMessage = result.error || "No data found in dataset"
            console.error("[v0] Dataset loading failed:", errorMessage)
            return NextResponse.json(
                {
                    success: false,
                    error: "Dataset is empty or not in expected format",
                    details: errorMessage,
                },
                { status: 500 },
            )
        }

        const dataset = result.data
        console.log("[v0] Processing dataset with", dataset.length, "items")

        const tutorsSet = new Set<string>()
        const dimensionsSet = new Set<string>()
        const conversationsByTutor: { [tutor: string]: number } = {}
        const scoresByDimension: { [dimension: string]: number[] } = {}
        const scoresByTutor: { [tutor: string]: number[] } = {}
        const scoresByTutorAndDimension: { [key: string]: number[] } = {}
        const categoryDistributionByTutorAndDimension: {
            [key: string]: { yes: number; toSomeExtent: number; no: number; total: number }
        } = {}

        dataset.forEach((item: any, index: number) => {
            const tutorsField = item.tutor_responses || item.tutors || item.anno_llm_responses || item.responses || {}

            if (index === 0) {
                console.log("[v0] First item structure:", {
                    hasTutorResponses: !!item.tutor_responses,
                    hasTutors: !!item.tutors,
                    hasAnnoLlmResponses: !!item.anno_llm_responses,
                    hasResponses: !!item.responses,
                    tutorCount: Object.keys(tutorsField).length,
                })
            }

            Object.entries(tutorsField).forEach(([tutorName, tutorData]: [string, any]) => {
                tutorsSet.add(tutorName)

                // Count conversations per tutor
                conversationsByTutor[tutorName] = (conversationsByTutor[tutorName] || 0) + 1

                // Try multiple field names for annotations
                const annotations =
                    tutorData?.annotation ||
                    tutorData?.auto_annotation ||
                    tutorData?.auto_annotations ||
                    tutorData?.llm_annotation ||
                    {}

                if (index === 0 && Object.keys(annotations).length > 0) {
                    console.log("[v0] First annotation structure:", {
                        tutorName,
                        annotationKeys: Object.keys(annotations).slice(0, 3),
                        sampleValues: Object.entries(annotations)
                            .slice(0, 2)
                            .map(([k, v]) => `${k}: ${v}`),
                    })
                }

                Object.entries(annotations).forEach(([dimension, score]: [string, any]) => {
                    dimensionsSet.add(dimension)

                    // Convert score to number if it's a string
                    let numericScore = 0
                    let category = "no"
                    if (typeof score === "number") {
                        numericScore = score
                        if (score >= 0.75) category = "yes"
                        else if (score >= 0.25) category = "toSomeExtent"
                    } else if (typeof score === "string") {
                        const lowerScore = score.toLowerCase()
                        if (lowerScore === "yes") {
                            numericScore = 1.0
                            category = "yes"
                        } else if (lowerScore === "to some extent") {
                            numericScore = 0.5
                            category = "toSomeExtent"
                        } else if (lowerScore === "no") {
                            numericScore = 0.0
                            category = "no"
                        } else {
                            numericScore = Number.parseFloat(score) || 0
                        }
                    }

                    const key = `${tutorName}::${dimension}`
                    if (!categoryDistributionByTutorAndDimension[key]) {
                        categoryDistributionByTutorAndDimension[key] = {
                            yes: 0,
                            toSomeExtent: 0,
                            no: 0,
                            total: 0,
                        }
                    }
                    categoryDistributionByTutorAndDimension[key][category as "yes" | "toSomeExtent" | "no"]++
                    categoryDistributionByTutorAndDimension[key].total++

                    if (!scoresByTutorAndDimension[key]) {
                        scoresByTutorAndDimension[key] = []
                    }
                    scoresByTutorAndDimension[key].push(numericScore)

                    // Collect scores by dimension
                    if (!scoresByDimension[dimension]) {
                        scoresByDimension[dimension] = []
                    }
                    scoresByDimension[dimension].push(numericScore)

                    // Collect scores by tutor
                    if (!scoresByTutor[tutorName]) {
                        scoresByTutor[tutorName] = []
                    }
                    scoresByTutor[tutorName].push(numericScore)
                })
            })
        })

        const tutors = Array.from(tutorsSet)
        const dimensions = Array.from(dimensionsSet)

        console.log("[v0] Extracted data:", {
            tutorCount: tutors.length,
            dimensionCount: dimensions.length,
            totalScores: Object.values(scoresByDimension).reduce((sum, scores) => sum + scores.length, 0),
        })

        // Check if we extracted any data
        if (tutors.length === 0 || dimensions.length === 0) {
            console.error("[v0] No tutors or dimensions found in dataset")
            return NextResponse.json(
                {
                    success: false,
                    error: "Dataset is empty or not in expected format",
                    details: "Could not extract tutors or dimensions from dataset",
                },
                { status: 500 },
            )
        }

        // Calculate average scores by dimension
        const averageScoresByDimension: { [dimension: string]: number } = {}
        Object.entries(scoresByDimension).forEach(([dimension, scores]) => {
            averageScoresByDimension[dimension] = scores.reduce((a, b) => a + b, 0) / scores.length
        })

        // Calculate average scores by tutor
        const averageScoresByTutor: { [tutor: string]: number } = {}
        Object.entries(scoresByTutor).forEach(([tutor, scores]) => {
            averageScoresByTutor[tutor] = scores.reduce((a, b) => a + b, 0) / scores.length
        })

        const averageScoresByTutorAndDimension: { [key: string]: number } = {}
        Object.entries(scoresByTutorAndDimension).forEach(([key, scores]) => {
            averageScoresByTutorAndDimension[key] = scores.reduce((a, b) => a + b, 0) / scores.length
        })

        // Prepare distribution data for violin chart
        const distributionData = dimensions.flatMap((dimension) => {
            const scores = scoresByDimension[dimension] || []
            return scores.map((score) => ({
                dimension,
                score,
            }))
        })

        console.log("[v0] Successfully processed dataset")

        return NextResponse.json({
            success: true,
            data: {
                totalConversations: dataset.length,
                totalTutors: tutors.length,
                totalDimensions: dimensions.length,
                dimensions,
                tutors,
                conversationsByTutor,
                averageScoresByDimension,
                averageScoresByTutor,
                averageScoresByTutorAndDimension,
                distributionData,
                categoryDistribution: categoryDistributionByTutorAndDimension,
            },
        })
    } catch (error) {
        console.error("[v0] API Error:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Dataset is empty or not in expected format",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        )
    }
}
