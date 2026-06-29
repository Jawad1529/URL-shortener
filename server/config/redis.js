import Redis from 'ioredis';

// ─── Redis Connection ───────────────────────────────────────────────
// Redis is an in-memory data store used here for:
// 1. Caching URL lookups (avoid DB hits on every redirect)
// 2. Atomic click counters (INCR is O(1) and thread-safe)
// 3. Rate limiting (sliding window with INCR + EXPIRE)
// 4. Hash storage for URL metadata

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        // Reconnect after increasing delay (max 2 seconds)
        return Math.min(times * 200, 2000);
    },
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err.message));

export default redis;
