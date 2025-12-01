"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AutoEvalDataset } from "@/components/auto-eval-dataset"
import { LLMEvalDataset } from "@/components/llm-eval-dataset"
import { Brain, Zap, BarChart3 } from "lucide-react"
import { DatasetVisualizer } from "@/components/dataset-visualizer"
import { ClientOnly } from "@/components/client-only"
import { Header } from "@/components/header"

export default function AITutorPlatform() {
    const [autoEvalResults, setAutoEvalResults] = useState<any[]>([])
    const [llmEvalResults, setLLMEvalResults] = useState<any[]>([])

    const handleAutoEvalResults = (results: any) => {
        setAutoEvalResults((prev) => [...prev, results])
    }

    const handleLLMEvalResults = (results: any) => {
        setLLMEvalResults((prev) => [...prev, results])
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <Header />

            <div className="container mx-auto px-4 pb-8">
                <ClientOnly
                    fallback={
                        <div className="animate-pulse">
                            <div className="h-10 bg-gray-200 rounded mb-4"></div>
                            <div className="h-64 bg-gray-200 rounded"></div>
                        </div>
                    }
                >
                    <Tabs defaultValue="autoeval-dataset" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-lg border border-gray-200/50">
                            <TabsTrigger
                                value="autoeval-dataset"
                                className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-green-50 hover:text-green-700 hover:shadow-sm text-gray-700"
                            >
                                <Zap className="w-4 h-4" />
                                <span className="font-semibold">Automated Evaluation</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="llmeval-dataset"
                                className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-400 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-purple-50 hover:text-purple-700 hover:shadow-sm text-gray-700"
                            >
                                <Brain className="w-4 h-4" />
                                <span className="font-semibold">LLM Evaluation</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="dataset-visualizer"
                                className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-amber-50 hover:text-amber-700 hover:shadow-sm text-gray-700"
                            >
                                <BarChart3 className="w-4 h-4" />
                                {/* <span>Visualizer</span> */}
                                <span className="font-semibold">Visualizer</span>

                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="autoeval-dataset">
                            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                                <CardHeader className="border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
                                    <CardTitle className="flex items-center gap-3 text-gray-800">
                                        <div className="p-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-lg">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        Automated Evaluation
                                    </CardTitle>
                                    <CardDescription className="text-gray-600 mt-2">
                                        Select problem topics and view automated evaluation scores
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <AutoEvalDataset onResults={handleAutoEvalResults} results={autoEvalResults} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="llmeval-dataset">
                            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                                <CardHeader className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                                    <CardTitle className="flex items-center gap-3 text-gray-800">
                                        <div className="p-2 bg-gradient-to-r from-purple-400 to-pink-500 text-white rounded-lg">
                                            <Brain className="w-5 h-5" />
                                        </div>
                                        LLM Evaluation
                                    </CardTitle>
                                    <CardDescription className="text-gray-600 mt-2">
                                        Use Large Language Models as judges for advanced pedagogical assessment with comparison capabilities
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <LLMEvalDataset onResults={handleLLMEvalResults} results={llmEvalResults} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="dataset-visualizer">
                            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                                <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
                                    <CardTitle className="flex items-center gap-3 text-gray-800">
                                        <div className="p-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg">
                                            <BarChart3 className="w-5 h-5" />
                                        </div>
                                        Visualization
                                    </CardTitle>
                                    <CardDescription className="text-gray-600 mt-2">
                                        Compare automated and LLM annotation results with interactive spider and bar plots
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <DatasetVisualizer />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </ClientOnly>
            </div>
        </div>
    )
}
