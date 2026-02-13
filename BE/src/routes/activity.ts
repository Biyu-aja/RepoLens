
import { Router, Request, Response } from 'express';
import { getPunchCard, getRecentCommits, getTopHustlers, getContributorStats } from '../services/github.js';

const router = Router();

router.post('/activity/pulse', async (req: Request, res: Response) => {
    try {
        const { owner, repo, since, until } = req.body;

        if (!owner || !repo) {
            res.status(400).json({ error: 'Owner and repo are required' });
            return;
        }

        // Parallel fetch for speed
        // getCommitActivity often returns 202 and empty data initially. 
        // We use getRecentCommits as a fallback or primary source for the timeline.
        const [punchCard, recentCommits, topHustlers, contributorStats] = await Promise.all([
            getPunchCard(owner, repo),
            getRecentCommits(owner, repo, since, until),
            getTopHustlers(owner, repo),
            getContributorStats(owner, repo)
        ]);

        res.json({
            punchCard: punchCard || [],
            timeline: recentCommits || [],
            topHustlers: topHustlers || [],
            contributionBalance: contributorStats || { contributors: [], equityScore: 0 }
        });
    } catch (error: any) {
        console.error('Error fetching activity pulse:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch activity pulse' });
    }
});

export default router;
