import { Router } from 'express';
import { nanoid } from 'nanoid';
import Url from '../models/Url.js';
import redisService from '../services/redisService.js';

const router = Router();

// ─── POST /api/shorten ──────────────────────────────────────────────
// Creates a short URL, caches it in Redis, stores in MongoDB
router.post('/shorten', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        // Rate limiting via Redis INCR + EXPIRE
        const rateLimit = await redisService.checkRateLimit(req.ip);
        if (!rateLimit.allowed) {
            return res.status(429).json({
                error: 'Too many requests',
                retryAfter: '60 seconds',
                remaining: rateLimit.remaining,
            });
        }

        const shortCode = nanoid(7);
        const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

        // Save to MongoDB (persistent storage)
        const urlDoc = await Url.create({ shortCode, originalUrl: url });

        // Cache in Redis (fast lookups) — STRING with TTL
        await redisService.cacheUrl(shortCode, url);

        // Store metadata in Redis HASH
        await redisService.setUrlMeta(shortCode, {
            originalUrl: url,
            createdAt: urlDoc.createdAt.toISOString(),
        });

        res.status(201).json({
            shortCode,
            shortUrl: `${baseUrl}/${shortCode}`,
            originalUrl: url,
            createdAt: urlDoc.createdAt,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/links ─────────────────────────────────────────────────
// Returns all shortened URLs with click counts from Redis
router.get('/links', async (req, res) => {
    try {
        const urls = await Url.find().sort({ createdAt: -1 }).limit(50).lean();
        const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

        // Enrich with Redis click counts (faster than MongoDB for counters)
        const enriched = await Promise.all(
            urls.map(async (url) => {
                const redisClicks = await redisService.getClicks(url.shortCode);
                return {
                    ...url,
                    shortUrl: `${baseUrl}/${url.shortCode}`,
                    clicks: url.clicks + redisClicks, // MongoDB + Redis unsync'd clicks
                };
            })
        );

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/analytics/:shortCode ──────────────────────────────────
// Returns analytics for a specific URL using Redis HASH + counters
router.get('/analytics/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;

        const urlDoc = await Url.findOne({ shortCode }).lean();
        if (!urlDoc) return res.status(404).json({ error: 'URL not found' });

        // Get click count from Redis (real-time)
        const redisClicks = await redisService.getClicks(shortCode);

        // Get metadata from Redis HASH
        const meta = await redisService.getUrlMeta(shortCode);

        // Get TTL of cached URL
        const ttl = await redisService.getTTL(shortCode);

        const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

        res.json({
            shortCode,
            shortUrl: `${baseUrl}/${shortCode}`,
            originalUrl: urlDoc.originalUrl,
            totalClicks: urlDoc.clicks + redisClicks,
            createdAt: urlDoc.createdAt,
            lastAccessed: meta.lastAccessed || null,
            cacheTTL: ttl, // seconds remaining in Redis cache
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /:shortCode (Redirect) ─────────────────────────────────────
// First checks Redis cache, falls back to MongoDB
router.get('/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;

        // Step 1: Check Redis cache (fast path)
        let originalUrl = await redisService.getCachedUrl(shortCode);

        if (originalUrl) {
            console.log(`⚡ Cache HIT for ${shortCode}`);
        } else {
            // Step 2: Cache MISS → query MongoDB
            console.log(`🐌 Cache MISS for ${shortCode} — hitting MongoDB`);
            const urlDoc = await Url.findOne({ shortCode });
            if (!urlDoc) return res.status(404).json({ error: 'Short URL not found' });

            originalUrl = urlDoc.originalUrl;

            // Re-cache in Redis for next time
            await redisService.cacheUrl(shortCode, originalUrl);
        }

        // Step 3: Increment click counter atomically in Redis
        await redisService.incrementClicks(shortCode);

        // Step 4: Update last accessed in Redis HASH
        await redisService.updateLastAccessed(shortCode);

        res.redirect(301, originalUrl);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
