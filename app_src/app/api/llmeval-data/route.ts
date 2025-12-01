import { NextResponse } from "next/server"
import { loadDataset } from "@/lib/dataset-config"

const DATASET_FILE_PATH =
    "/Users/numaannaeem/Numaan/Study/RE_Projects/DEMO/Repo/Demo-AITutor/data/sample_mrbench_out.json"

// Sample data for when the backend file is not available (for Vercel deployment)
const SAMPLE_DATA = [
    {
        conversation_id: "sample_001",
        conversation_history:
            "Student: I need help with Elliott's Exercise Equation ||| Tutor: Let's work through this step by step. What do you think we should do first? ||| Student: I'm not sure where to start. ||| Tutor: That's okay! Let's break it down. Elliott's equation relates exercise intensity to heart rate. What do you know about heart rate zones?",
        Problem_topic: "Elliott's Exercise Equation",
        anno_llm_responses: {
            Gemini: {
                response:
                    "Great question! Let's start by identifying the variables in Elliott's exercise equation. The equation typically involves heart rate, age, and exercise intensity. Can you tell me what your current heart rate is?",
                llm_annotation: {
                    "Mistake_Identification_prometheus-eval/prometheus-7b-v2.0": 0.82,
                    "Mistake_Location_prometheus-eval/prometheus-7b-v2.0": 0.75,
                    "Revealing_of_the_Answer_prometheus-eval/prometheus-7b-v2.0": 0.28,
                    "Providing_Guidance_prometheus-eval/prometheus-7b-v2.0": 0.89,
                    "Actionability_prometheus-eval/prometheus-7b-v2.0": 0.85,
                    "Coherence_prometheus-eval/prometheus-7b-v2.0": 0.88,
                    "Tutor_Tone_prometheus-eval/prometheus-7b-v2.0": 0.84,
                    "Humanlikeness_prometheus-eval/prometheus-7b-v2.0": 0.81,
                    "Mistake_Identification_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.79,
                    "Mistake_Location_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.72,
                    "Revealing_of_the_Answer_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.31,
                    "Providing_Guidance_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.86,
                    "Actionability_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.82,
                    "Coherence_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.85,
                    "Tutor_Tone_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.81,
                    "Humanlikeness_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.78,
                },
            },
            "GPT-4": {
                response:
                    "I can see you're working with Elliott's exercise equation. This equation helps determine optimal exercise intensity based on heart rate zones. Let me guide you through this step by step.",
                llm_annotation: {
                    "Mistake_Identification_prometheus-eval/prometheus-7b-v2.0": 0.85,
                    "Mistake_Location_prometheus-eval/prometheus-7b-v2.0": 0.78,
                    "Revealing_of_the_Answer_prometheus-eval/prometheus-7b-v2.0": 0.25,
                    "Providing_Guidance_prometheus-eval/prometheus-7b-v2.0": 0.92,
                    "Actionability_prometheus-eval/prometheus-7b-v2.0": 0.88,
                    "Coherence_prometheus-eval/prometheus-7b-v2.0": 0.91,
                    "Tutor_Tone_prometheus-eval/prometheus-7b-v2.0": 0.87,
                    "Humanlikeness_prometheus-eval/prometheus-7b-v2.0": 0.84,
                    "Mistake_Identification_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.82,
                    "Mistake_Location_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.75,
                    "Revealing_of_the_Answer_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.28,
                    "Providing_Guidance_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.89,
                    "Actionability_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.85,
                    "Coherence_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.88,
                    "Tutor_Tone_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.84,
                    "Humanlikeness_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.81,
                },
            },
            Claude: {
                response:
                    "Let's approach Elliott's exercise equation systematically. This equation is used to calculate target heart rate zones for different exercise intensities.",
                llm_annotation: {
                    "Mistake_Identification_prometheus-eval/prometheus-7b-v2.0": 0.76,
                    "Mistake_Location_prometheus-eval/prometheus-7b-v2.0": 0.69,
                    "Revealing_of_the_Answer_prometheus-eval/prometheus-7b-v2.0": 0.34,
                    "Providing_Guidance_prometheus-eval/prometheus-7b-v2.0": 0.83,
                    "Actionability_prometheus-eval/prometheus-7b-v2.0": 0.79,
                    "Coherence_prometheus-eval/prometheus-7b-v2.0": 0.82,
                    "Tutor_Tone_prometheus-eval/prometheus-7b-v2.0": 0.77,
                    "Humanlikeness_prometheus-eval/prometheus-7b-v2.0": 0.75,
                    "Mistake_Identification_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.73,
                    "Mistake_Location_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.66,
                    "Revealing_of_the_Answer_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.37,
                    "Providing_Guidance_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.8,
                    "Actionability_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.76,
                    "Coherence_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.79,
                    "Tutor_Tone_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.74,
                    "Humanlikeness_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.72,
                },
            },
            Expert: {
                response:
                    "Elliott's exercise equation is fundamental in exercise physiology. The equation calculates target heart rate as: THR = (HRmax - HRrest) × %Intensity + HRrest.",
                llm_annotation: {
                    "Mistake_Identification_prometheus-eval/prometheus-7b-v2.0": 0.91,
                    "Mistake_Location_prometheus-eval/prometheus-7b-v2.0": 0.84,
                    "Revealing_of_the_Answer_prometheus-eval/prometheus-7b-v2.0": 0.52,
                    "Providing_Guidance_prometheus-eval/prometheus-7b-v2.0": 0.97,
                    "Actionability_prometheus-eval/prometheus-7b-v2.0": 0.94,
                    "Coherence_prometheus-eval/prometheus-7b-v2.0": 0.96,
                    "Tutor_Tone_prometheus-eval/prometheus-7b-v2.0": 0.92,
                    "Humanlikeness_prometheus-eval/prometheus-7b-v2.0": 0.89,
                    "Mistake_Identification_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.88,
                    "Mistake_Location_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.81,
                    "Revealing_of_the_Answer_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.49,
                    "Providing_Guidance_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.94,
                    "Actionability_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.91,
                    "Coherence_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.93,
                    "Tutor_Tone_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.89,
                    "Humanlikeness_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.86,
                },
            },
            Llama: {
                response:
                    "I understand you're working with Elliott's exercise equation. This is an important concept in fitness and exercise science.",
                llm_annotation: {
                    "Mistake_Identification_prometheus-eval/prometheus-7b-v2.0": 0.73,
                    "Mistake_Location_prometheus-eval/prometheus-7b-v2.0": 0.66,
                    "Revealing_of_the_Answer_prometheus-eval/prometheus-7b-v2.0": 0.29,
                    "Providing_Guidance_prometheus-eval/prometheus-7b-v2.0": 0.8,
                    "Actionability_prometheus-eval/prometheus-7b-v2.0": 0.76,
                    "Coherence_prometheus-eval/prometheus-7b-v2.0": 0.79,
                    "Tutor_Tone_prometheus-eval/prometheus-7b-v2.0": 0.74,
                    "Humanlikeness_prometheus-eval/prometheus-7b-v2.0": 0.72,
                    "Mistake_Identification_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.7,
                    "Mistake_Location_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.63,
                    "Revealing_of_the_Answer_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.32,
                    "Providing_Guidance_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.77,
                    "Actionability_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.73,
                    "Coherence_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.76,
                    "Tutor_Tone_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.71,
                    "Humanlikeness_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.69,
                },
            },
        },
    },
    {
        conversation_id: "sample_002",
        conversation_history:
            "Student: I'm confused about finding the area of a triangle ||| Tutor: No problem! The formula for the area of a triangle is A = (1/2) × base × height. Do you have the measurements? ||| Student: The base is 6 cm and height is 4 cm ||| Tutor: Great! So A = (1/2) × 6 × 4. Can you calculate that?",
        Problem_topic: "Quadratic Functions",
        anno_llm_responses: {
            Gemini: {
                response:
                    "Let's work through this quadratic function step by step. For y = x² + 4x + 3, we need to find two numbers that multiply to give us 3.",
                llm_annotation: {
                    "Mistake_Identification_prometheus-eval/prometheus-7b-v2.0": 0.8,
                    "Mistake_Location_prometheus-eval/prometheus-7b-v2.0": 0.73,
                    "Revealing_of_the_Answer_prometheus-eval/prometheus-7b-v2.0": 0.3,
                    "Providing_Guidance_prometheus-eval/prometheus-7b-v2.0": 0.87,
                    "Actionability_prometheus-eval/prometheus-7b-v2.0": 0.83,
                    "Coherence_prometheus-eval/prometheus-7b-v2.0": 0.86,
                    "Tutor_Tone_prometheus-eval/prometheus-7b-v2.0": 0.82,
                    "Humanlikeness_prometheus-eval/prometheus-7b-v2.0": 0.79,
                    "Mistake_Identification_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.77,
                    "Mistake_Location_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.7,
                    "Revealing_of_the_Answer_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.33,
                    "Providing_Guidance_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.84,
                    "Actionability_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.8,
                    "Coherence_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.83,
                    "Tutor_Tone_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.79,
                    "Humanlikeness_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.76,
                },
            },
            "GPT-4": {
                response:
                    "I can see you're working with the quadratic function y = x² + 4x + 3. Since you mentioned factoring, let's use that approach.",
                llm_annotation: {
                    "Mistake_Identification_prometheus-eval/prometheus-7b-v2.0": 0.83,
                    "Mistake_Location_prometheus-eval/prometheus-7b-v2.0": 0.76,
                    "Revealing_of_the_Answer_prometheus-eval/prometheus-7b-v2.0": 0.27,
                    "Providing_Guidance_prometheus-eval/prometheus-7b-v2.0": 0.9,
                    "Actionability_prometheus-eval/prometheus-7b-v2.0": 0.86,
                    "Coherence_prometheus-eval/prometheus-7b-v2.0": 0.89,
                    "Tutor_Tone_prometheus-eval/prometheus-7b-v2.0": 0.85,
                    "Humanlikeness_prometheus-eval/prometheus-7b-v2.0": 0.82,
                    "Mistake_Identification_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.8,
                    "Mistake_Location_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.73,
                    "Revealing_of_the_Answer_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.3,
                    "Providing_Guidance_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.87,
                    "Actionability_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.83,
                    "Coherence_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.86,
                    "Tutor_Tone_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.82,
                    "Humanlikeness_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.79,
                },
            },
            Claude: {
                response:
                    "Great! You've identified that we can use factoring for this quadratic. For y = x² + 4x + 3, we're looking for two numbers that multiply to 3 and add to 4.",
                llm_annotation: {
                    "Mistake_Identification_prometheus-eval/prometheus-7b-v2.0": 0.74,
                    "Mistake_Location_prometheus-eval/prometheus-7b-v2.0": 0.67,
                    "Revealing_of_the_Answer_prometheus-eval/prometheus-7b-v2.0": 0.36,
                    "Providing_Guidance_prometheus-eval/prometheus-7b-v2.0": 0.81,
                    "Actionability_prometheus-eval/prometheus-7b-v2.0": 0.77,
                    "Coherence_prometheus-eval/prometheus-7b-v2.0": 0.8,
                    "Tutor_Tone_prometheus-eval/prometheus-7b-v2.0": 0.75,
                    "Humanlikeness_prometheus-eval/prometheus-7b-v2.0": 0.73,
                    "Mistake_Identification_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.71,
                    "Mistake_Location_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.64,
                    "Revealing_of_the_Answer_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.39,
                    "Providing_Guidance_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.78,
                    "Actionability_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.74,
                    "Coherence_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.77,
                    "Tutor_Tone_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.72,
                    "Humanlikeness_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.7,
                },
            },
            Expert: {
                response:
                    "Excellent choice to use factoring! For the quadratic y = x² + 4x + 3, we apply the factoring method where we seek two numbers that multiply to c (3) and sum to b (4).",
                llm_annotation: {
                    "Mistake_Identification_prometheus-eval/prometheus-7b-v2.0": 0.89,
                    "Mistake_Location_prometheus-eval/prometheus-7b-v2.0": 0.82,
                    "Revealing_of_the_Answer_prometheus-eval/prometheus-7b-v2.0": 0.55,
                    "Providing_Guidance_prometheus-eval/prometheus-7b-v2.0": 0.95,
                    "Actionability_prometheus-eval/prometheus-7b-v2.0": 0.92,
                    "Coherence_prometheus-eval/prometheus-7b-v2.0": 0.94,
                    "Tutor_Tone_prometheus-eval/prometheus-7b-v2.0": 0.9,
                    "Humanlikeness_prometheus-eval/prometheus-7b-v2.0": 0.87,
                    "Mistake_Identification_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.86,
                    "Mistake_Location_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.79,
                    "Revealing_of_the_Answer_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.52,
                    "Providing_Guidance_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.92,
                    "Actionability_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.89,
                    "Coherence_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.91,
                    "Tutor_Tone_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.87,
                    "Humanlikeness_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.84,
                },
            },
            Llama: {
                response:
                    "You're on the right track with factoring! For the quadratic y = x² + 4x + 3, we need to find two numbers that multiply to 3 and add to 4.",
                llm_annotation: {
                    "Mistake_Identification_prometheus-eval/prometheus-7b-v2.0": 0.71,
                    "Mistake_Location_prometheus-eval/prometheus-7b-v2.0": 0.64,
                    "Revealing_of_the_Answer_prometheus-eval/prometheus-7b-v2.0": 0.33,
                    "Providing_Guidance_prometheus-eval/prometheus-7b-v2.0": 0.78,
                    "Actionability_prometheus-eval/prometheus-7b-v2.0": 0.74,
                    "Coherence_prometheus-eval/prometheus-7b-v2.0": 0.77,
                    "Tutor_Tone_prometheus-eval/prometheus-7b-v2.0": 0.72,
                    "Humanlikeness_prometheus-eval/prometheus-7b-v2.0": 0.7,
                    "Mistake_Identification_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.68,
                    "Mistake_Location_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.61,
                    "Revealing_of_the_Answer_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.36,
                    "Providing_Guidance_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.75,
                    "Actionability_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.71,
                    "Coherence_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.74,
                    "Tutor_Tone_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.69,
                    "Humanlikeness_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.67,
                },
            },
        },
    },
    {
        conversation_id: "sample_003",
        conversation_history:
            "Student: I don't understand how to calculate velocity ||| Tutor: Velocity is distance divided by time, or v = d/t. What's the problem asking for? ||| Student: A car travels 100 meters in 10 seconds ||| Tutor: Perfect! So we have distance = 100m and time = 10s. What do you get when you divide?",
        Problem_topic: "Photosynthesis Process",
        anno_llm_responses: {
            Gemini: {
                response:
                    "You're absolutely right about water and carbon dioxide! Those are key ingredients for photosynthesis. Now, let's think about where this amazing process takes place in the plant.",
                llm_annotation: {
                    "Mistake_Identification_prometheus-eval/prometheus-7b-v2.0": 0.78,
                    "Mistake_Location_prometheus-eval/prometheus-7b-v2.0": 0.71,
                    "Revealing_of_the_Answer_prometheus-eval/prometheus-7b-v2.0": 0.32,
                    "Providing_Guidance_prometheus-eval/prometheus-7b-v2.0": 0.85,
                    "Actionability_prometheus-eval/prometheus-7b-v2.0": 0.81,
                    "Coherence_prometheus-eval/prometheus-7b-v2.0": 0.84,
                    "Tutor_Tone_prometheus-eval/prometheus-7b-v2.0": 0.8,
                    "Humanlikeness_prometheus-eval/prometheus-7b-v2.0": 0.77,
                    "Mistake_Identification_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.75,
                    "Mistake_Location_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.68,
                    "Revealing_of_the_Answer_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.35,
                    "Providing_Guidance_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.82,
                    "Actionability_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.78,
                    "Coherence_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.81,
                    "Tutor_Tone_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.77,
                    "Humanlikeness_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.74,
                },
            },
            "GPT-4": {
                response:
                    "Perfect! You've identified the main ingredients: sunlight, water, and carbon dioxide. Now let's explore where photosynthesis occurs.",
                llm_annotation: {
                    "Mistake_Identification_prometheus-eval/prometheus-7b-v2.0": 0.81,
                    "Mistake_Location_prometheus-eval/prometheus-7b-v2.0": 0.74,
                    "Revealing_of_the_Answer_prometheus-eval/prometheus-7b-v2.0": 0.29,
                    "Providing_Guidance_prometheus-eval/prometheus-7b-v2.0": 0.88,
                    "Actionability_prometheus-eval/prometheus-7b-v2.0": 0.84,
                    "Coherence_prometheus-eval/prometheus-7b-v2.0": 0.87,
                    "Tutor_Tone_prometheus-eval/prometheus-7b-v2.0": 0.83,
                    "Humanlikeness_prometheus-eval/prometheus-7b-v2.0": 0.8,
                    "Mistake_Identification_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.78,
                    "Mistake_Location_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.71,
                    "Revealing_of_the_Answer_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.32,
                    "Providing_Guidance_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.85,
                    "Actionability_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.81,
                    "Coherence_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.84,
                    "Tutor_Tone_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.8,
                    "Humanlikeness_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.77,
                },
            },
            Claude: {
                response:
                    "Excellent deduction! Water and carbon dioxide are indeed essential for photosynthesis, along with sunlight. Now, regarding where this process occurs - think about the parts of a plant that are most exposed to sunlight.",
                llm_annotation: {
                    "Mistake_Identification_prometheus-eval/prometheus-7b-v2.0": 0.72,
                    "Mistake_Location_prometheus-eval/prometheus-7b-v2.0": 0.65,
                    "Revealing_of_the_Answer_prometheus-eval/prometheus-7b-v2.0": 0.38,
                    "Providing_Guidance_prometheus-eval/prometheus-7b-v2.0": 0.79,
                    "Actionability_prometheus-eval/prometheus-7b-v2.0": 0.75,
                    "Coherence_prometheus-eval/prometheus-7b-v2.0": 0.78,
                    "Tutor_Tone_prometheus-eval/prometheus-7b-v2.0": 0.73,
                    "Humanlikeness_prometheus-eval/prometheus-7b-v2.0": 0.71,
                    "Mistake_Identification_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.69,
                    "Mistake_Location_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.62,
                    "Revealing_of_the_Answer_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.41,
                    "Providing_Guidance_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.76,
                    "Actionability_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.72,
                    "Coherence_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.75,
                    "Tutor_Tone_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.7,
                    "Humanlikeness_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.68,
                },
            },
            Expert: {
                response:
                    "Correct! The photosynthesis equation is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. This process occurs primarily in the chloroplasts of leaf cells.",
                llm_annotation: {
                    "Mistake_Identification_prometheus-eval/prometheus-7b-v2.0": 0.87,
                    "Mistake_Location_prometheus-eval/prometheus-7b-v2.0": 0.8,
                    "Revealing_of_the_Answer_prometheus-eval/prometheus-7b-v2.0": 0.58,
                    "Providing_Guidance_prometheus-eval/prometheus-7b-v2.0": 0.93,
                    "Actionability_prometheus-eval/prometheus-7b-v2.0": 0.9,
                    "Coherence_prometheus-eval/prometheus-7b-v2.0": 0.92,
                    "Tutor_Tone_prometheus-eval/prometheus-7b-v2.0": 0.88,
                    "Humanlikeness_prometheus-eval/prometheus-7b-v2.0": 0.85,
                    "Mistake_Identification_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.84,
                    "Mistake_Location_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.77,
                    "Revealing_of_the_Answer_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.55,
                    "Providing_Guidance_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.9,
                    "Actionability_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.87,
                    "Coherence_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.89,
                    "Tutor_Tone_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.85,
                    "Humanlikeness_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.82,
                },
            },
            Llama: {
                response:
                    "You're thinking correctly! Water and carbon dioxide are crucial components for photosynthesis. The process mainly happens in the leaves of plants.",
                llm_annotation: {
                    "Mistake_Identification_prometheus-eval/prometheus-7b-v2.0": 0.69,
                    "Mistake_Location_prometheus-eval/prometheus-7b-v2.0": 0.62,
                    "Revealing_of_the_Answer_prometheus-eval/prometheus-7b-v2.0": 0.35,
                    "Providing_Guidance_prometheus-eval/prometheus-7b-v2.0": 0.76,
                    "Actionability_prometheus-eval/prometheus-7b-v2.0": 0.72,
                    "Coherence_prometheus-eval/prometheus-7b-v2.0": 0.75,
                    "Tutor_Tone_prometheus-eval/prometheus-7b-v2.0": 0.7,
                    "Humanlikeness_prometheus-eval/prometheus-7b-v2.0": 0.68,
                    "Mistake_Identification_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.66,
                    "Mistake_Location_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.59,
                    "Revealing_of_the_Answer_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.38,
                    "Providing_Guidance_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.73,
                    "Actionability_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.69,
                    "Coherence_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.72,
                    "Tutor_Tone_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.67,
                    "Humanlikeness_meta-llama/Meta-Llama-3.1-8B-Instruct": 0.65,
                },
            },
        },
    },
]

function normalizeItem(raw: any) {
    const problem_topic = raw.Problem_topic ?? raw.problem_topic ?? raw.Topic ?? "Not Available"

    let tutors = raw.tutors
    if (!tutors && raw.anno_llm_responses) {
        tutors = {}
        for (const [model, data] of Object.entries(raw.anno_llm_responses)) {
            const tutorData: any = data
            tutors[model] = {
                response: tutorData.response ?? "",
                annotation: tutorData.annotation ?? {},
                auto_annotations: tutorData.auto_annotation ?? {},
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
    console.log("🔍 [LLMEval-Data] GET request received")

    try {
        const { data: rawData, error } = await loadDataset("evaluation")

        if (error) {
            console.error("❌ [LLMEval-Data] Error loading dataset:", error)
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

        console.log("✅ [LLMEval-Data] Successfully loaded dataset")
        console.log("📊 [LLMEval-Data] Total items:", datasetData.length)

        // Extract unique problem topics
        const problemTopics = [...new Set(datasetData.map((item: any) => item.problem_topic))].filter(Boolean)
        console.log("📋 [LLMEval-Data] Problem topics found:", problemTopics)

        // Extract unique models
        const models = new Set<string>()
        datasetData.forEach((item: any) => {
            if (item.tutors) {
                Object.keys(item.tutors).forEach((model) => models.add(model))
            }
        })
        const modelsList = Array.from(models)
        console.log("🤖 [LLMEval-Data] Models found:", modelsList)

        const dimensions = new Set<string>()
        datasetData.forEach((item: any) => {
            if (item.tutors) {
                Object.values(item.tutors).forEach((tutor: any) => {
                    if (tutor.annotation) {
                        Object.keys(tutor.annotation).forEach((dim) => dimensions.add(dim))
                    }
                })
            }
        })
        const dimensionsList = Array.from(dimensions)
        console.log("📏 [LLMEval-Data] Dimensions found (4 core):", dimensionsList)

        const judgeLLMs = new Set<string>()
        datasetData.forEach((item: any) => {
            if (item.tutors) {
                Object.values(item.tutors).forEach((tutor: any) => {
                    if (tutor.llm_annotations) {
                        Object.keys(tutor.llm_annotations).forEach((key) => {
                            // Only extract new categorical format: "Dimension/JudgeName"
                            if (key.includes("/")) {
                                const parts = key.split("/")
                                if (parts.length === 2) {
                                    const judge = parts[1] // e.g., "GPT5" or "Prometheus"
                                    // Only include GPT5 and Prometheus
                                    if (judge === "GPT5" || judge === "Prometheus") {
                                        judgeLLMs.add(judge)
                                    }
                                }
                            }
                            // Ignore old numeric format with underscores
                        })
                    }
                })
            }
        })
        const judgeLLMsList = Array.from(judgeLLMs)
        console.log("⚖️ [LLMEval-Data] Judge LLMs found:", judgeLLMsList)

        const totalConversations = datasetData.length
        console.log("💬 [LLMEval-Data] Total conversations:", totalConversations)

        const result = {
            success: true,
            problemTopics,
            models: modelsList,
            dimensions: dimensionsList,
            judgeLLMs: judgeLLMsList,
            totalConversations,
            dataSource: "evaluation",
        }

        console.log("✅ [LLMEval-Data] Returning result:", JSON.stringify(result, null, 2))
        return NextResponse.json(result)
    } catch (error) {
        console.error("❌ [LLMEval-Data] API error:", error)
        console.error("❌ [LLMEval-Data] Error stack:", error instanceof Error ? error.stack : "No stack trace")

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
