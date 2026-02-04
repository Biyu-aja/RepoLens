import { Router, Request, Response } from 'express';

const router = Router();

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface ChatRequest {
    message: string;
    repoContext: {
        name: string;
        owner: string;
        readme: string;
        overallScore: number;
        breakdown: {
            documentation: number;
            structure: number;
            commitHealth: number;
            testing: number;
        };
        insights: Array<{ question: string; answer: string }>;
    };
    history: ChatMessage[];
}

const buildSystemPrompt = (repoContext: ChatRequest['repoContext']) => {
    return `You are RepoLens AI, an intelligent assistant that helps developers understand and improve their GitHub repositories.

Current Repository: ${repoContext.owner}/${repoContext.name}

Repository Analysis Summary:
- Overall Score: ${repoContext.overallScore}/100
- Documentation Score: ${repoContext.breakdown.documentation}/100
- Structure Score: ${repoContext.breakdown.structure}/100
- Commit Health Score: ${repoContext.breakdown.commitHealth}/100
- Testing Score: ${repoContext.breakdown.testing}/100

Key Insights from Analysis:
${repoContext.insights.map(i => `Q: ${i.question}\nA: ${i.answer}`).join('\n\n')}

README Content:
${repoContext.readme.substring(0, 3000)}${repoContext.readme.length > 3000 ? '\n...(truncated)' : ''}

Your role is to:
1. Answer questions about this repository's code quality, structure, and documentation
2. Provide actionable suggestions for improvement
3. Help developers understand their codebase better
4. Give specific, practical advice based on the analysis data

Be concise, friendly, and technical. Use markdown formatting for better readability when appropriate.`;
};

router.post('/chat', async (req: Request, res: Response) => {
    try {
        const { message, repoContext, history = [] } = req.body as ChatRequest;

        if (!message) {
            res.status(400).json({ error: 'Message is required' });
            return;
        }

        if (!repoContext) {
            res.status(400).json({ error: 'Repository context is required' });
            return;
        }

        const apiKey = process.env.AI_API_KEY;
        const apiUrl = process.env.AI_API_URL || 'https://gateway.haluai.my.id/v1';
        const aiModel = process.env.AI_MODEL || 'gemini-2.0-flash';

        if (!apiKey) {
            res.status(500).json({ error: 'AI API key not configured' });
            return;
        }

        // Build messages array for the API
        const systemPrompt = buildSystemPrompt(repoContext);

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.slice(-10), // Keep last 10 messages for context
            { role: 'user', content: message }
        ];

        // Call Gemini 3 Flash through the gateway
        const response = await fetch(`${apiUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: aiModel,
                messages: messages,
                max_tokens: 1024,
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI API Error:', errorText);
            res.status(response.status).json({ error: 'AI service error', details: errorText });
            return;
        }

        const data = await response.json();

        const aiResponse = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

        res.json({
            response: aiResponse,
            model: aiModel
        });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: error.message || 'Failed to process chat request' });
    }
});

// Endpoint for generating AI-powered insights
router.post('/generate-insights', async (req: Request, res: Response) => {
    try {
        const { repoContext } = req.body;

        if (!repoContext) {
            res.status(400).json({ error: 'Repository context is required' });
            return;
        }

        const apiKey = process.env.AI_API_KEY;
        const apiUrl = process.env.AI_API_URL || 'https://gateway.haluai.my.id/v1';
        const aiModel = process.env.AI_MODEL || 'gemini-2.0-flash';

        if (!apiKey) {
            res.status(500).json({ error: 'AI API key not configured' });
            return;
        }

        const prompt = `Analyze this GitHub repository and provide 4 key insights in JSON format.

Repository: ${repoContext.owner}/${repoContext.name}
Overall Score: ${repoContext.overallScore}/100
Documentation: ${repoContext.breakdown.documentation}/100
Structure: ${repoContext.breakdown.structure}/100
Commit Health: ${repoContext.breakdown.commitHealth}/100
Testing: ${repoContext.breakdown.testing}/100

README (first 2000 chars):
${repoContext.readme?.substring(0, 2000) || 'No README available'}

Respond ONLY with valid JSON array in this format:
[
  {"question": "Is this production-ready?", "answer": "Your analysis here"},
  {"question": "What are the main weaknesses?", "answer": "Your analysis here"},
  {"question": "How can documentation be improved?", "answer": "Your analysis here"},
  {"question": "What should be prioritized next?", "answer": "Your analysis here"}
]`;

        const response = await fetch(`${apiUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: aiModel,
                messages: [
                    { role: 'system', content: 'You are a code analysis expert. Respond only with valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 1024,
                temperature: 0.5
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI API Error:', errorText);
            res.status(response.status).json({ error: 'AI service error' });
            return;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '[]';

        // Try to parse JSON from the response
        let insights;
        try {
            // Extract JSON from possible markdown code blocks
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            insights = JSON.parse(jsonMatch ? jsonMatch[0] : content);
        } catch {
            insights = [
                { question: "Analysis Status", answer: "AI insights generation completed with partial results." }
            ];
        }

        res.json({ insights });

    } catch (error: any) {
        console.error('Insights API Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate insights' });
    }
});

export default router;
