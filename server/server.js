import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import './config/redis.js'; // Initialize Redis connection
import urlRoutes from './routes/url.js';
import redisAdminRoutes from './routes/redis-admin.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', urlRoutes);
app.use('/api/redis', redisAdminRoutes);

// Redirect route (must be after /api routes)
app.use('/', urlRoutes);

// Connect to MongoDB then start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Redis admin: http://localhost:${PORT}/api/redis/stats`);
    });
});
