import { Router } from 'express';
import redis from '../config/redis.js';
import redisService from '../services/redisService.js';
import Url from '../models/Url.js';

const router = Router();

// ─── Redis Management Routes ────────────────────────────────────────
// These endpoints let you explore and manage Redis directly
// Great for learning how data is stored and manipulated

// ─── GET /api/redis/info ────────────────────────────────────────────
// Returns Redis server info (memory, clients, etc.)
router.get('/info', async (req, res) => {
    try {
        const info = await redis.info();
        // Parse the info string into sections
        const sections = {};
        let currentSection = 'general';
        info.split('\r\n').forEach((line) => {
            if (line.startsWith('#')) {
                currentSection = line.replace('# ', '').toLowerCase();
                sections[currentSection] = {};
            } else if (line.includes(':')) {
                const [key, value] = line.split(':');
                if (!sections[currentSection]) sections[currentSection] = {};
                sections[currentSection][key] = value;
            }
        });
        res.json(sections);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/redis/keys ────────────────────────────────────────────
// Lists all keys matching a pattern (default: *)
// ⚠️ SCAN is preferred over KEYS in production (non-blocking)
router.get('/keys', async (req, res) => {
    try {
        const pattern = req.query.pattern || '*';
        const keys = [];

        // Using SCAN iterator (non-blocking, production-safe)
        const stream = redis.scanStream({ match: pattern, count: 100 });

        stream.on('data', (batch) => keys.push(...batch));
        stream.on('end', () => {
            res.json({
                pattern,
                count: keys.length,
                keys: keys.sort(),
            });
        });
        stream.on('error', (err) => res.status(500).json({ error: err.message }));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/redis/key/:key ────────────────────────────────────────
// Inspect any key — shows type, value, and TTL
router.get('/key/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const type = await redis.type(key);

        if (type === 'none') {
            return res.status(404).json({ error: 'Key not found' });
        }

        let value;
        switch (type) {
            case 'string':
                value = await redis.get(key);
                break;
            case 'hash':
                value = await redis.hgetall(key);
                break;
            case 'list':
                value = await redis.lrange(key, 0, -1);
                break;
            case 'set':
                value = await redis.smembers(key);
                break;
            case 'zset':
                value = await redis.zrange(key, 0, -1, 'WITHSCORES');
                break;
            default:
                value = 'Unsupported type';
        }

        const ttl = await redis.ttl(key);

        res.json({ key, type, value, ttl: ttl === -1 ? 'no expiry' : `${ttl}s` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── DELETE /api/redis/key/:key ─────────────────────────────────────
// Delete a specific key
router.delete('/key/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const deleted = await redis.del(key);
        res.json({ deleted: deleted === 1, key });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/redis/flush-clicks ───────────────────────────────────
// Syncs all Redis click counters to MongoDB
// Demonstrates GETSET (atomic get-and-reset)
router.post('/flush-clicks', async (req, res) => {
    try {
        const urls = await Url.find().lean();
        const results = [];

        for (const url of urls) {
            const clicks = await redisService.flushClicks(url.shortCode);
            if (clicks > 0) {
                await Url.updateOne(
                    { shortCode: url.shortCode },
                    { $inc: { clicks } }
                );
                results.push({ shortCode: url.shortCode, flushed: clicks });
            }
        }

        res.json({ message: 'Clicks synced to MongoDB', results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/redis/stats ───────────────────────────────────────────
// Quick Redis memory and key stats
router.get('/stats', async (req, res) => {
    try {
        const dbSize = await redis.dbsize();
        const memoryInfo = await redis.info('memory');
        const usedMemory = memoryInfo.match(/used_memory_human:(.+)/)?.[1]?.trim();

        res.json({
            totalKeys: dbSize,
            usedMemory,
            uptime: (await redis.info('server')).match(/uptime_in_seconds:(\d+)/)?.[1] + 's',
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
