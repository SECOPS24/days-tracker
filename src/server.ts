import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { initDb } from './db';
import cycleRoutes from './routes/cycles';
import symptomRoutes from './routes/symptoms';

const app = express();
const PORT = process.env.PORT || 3000;

// Security & middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/cycles', cycleRoutes);
app.use('/api/symptoms', symptomRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'Days Tracker' }));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Init DB then start server
initDb();
app.listen(PORT, () => {
  console.log(`Days Tracker running on port ${PORT}`);
});

export default app;
