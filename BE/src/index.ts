import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analyzeRoutes from './routes/analyze';
import chatRoutes from './routes/chat';
import filesRoutes from './routes/files';
import shareRoutes from './routes/share';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for repo context

// Routes
app.use('/api', analyzeRoutes);
app.use('/api', chatRoutes);
app.use('/api', filesRoutes);
app.use('/api/share', shareRoutes);

app.get('/', (req, res) => {
    res.send('RepoLens API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
