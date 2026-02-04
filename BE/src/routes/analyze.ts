import { Router, Request, Response } from 'express';
import { getRepoDetails, getRepoContent } from '../services/github';

const router = Router();

// Mock AI Logic (Heuristics)
// In a real app, this would call OpenAI/Gemini
const calculateScore = (repo: any, readme: string | null, fileStructure: any[]) => {
    let score = 70; // Base score

    // 1. Documentation (README presence and length)
    let docScore = 0;
    if (readme && readme.length > 500) docScore += 80;
    else if (readme) docScore += 40;

    // 2. Structure (Check for standard folders)
    const files = Array.isArray(fileStructure) ? fileStructure.map((f: any) => f.name) : [];
    const hasSrc = files.includes('src') || files.includes('app') || files.includes('lib');
    const hasTests = files.includes('test') || files.includes('tests') || files.includes('__tests__');
    const hasConfig = files.some((f: string) => f.includes('config') || f.endsWith('.json') || f.endsWith('.js') || f.endsWith('.ts'));

    let structScore = 50;
    if (hasSrc) structScore += 20;
    if (hasConfig) structScore += 10;

    // 3. Testing
    let testScore = 20;
    if (hasTests) testScore += 60;
    // Simple heuristic: if 'test' word appears in readme
    if (readme && readme.toLowerCase().includes('npm test')) testScore += 10;

    // 4. Commit Health (using stargazers as proxy for popularity/health in this simple version if stats fail)
    // Real implementation would check commit frequency
    let healthScore = Math.min(100, (repo.stargazers_count / 100) * 10 + 50);

    // AI Q&A Generation
    const insights = [
        {
            question: "Is this repository production-ready?",
            answer: testScore > 50 && docScore > 50
                ? "Likely yes. It has tests and documentation."
                : "Proceed with caution. Tests or documentation might be lacking."
        },
        {
            question: "What are the main weaknesses?",
            answer: !hasTests ? "Lack of visible testing directories." : (readme?.length || 0) < 500 ? "Short documentation." : "No obvious structural weaknesses detected."
        },
        {
            question: "How can the documentation be improved?",
            answer: (readme?.length || 0) < 1000 ? "Expand the README with 'Getting Started', 'API Reference', and 'Contributing' sections." : "Documentation looks robust."
        },
        {
            question: "What should be prioritized next?",
            answer: !hasTests ? "Setting up a test suite." : "Automating CI/CD pipelines."
        }
    ];

    // Verify types
    return {
        overallScore: Math.round((docScore + structScore + testScore + healthScore) / 4),
        breakdown: {
            documentation: Math.min(100, docScore),
            structure: Math.min(100, structScore),
            commitHealth: Math.min(100, Math.round(healthScore)),
            testing: Math.min(100, testScore)
        },
        insights
    };
};

router.post('/analyze-repo', async (req: Request, res: Response) => {
    try {
        const { url } = req.body;
        if (!url) {
            res.status(400).json({ error: 'URL is required' });
            return; // Explicit return to satisfy TS
        }

        // Parse owner/repo
        let owner = '';
        let repo = '';

        try {
            if (url.startsWith('http')) {
                const urlObj = new URL(url);
                const parts = urlObj.pathname.split('/').filter(Boolean);
                owner = parts[0];
                repo = parts[1];
            } else {
                const parts = url.split('/');
                owner = parts[0];
                repo = parts[1];
            }
            // Strip .git suffix if present (common when pasting clone URLs)
            if (repo && repo.endsWith('.git')) {
                repo = repo.slice(0, -4);
            }
        } catch (e) {
            res.status(400).json({ error: 'Invalid URL format' });
            return;
        }

        if (!owner || !repo) {
            res.status(400).json({ error: 'Could not extract owner and repo' });
            return;
        }

        // Fetch data in parallel
        const [repoData, repoContent] = await Promise.all([
            getRepoDetails(owner, repo),
            getRepoContent(owner, repo, '')
        ]);

        // Try to find README
        let readmeContent = '';
        if (Array.isArray(repoContent)) {
            const readmeFile = repoContent.find((f: any) => f.name.toLowerCase().startsWith('readme'));
            if (readmeFile) {
                // If specific README file found, fetch its content
                const fullReadme = await getRepoContent(owner, repo, readmeFile.path);
                if (fullReadme && !Array.isArray(fullReadme) && 'content' in fullReadme) {
                    readmeContent = Buffer.from(fullReadme.content, 'base64').toString('utf-8');
                }
            }
        }

        const analysis = calculateScore(repoData, readmeContent, Array.isArray(repoContent) ? repoContent : []);

        res.json({
            id: `repo_${repoData.id}`,
            url,
            name: repoData.name,
            owner: repoData.owner.login,
            timestamp: new Date().toISOString(),
            readme: readmeContent || '# No README found',
            ...analysis
        });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Failed to analyze repository' });
    }
});

export default router;
