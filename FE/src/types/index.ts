export interface ScoreBreakdown {
  documentation: number;
  structure: number;
  commitHealth: number;
  testing: number;
}

export interface AIInsight {
  question: string;
  answer: string;
}

export interface RepoAnalysis {
  id: string; // unique ID for localStorage
  url: string;
  name: string;
  owner: string;
  overallScore: number;
  breakdown: ScoreBreakdown;
  readme: string; // Markdown content
  insights: AIInsight[];
  timestamp: string;
}
