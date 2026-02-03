import type { RepoAnalysis } from '../types';

const MOCK_README = `# RepoLens

## Overview
RepoLens is a dashboard for analyzing GitHub repositories.

## Features
- **Score Analysis**: Be judged by an AI.
- **Dashboard**: Pretty charts.
- **Local Persistence**: No database needed.

## Installation
\`\`\`bash
npm install
npm run dev
\`\`\`

## Contributing
PRS are welcome.
`;

const QUESTIONS = [
  "Is this repository production-ready?",
  "What are the main weaknesses?",
  "How can the documentation be improved?",
  "What should be prioritized next?"
];

// Helper to wait
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeRepository = async (repoUrl: string): Promise<RepoAnalysis> => {
  // Simulate API delay
  await delay(2000);

  // Parse URL to get name (simple logic)
  let name = "unknown-repo";
  let owner = "unknown-user";

  try {
    const url = new URL(repoUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      owner = parts[0];
      name = parts[1];
    }
  } catch (e) {
    // If user typed "owner/repo" directly
    const parts = repoUrl.split('/');
    if (parts.length === 2) {
      owner = parts[0];
      name = parts[1];
    }
  }

  // Generate pseudo-random scores based on name length to be somewhat deterministic for the same repo
  const seed = name.length + owner.length;
  const score = Math.max(0, Math.min(100, 70 + (seed % 30))); // Score between 70-100

  return {
    id: `repo_${Date.now()}`,
    url: repoUrl,
    name,
    owner,
    overallScore: score,
    breakdown: {
      documentation: Math.max(50, Math.min(100, score + 10)),
      structure: Math.max(50, Math.min(100, score - 5)),
      commitHealth: Math.max(50, Math.min(100, score + 5)),
      testing: Math.max(20, Math.min(100, score - 20)), // Usually testing is the weakness
    },
    readme: MOCK_README,
    insights: QUESTIONS.map(q => ({
      question: q,
      answer: generateMockAnswer(q, score)
    })),
    timestamp: new Date().toISOString()
  };
};

function generateMockAnswer(question: string, score: number): string {
  if (question.includes("production-ready")) {
    return score > 80
      ? "Yes, the repository shows strong structure and documentation."
      : "Not yet. Test coverage is low and documentation needs detail.";
  }
  if (question.includes("weaknesses")) {
    return "Test coverage is the primary concern. Unit tests are missing for core utils.";
  }
  if (question.includes("documentation")) {
    return "Add API reference and contribution guidelines to the README.";
  }
  return "Focus on setting up CI/CD pipelines and increasing test coverage.";
}
