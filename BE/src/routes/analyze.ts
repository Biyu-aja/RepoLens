import { Router, Request, Response } from 'express';
import { getRepoDetails, getRepoContent, getRepoFileStructure, getContributors, getLanguages } from '../services/github';
import { evaluateRepository } from '../services/ai';

const router = Router();

router.post('/analyze-repo', async (req: Request, res: Response) => {
    try {
        const { url } = req.body;
        if (!url) {
            res.status(400).json({ error: 'URL is required' });
            return;
        }

        // Parse owner/repo from URL
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
            // Strip .git suffix if present
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

        console.log(`[Analyze] Starting analysis for ${owner}/${repo}...`);

        // Fetch data in parallel
        const [repoData, repoContent, fileStructure, contributors, languages] = await Promise.all([
            getRepoDetails(owner, repo),
            getRepoContent(owner, repo, ''),
            getRepoFileStructure(owner, repo),
            getContributors(owner, repo),
            getLanguages(owner, repo)
        ]);

        // Try to find and read README
        let readmeContent = '';
        if (Array.isArray(repoContent)) {
            const readmeFile = repoContent.find((f: any) => f.name.toLowerCase().startsWith('readme'));
            if (readmeFile) {
                const fullReadme = await getRepoContent(owner, repo, readmeFile.path);
                if (fullReadme && !Array.isArray(fullReadme) && 'content' in fullReadme) {
                    readmeContent = Buffer.from(fullReadme.content, 'base64').toString('utf-8');
                }
            }
        }

        console.log(`[Analyze] Data fetched. README: ${readmeContent.length} chars, Files: ${fileStructure.length}`);

        // Use AI to evaluate the repository
        console.log('[Analyze] Calling AI for evaluation...');
        const aiEvaluation = await evaluateRepository({
            owner,
            name: repo,
            description: repoData.description || undefined,
            readme: readmeContent || '# No README found',
            fileStructure: fileStructure.map((f: any) => f.path),
            stars: repoData.stargazers_count,
            forks: repoData.forks_count,
            openIssues: repoData.open_issues_count
        });

        console.log(`[Analyze] AI evaluation complete. Score: ${aiEvaluation.overallScore}`);

        // Build response
        res.json({
            id: `repo_${repoData.id}`,
            url,
            name: repoData.name,
            owner: repoData.owner.login,
            description: repoData.description,
            timestamp: new Date().toISOString(),
            readme: readmeContent || '# No README found',
            // GitHub stats
            stats: {
                stars: repoData.stargazers_count,
                forks: repoData.forks_count,
                watchers: repoData.watchers_count,
                openIssues: repoData.open_issues_count,
                language: repoData.language,
                license: repoData.license?.name || null,
                createdAt: repoData.created_at,
                updatedAt: repoData.updated_at,
                pushedAt: repoData.pushed_at
            },
            // Contributors data
            contributors,
            // Language distribution
            languages,
            // AI evaluation results
            overallScore: aiEvaluation.overallScore,
            breakdown: aiEvaluation.breakdown,
            summary: aiEvaluation.summary,
            techStack: aiEvaluation.techStack,
            strengths: aiEvaluation.strengths,
            improvements: aiEvaluation.improvements,
            insights: aiEvaluation.insights
        });

    } catch (error: any) {
        console.error('[Analyze] Error:', error);
        res.status(500).json({ error: error.message || 'Failed to analyze repository' });
    }
});

export default router;
