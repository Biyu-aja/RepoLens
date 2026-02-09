import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Encode repository URL to a shareable token
 * POST /api/share/encode
 */
router.post('/encode', (req: Request, res: Response) => {
    try {
        const { repoUrl, owner, name, notes } = req.body;

        if (!repoUrl || !owner || !name) {
            res.status(400).json({ error: 'repoUrl, owner, and name are required' });
            return;
        }

        // Create a simple payload with essential info
        const payload: any = {
            u: repoUrl,    // url
            o: owner,      // owner
            n: name,       // name
            t: Date.now()  // timestamp
        };

        // Add notes if provided (condensed format)
        if (notes && Array.isArray(notes)) {
            payload.nts = notes.map((n: any) => ({
                id: n.id,
                t: n.title,
                c: n.content,
                d: n.updatedAt
            }));
        }

        // Encode to base64 URL-safe string
        const token = Buffer.from(JSON.stringify(payload))
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        res.json({
            token,
            shareUrl: `/share/${token}`
        });

    } catch (error: any) {
        console.error('[Share] Encode error:', error);
        res.status(500).json({ error: 'Failed to generate share link' });
    }
});

/**
 * Decode a share token to get repository info
 * GET /api/share/decode/:token
 */
router.get('/decode/:token', (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        if (!token) {
            res.status(400).json({ error: 'Token is required' });
            return;
        }

        // Restore base64 padding if needed
        let base64 = String(token).replace(/-/g, '+').replace(/_/g, '/');
        const padding = base64.length % 4;
        if (padding) {
            base64 += '='.repeat(4 - padding);
        }

        // Decode the token
        const decoded = Buffer.from(base64, 'base64').toString('utf-8');
        const payload = JSON.parse(decoded);

        // Expand notes
        const notes = payload.nts ? payload.nts.map((n: any) => ({
            id: n.id,
            title: n.t,
            content: n.c,
            updatedAt: n.d
        })) : [];

        res.json({
            repoUrl: payload.u,
            owner: payload.o,
            name: payload.n,
            createdAt: new Date(payload.t).toISOString(),
            notes: notes
        });

    } catch (error: any) {
        console.error('[Share] Decode error:', error);
        res.status(400).json({ error: 'Invalid share token' });
    }
});

export default router;
