export interface ScoreBreakdown {
  documentation: number;
  structure: number;
  codeQuality: number;
  testing: number;
}

export interface AIInsight {
  question: string;
  answer: string;
}

export interface RepoStats {
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  language: string | null;
  license: string | null;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
}

export interface Contributor {
  login: string;
  avatarUrl: string;
  profileUrl: string;
  contributions: number;
  percentage: number;
}

export interface LanguageInfo {
  name: string;
  bytes: number;
  percentage: number;
}

export interface RadarCategory {
  category: string;
  score: number;
  ideal: number;
  gap: string;
}

export interface ProductionReadiness {
  ready: boolean;
  score: number;
  reasons: string[];
}

export interface RepoAnalysis {
  id: string;
  url: string;
  name: string;
  owner: string;
  description?: string;
  timestamp: string;
  readme: string;
  // GitHub stats
  stats: RepoStats;
  // Contributors
  contributors: Contributor[];
  // Language distribution
  languages: LanguageInfo[];
  // AI evaluation
  overallScore: number;
  breakdown: ScoreBreakdown;
  summary: string;
  techStack: string[];
  strengths: string[];
  improvements: string[];
  insights: AIInsight[];
  // Radar analysis
  radarAnalysis: RadarCategory[];
  // Production readiness
  productionReadiness: ProductionReadiness;
}
