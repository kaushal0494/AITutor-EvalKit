# AI Tutor Evaluation Platform

A comprehensive evaluation system for assessing AI tutors' pedagogical abilities across multiple dimensions.

## Features

- **Automated Evaluation**: Evaluate tutors using predefined metrics
- **LLM Evaluation**: Use Large Language Models as Judges for evaluation
- **Dataset Visualizer**: Interactive charts and visualizations on MRBench Train set
- **Comparison Mode**: Compare two tutors and judge responses side-by-side 
- **Feedback System**: Rate and provide feedback on tutor responses
- **Modular Dataset Support**: Use your own dataset locally

## Quick Start

### For Users (View Deployed App)

Visit the deployed application to explore the evaluation tool with the default dataset:
\`\`\`
https://demo-ai-tutor.vercel.app/
\`\`\`

### For Developers (Run Locally with Custom Dataset)

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/NaumanNaeem/Demo-AITutor.git
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Run with default dataset**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Run with your own dataset**
   \`\`\`bash
   npm run dev:custom /path/to/your/dataset.json
   \`\`\`

   Example:
   \`\`\`bash
   npm run dev:custom /users/numaan.naeem/data/test.jsonl
   \`\`\`

## Dataset Setup

### Using Your Own Dataset

The platform supports custom datasets in JSON format.


## Environment Variables

Create a `.env.local` file for local development:

\`\`\`env

## Available Scripts

- `npm run dev` - Start development server with default dataset
- `npm run dev:custom <path>` - Start with custom dataset

## Project Structure

\`\`\`
ai-tutor-platform/
├── app/
│   ├── api/
│   │   ├── autoeval-data/      # Dataset metadata API
│   │   ├── autoeval-context/   # Conversation context API
│   │   ├── autoeval-results/   # Results API
│   │   └── save-feedback/      # Feedback storage API
│   ├── page.tsx                # Main page
│   └── layout.tsx              # Root layout
├── components/
│   ├── auto-eval-dataset.tsx   # Main evaluation component
│   ├── charts/                 # Chart components
│   └── ui/                     # UI components
├── lib/
│   ├── dataset-config.ts       # Dataset configuration module
│   ├── redis.ts                # Redis client
│   └── utils.ts                # Utility functions
├── scripts/
│   ├── dev-with-dataset.js     # Custom dataset dev script
│   └── set-dataset-path.js     # Dataset path setter
├── data/
│   └── default-dataset.jsonl   # Default dataset
├── DATASET_SETUP.md            # Dataset setup guide
└── README.md                   # This file
\`\`\`

## Evaluation Dimensions

The platform evaluates tutors across 8 dimensions:

1. **Mistake Identification**: Ability to identify student errors
2. **Mistake Location**: Precision in locating mistakes
3. **Providing Guidance**: Quality of guidance provided
4. **Actionability**: Clarity of actionable steps



