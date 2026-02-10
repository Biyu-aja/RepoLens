/**
 * AI Service - Centralized AI interaction for RepoLens
 * Uses Gemini API through gateway for repository evaluation
 */

interface AIConfig {
    apiKey: string;
    apiUrl: string;
    model: string;
}

interface RepoEvaluationContext {
    owner: string;
    name: string;
    description?: string;
    readme: string;
    fileStructure: string[];
    stars?: number;
    forks?: number;
    openIssues?: number;
    languages?: Record<string, number>;
}

export interface RadarCategory {
    category: string;
    score: number;
    ideal: number;
    gap: string;  // Reason for the gap
}

export interface ProductionReadiness {
    ready: boolean;
    score: number;
    reasons: string[];
}

export interface AIEvaluationResult {
    overallScore: number;
    breakdown: {
        documentation: number;
        structure: number;
        codeQuality: number;
        testing: number;
    };
    summary: string;
    techStack: string[];
    strengths: string[];
    improvements: string[];
    insights: Array<{ question: string; answer: string }>;
    radarAnalysis: RadarCategory[];
    productionReadiness: ProductionReadiness;
}

const getAIConfig = (): AIConfig => {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
        throw new Error('AI_API_KEY is not configured');
    }
    return {
        apiKey,
        apiUrl: process.env.AI_API_URL || 'https://gateway.haluai.my.id/v1',
        model: process.env.AI_MODEL || 'gemini-2.0-flash'
    };
};

/**
 * Sanitize and validate AI result
 */
const sanitizeResult = (result: any): AIEvaluationResult => {
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(val) || 0));

    // Default radar analysis if not provided
    const defaultRadar: RadarCategory[] = [
        { category: 'Documentation', score: clamp(result.breakdown?.documentation, 0, 100), ideal: 90, gap: 'Not analyzed' },
        { category: 'Code Structure', score: clamp(result.breakdown?.structure, 0, 100), ideal: 85, gap: 'Not analyzed' },
        { category: 'Testing', score: clamp(result.breakdown?.testing, 0, 100), ideal: 80, gap: 'Not analyzed' },
        { category: 'DevOps/CI', score: 50, ideal: 75, gap: 'Not analyzed' },
        { category: 'Security', score: 50, ideal: 80, gap: 'Not analyzed' },
        { category: 'Maintainability', score: clamp(result.breakdown?.codeQuality, 0, 100), ideal: 85, gap: 'Not analyzed' }
    ];

    // Sanitize radar if provided
    const radarAnalysis = Array.isArray(result.radarAnalysis)
        ? result.radarAnalysis.map((r: any) => ({
            category: String(r.category || 'Unknown'),
            score: clamp(r.score, 0, 100),
            ideal: clamp(r.ideal, 0, 100),
            gap: String(r.gap || 'Not analyzed')
        }))
        : defaultRadar;

    // Sanitize production readiness
    const productionReadiness: ProductionReadiness = {
        ready: Boolean(result.productionReadiness?.ready),
        score: clamp(result.productionReadiness?.score || result.overallScore, 0, 100),
        reasons: Array.isArray(result.productionReadiness?.reasons)
            ? result.productionReadiness.reasons.slice(0, 5).map(String)
            : ['Analysis pending']
    };

    return {
        overallScore: clamp(result.overallScore, 0, 100),
        breakdown: {
            documentation: clamp(result.breakdown?.documentation, 0, 100),
            structure: clamp(result.breakdown?.structure, 0, 100),
            codeQuality: clamp(result.breakdown?.codeQuality, 0, 100),
            testing: clamp(result.breakdown?.testing, 0, 100)
        },
        summary: String(result.summary || 'No summary available'),
        techStack: Array.isArray(result.techStack) ? result.techStack.slice(0, 10) : [],
        strengths: Array.isArray(result.strengths) ? result.strengths.slice(0, 5) : [],
        improvements: Array.isArray(result.improvements) ? result.improvements.slice(0, 5) : [],
        insights: Array.isArray(result.insights) ? result.insights.slice(0, 6) : [],
        radarAnalysis,
        productionReadiness
    };
};

/**
 * Fallback result when AI fails
 */
const getFallbackResult = (context: RepoEvaluationContext): AIEvaluationResult => {
    // Basic heuristic fallback
    const hasReadme = context.readme.length > 100;
    const hasTests = context.fileStructure.some(f => f.includes('test') || f.includes('spec'));
    const hasSrc = context.fileStructure.some(f => f.includes('src/') || f.includes('lib/'));
    const hasCI = context.fileStructure.some(f => f.includes('.github/workflows') || f.includes('.circleci') || f.includes('.travis'));

    const docScore = hasReadme ? 70 : 30;
    const structureScore = hasSrc ? 75 : 50;
    const testScore = hasTests ? 70 : 20;
    const ciScore = hasCI ? 70 : 30;
    const overallScore = 50 + (hasReadme ? 15 : 0) + (hasTests ? 15 : 0) + (hasSrc ? 10 : 0);

    return {
        overallScore,
        breakdown: {
            documentation: docScore,
            structure: structureScore,
            codeQuality: 60,
            testing: testScore
        },
        summary: `A ${context.name} repository by ${context.owner}.`,
        techStack: [],
        strengths: hasReadme ? ['Has documentation'] : [],
        improvements: hasTests ? [] : ['Add tests'],
        insights: [
            { question: 'Analysis Status', answer: 'AI analysis unavailable. Using basic heuristics.' }
        ],
        radarAnalysis: [
            { category: 'Documentation', score: docScore, ideal: 90, gap: hasReadme ? 'Meets basic standard' : 'No README found' },
            { category: 'Code Structure', score: structureScore, ideal: 85, gap: hasSrc ? 'Has organized structure' : 'Needs better organization' },
            { category: 'Testing', score: testScore, ideal: 80, gap: hasTests ? 'Has test coverage' : 'No tests found' },
            { category: 'DevOps/CI', score: ciScore, ideal: 75, gap: hasCI ? 'Has CI configuration' : 'No CI/CD setup found' },
            { category: 'Security', score: 50, ideal: 80, gap: 'Unable to analyze security' },
            { category: 'Maintainability', score: 60, ideal: 85, gap: 'Unable to analyze maintainability' }
        ],
        productionReadiness: {
            ready: overallScore >= 70,
            score: overallScore,
            reasons: [
                hasReadme ? '✓ Documentation available' : '✗ Missing documentation',
                hasTests ? '✓ Tests present' : '✗ No test coverage',
                hasCI ? '✓ CI/CD configured' : '✗ No CI/CD setup'
            ]
        }
    };
};

/**
 * Evaluate a repository using AI
 */
export const evaluateRepository = async (context: RepoEvaluationContext): Promise<AIEvaluationResult> => {
    const config = getAIConfig();

    // Prepare file structure summary (limit to avoid token overflow)
    const structureSummary = context.fileStructure.slice(0, 100).join('\n');
    const hasMore = context.fileStructure.length > 100;

    const prompt = `You are an expert code reviewer. Analyze this GitHub repository and provide a comprehensive evaluation.

REPOSITORY: ${context.owner}/${context.name}
${context.description ? `DESCRIPTION: ${context.description}` : ''}
STARS: ${context.stars || 0} | FORKS: ${context.forks || 0} | OPEN ISSUES: ${context.openIssues || 0}

README CONTENT:
\`\`\`
${context.readme.substring(0, 4000)}${context.readme.length > 4000 ? '\n...(truncated)' : ''}
\`\`\`

FILE STRUCTURE:
\`\`\`
${structureSummary}${hasMore ? `\n...(and ${context.fileStructure.length - 100} more files)` : ''}
\`\`\`

Provide your evaluation as a JSON object with this EXACT structure (no markdown, just JSON):
{
  "overallScore": <number 0-100>,
  "breakdown": {
    "documentation": <number 0-100>,
    "structure": <number 0-100>,
    "codeQuality": <number 0-100>,
    "testing": <number 0-100>
  },
  "summary": "<1-2 sentence project summary>",
  "techStack": ["<technology1>", "<technology2>", ...],
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "improvements": ["<improvement1>", "<improvement2>", "<improvement3>"],
  "insights": [
    {"question": "What are the main weaknesses?", "answer": "<your analysis>"},
    {"question": "How can documentation be improved?", "answer": "<your analysis>"},
    {"question": "What should be prioritized next?", "answer": "<your analysis>"}
  ],
  "radarAnalysis": [
    {"category": "Documentation", "score": <actual 0-100>, "ideal": 90, "gap": "<why score is below ideal, or 'Meets standard' if good>"},
    {"category": "Code Structure", "score": <actual 0-100>, "ideal": 85, "gap": "<reason>"},
    {"category": "Testing", "score": <actual 0-100>, "ideal": 80, "gap": "<reason>"},
    {"category": "DevOps/CI", "score": <actual 0-100>, "ideal": 75, "gap": "<reason>"},
    {"category": "Security", "score": <actual 0-100>, "ideal": 80, "gap": "<reason>"},
    {"category": "Maintainability", "score": <actual 0-100>, "ideal": 85, "gap": "<reason>"}
  ],
  "productionReadiness": {
    "ready": <true/false>,
    "score": <0-100>,
    "reasons": ["<reason1 why ready or not ready>", "<reason2>", "<reason3>"]
  }
}

Scoring Guidelines:
- 90-100: Excellent, production-ready with best practices
- 70-89: Good, minor improvements needed
- 50-69: Fair, significant improvements recommended
- 0-49: Needs major work

Be specific, constructive, and base scores on actual evidence from the README and file structure.`;

    try {
        const response = await fetch(`${config.apiUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    { role: 'system', content: 'You are a code analysis expert. Respond ONLY with valid JSON, no markdown formatting.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 2048,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AI] Evaluation API Error:', response.status, errorText);
            throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Parse JSON from response (handle possible markdown wrapping)
        let result: AIEvaluationResult;
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            result = JSON.parse(jsonMatch ? jsonMatch[0] : content);
        } catch (parseError) {
            console.error('[AI] Failed to parse AI response:', content);
            // Return fallback result
            return getFallbackResult(context);
        }

        // Validate and sanitize the result
        return sanitizeResult(result);

    } catch (error) {
        console.error('[AI] Evaluation failed:', error);
        return getFallbackResult(context);
    }
};

export default {
    evaluateRepository
};
