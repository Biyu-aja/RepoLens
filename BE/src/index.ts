import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import analyzeRoutes from './routes/analyze.js';
import chatRoutes from './routes/chat.js';
import filesRoutes from './routes/files.js';
import shareRoutes from './routes/share.js';
import activityRoutes from './routes/activity.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for repo context

// Routes
app.use('/api', analyzeRoutes);
app.use('/api', chatRoutes);
app.use('/api', filesRoutes);
app.use('/api', activityRoutes);
app.use('/api/share', shareRoutes);

app.get('/', (req, res) => {
    res.send('RepoLens API is running');
});

// For local development
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// Export the Express API
export default app;
