import { Router, Request, Response } from 'express';
import { getRepoContent, getRepoFileStructure } from '../services/github';

const router = Router();

router.post('/files/content', async (req: Request, res: Response) => {
    try {
        const { owner, repo, path } = req.body;

        if (!owner || !repo) {
            res.status(400).json({ error: 'Owner and repo are required' });
            return;
        }

        let content;
        try {
            content = await getRepoContent(owner, repo, path || '');
        } catch (err: any) {
            // If it's 404, we might try fuzzy search below. If it's other error, throw.
            if (err.status !== 404) throw err;
            content = null;
        }

        if (!content && path && !path.includes('/')) {
            console.log(`[BE] File '${path}' not found at root, searching recursively...`);
            // Fuzzy search: Try to find the file in the repo structure
            const structure = await getRepoFileStructure(owner, repo);
            const match = structure.find((f: any) => f.path === path || f.path.endsWith(`/${path}`));

            if (match) {
                console.log(`[BE] Found match: ${match.path}`);
                try {
                    content = await getRepoContent(owner, repo, match.path);
                } catch (err: any) {
                    if (err.status !== 404) throw err;
                    content = null;
                }
            }
        }

        if (!content) {
            res.status(404).json({ error: 'Content not found' });
            return;
        }

        // If it's a file, decode the content for easier frontend usage
        // usage: if 'content' in data && data.encoding === 'base64'
        if (!Array.isArray(content) && 'content' in content && content.encoding === 'base64') {
            const decodedContent = Buffer.from(content.content, 'base64').toString('utf-8');
            res.json({ ...content, content: decodedContent, encoding: 'utf-8' });
            return;
        }

        res.json(content);
    } catch (error: any) {
        console.error('Error fetching file content:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch content' });
    }
});

router.post('/files/structure', async (req: Request, res: Response) => {
    try {
        const { owner, repo } = req.body;

        if (!owner || !repo) {
            res.status(400).json({ error: 'Owner and repo are required' });
            return;
        }

        const structure = await getRepoFileStructure(owner, repo);
        res.json(structure);
    } catch (error: any) {
        console.error('Error fetching file structure:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch structure' });
    }
});

export default router;
