import redis from '../config/redis.js';

// ─── Redis Key Patterns ─────────────────────────────────────────────
// url:{shortCode}        → cached original URL (STRING with TTL)
// clicks:{shortCode}    → click counter (atomic INCR)
// rate:{ip}             → rate limit counter per IP (INCR + EXPIRE)
// meta:{shortCode}      → URL metadata (HASH)

const CACHE_TTL = 3600; // 1 hour in seconds
const RATE_LIMIT_WINDOW = 60; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 requests per minute

const redisService = {

    // ─── STRING: Cache a URL mapping ────────────────────────────────
    // SET key value EX seconds
    // This avoids hitting MongoDB on every redirect
    async cacheUrl(shortCode, originalUrl) {
        await redis.set(`url:${shortCode}`, originalUrl, 'EX', CACHE_TTL);
    },

    // ─── STRING: Get cached URL ─────────────────────────────────────
    // GET key → returns null if expired/missing
    async getCachedUrl(shortCode) {
        return await redis.get(`url:${shortCode}`);
    },

    // ─── INCR: Atomic click counter ─────────────────────────────────
    // INCR is atomic — safe even with concurrent requests
    // We batch-sync these counts to MongoDB periodically
    async incrementClicks(shortCode) {
        return await redis.incr(`clicks:${shortCode}`);
    },

    // ─── GET: Read click count from Redis ───────────────────────────
    async getClicks(shortCode) {
        const clicks = await redis.get(`clicks:${shortCode}`);
        return parseInt(clicks) || 0;
    },

    // ─── RATE LIMITING: INCR + EXPIRE pattern ───────────────────────
    // First request: INCR creates key with value 1, then EXPIRE sets TTL
    // Subsequent requests: INCR increments, TTL keeps ticking down
    // After window expires, key is gone → counter resets
    async checkRateLimit(ip) {
        const key = `rate:${ip}`;
        const current = await redis.incr(key);

        // First request in this window — set expiry
        if (current === 1) {
            await redis.expire(key, RATE_LIMIT_WINDOW);
        }

        return {
            allowed: current <= RATE_LIMIT_MAX,
            remaining: Math.max(0, RATE_LIMIT_MAX - current),
            current,
        };
    },

    // ─── HASH: Store URL metadata ───────────────────────────────────
    // HSET stores multiple field-value pairs in one key
    // Good for structured data that doesn't need its own collection
    async setUrlMeta(shortCode, meta) {
        await redis.hset(`meta:${shortCode}`, {
            originalUrl: meta.originalUrl,
            createdAt: meta.createdAt || new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
        });
    },

    // ─── HASH: Get all fields of URL metadata ───────────────────────
    // HGETALL returns all field-value pairs as an object
    async getUrlMeta(shortCode) {
        return await redis.hgetall(`meta:${shortCode}`);
    },

    // ─── HASH: Update single field ──────────────────────────────────
    async updateLastAccessed(shortCode) {
        await redis.hset(`meta:${shortCode}`, 'lastAccessed', new Date().toISOString());
    },

    // ─── DEL: Remove cached data ────────────────────────────────────
    async invalidateCache(shortCode) {
        await redis.del(`url:${shortCode}`, `clicks:${shortCode}`, `meta:${shortCode}`);
    },

    // ─── TTL: Check remaining time on a key ─────────────────────────
    async getTTL(shortCode) {
        return await redis.ttl(`url:${shortCode}`);
    },

    // ─── SYNC: Flush click counts to MongoDB ────────────────────────
    // Gets the current count and resets to 0 atomically with GETSET
    async flushClicks(shortCode) {
        const clicks = await redis.getset(`clicks:${shortCode}`, 0);
        return parseInt(clicks) || 0;
    },
};

export default redisService;
