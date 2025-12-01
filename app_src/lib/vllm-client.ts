interface VLLMRequest {
    model: string
    prompt: string
    max_tokens: number
    temperature: number
}

interface VLLMResponse {
    choices: Array<{
        text: string
        finish_reason: string
    }>
}

export class VLLMClient {
    private baseUrl: string
    private modelPath: string

    constructor(baseUrl = "http://localhost:8020", modelPath = "/l/users/numaan.naeem/Models/phi4") {
        this.baseUrl = baseUrl
        this.modelPath = modelPath
    }

    async generateCompletion(prompt: string, maxTokens = 100, temperature = 0.7): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/v1/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: this.modelPath,
                    prompt,
                    max_tokens: maxTokens,
                    temperature,
                } as VLLMRequest),
            })

            if (!response.ok) {
                throw new Error(`vLLM API error: ${response.status} ${response.statusText}`)
            }

            const data: VLLMResponse = await response.json()
            return data.choices[0]?.text?.trim() || ""
        } catch (error) {
            console.error("Error calling vLLM API:", error)
            throw new Error("Failed to generate completion from vLLM server")
        }
    }

    async evaluateDimensions(conversation: string, dimensions: string[]): Promise<Record<string, string>> {
        const results: Record<string, string> = {}

        for (const dimension of dimensions) {
            const prompt = this.createEvaluationPrompt(conversation, dimension)
            try {
                const response = await this.generateCompletion(prompt, 50, 0.1)
                results[dimension] = this.parseResponse(response)
            } catch (error) {
                console.error(`Error evaluating dimension ${dimension}:`, error)
                results[dimension] = "Error"
            }
        }

        return results
    }

    private createEvaluationPrompt(conversation: string, dimension: string): string {
        const dimensionPrompts = {
            MI: `Analyze the following conversation and determine if there is mistake identification present. Respond with only "Yes" or "No".\n\nConversation: ${conversation}\n\nMistake Identification:`,
            ML: `Analyze the following conversation and determine if there is mistake location present. Respond with only "Yes" or "No".\n\nConversation: ${conversation}\n\nMistake Location:`,
            RA: `Analyze the following conversation and determine if there is appropriate answer revelation. Respond with only "Yes" or "No".\n\nConversation: ${conversation}\n\nRevealing Answer:`,
            PG: `Analyze the following conversation and determine if there is proper guidance provided. Respond with only "Yes" or "No".\n\nConversation: ${conversation}\n\nProviding Guidance:`,
            AC: `Analyze the following conversation and determine if the feedback is actionable. Respond with only "Yes" or "No".\n\nConversation: ${conversation}\n\nActionability:`,
            CO: `Analyze the following conversation and determine if there is coherence in the response. Respond with only "Yes" or "No".\n\nConversation: ${conversation}\n\nCoherence:`,
            TT: `Analyze the following conversation and determine if the tutor tone is appropriate. Respond with only "Yes" or "No".\n\nConversation: ${conversation}\n\nTutor Tone:`,
            HM: `Analyze the following conversation and determine if the response is human-like. Respond with only "Yes" or "No".\n\nConversation: ${conversation}\n\nHuman-likeness:`,
        }

        return dimensionPrompts[dimension as keyof typeof dimensionPrompts] || `Evaluate ${dimension}: ${conversation}`
    }

    private parseResponse(response: string): string {
        const cleaned = response.trim().toLowerCase()
        if (cleaned.includes("yes")) return "Yes"
        if (cleaned.includes("no")) return "No"
        return response.trim()
    }
}