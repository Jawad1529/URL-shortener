# Redis Concepts Covered in This Project

## 1. STRING — Basic Key-Value

The simplest Redis data type. Stores a single value mapped to a key.

```bash
SET url:abc123 "https://google.com" EX 3600   # Store with 1hr expiry
GET url:abc123                                  # Retrieve value
```

**Used for:** Caching URL lookups so we skip MongoDB on every redirect.

---

## 2. INCR — Atomic Counter

Increments a number stored at key by 1. If key doesn't exist, it's set to 0 first.
Thread-safe — no race conditions even with concurrent requests.

```bash
INCR clicks:abc123    # Returns 1 (first click)
INCR clicks:abc123    # Returns 2
INCR clicks:abc123    # Returns 3
GET clicks:abc123     # "3"
```

**Used for:** Real-time click counting without hitting MongoDB on every redirect.

---

## 3. EXPIRE / TTL — Time-To-Live

Sets a timeout on a key. After the TTL, key is automatically deleted.

```bash
SET url:abc123 "https://google.com"
EXPIRE url:abc123 3600     # Dies in 1 hour
TTL url:abc123             # Returns remaining seconds (e.g., 3598)
```

**Used for:** Cache expiry and rate limit windows.

---

## 4. Rate Limiting Pattern (INCR + EXPIRE)

Combines INCR and EXPIRE to create a sliding window rate limiter.

```bash
INCR rate:192.168.1.1      # First request → 1
EXPIRE rate:192.168.1.1 60 # Window = 60 seconds
INCR rate:192.168.1.1      # Second request → 2
# ... after 60 seconds, key expires, counter resets
```

**Used for:** Limiting URL creation to 10 requests/minute per IP.

---

## 5. HASH — Structured Data

Stores multiple field-value pairs under one key. Like a mini-object/document.

```bash
HSET meta:abc123 originalUrl "https://google.com" createdAt "2024-01-01" lastAccessed "2024-01-02"
HGETALL meta:abc123        # Returns all fields as object
HGET meta:abc123 lastAccessed   # Get single field
HSET meta:abc123 lastAccessed "2024-01-03"  # Update single field
```

**Used for:** Storing URL metadata (original URL, timestamps) without a full DB query.

---

## 6. GETSET — Atomic Get and Replace

Gets current value and sets a new one in a single atomic operation.

```bash
SET clicks:abc123 "42"
GETSET clicks:abc123 "0"   # Returns "42", key is now "0"
```

**Used for:** Flushing click counters to MongoDB — reads the count and resets to 0 atomically so no clicks are lost.

---

## 7. SCAN — Production-Safe Key Iteration

Unlike `KEYS *` (blocks Redis), SCAN iterates incrementally with a cursor.

```bash
SCAN 0 MATCH url:* COUNT 100   # Returns cursor + batch of keys
SCAN <cursor> MATCH url:* COUNT 100  # Continue from cursor
# Cursor = 0 means done
```

**Used for:** Listing all keys in the Redis admin panel without blocking the server.

---

## 8. DEL — Delete Keys

Removes one or more keys and their values.

```bash
DEL url:abc123 clicks:abc123 meta:abc123   # Delete multiple keys
```

**Used for:** Cache invalidation when a URL is deleted.

---

## 9. TYPE — Inspect Key Type

Returns the data type stored at a key.

```bash
TYPE url:abc123     # "string"
TYPE meta:abc123    # "hash"
TYPE clicks:abc123  # "string" (numbers are stored as strings)
```

**Used for:** The Redis admin inspector — auto-detects how to read a key.

---

## 10. DBSIZE / INFO — Server Introspection

```bash
DBSIZE              # Total number of keys in current DB
INFO memory         # Memory usage stats
INFO server         # Server uptime, version, etc.
```

**Used for:** Redis stats endpoint in admin panel.

---

## Data Flow in This Project

```
User clicks short URL
        │
        ▼
┌─────────────────────┐
│  Check Redis Cache   │  ← GET url:{code}
│  (Cache HIT? fast!) │
└────────┬────────────┘
         │ MISS
         ▼
┌─────────────────────┐
│  Query MongoDB       │  ← findOne({ shortCode })
│  + Re-cache in Redis │  ← SET url:{code} EX 3600
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  INCR click counter  │  ← INCR clicks:{code}
│  Update HASH meta    │  ← HSET meta:{code} lastAccessed ...
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  301 Redirect        │
└─────────────────────┘

Periodically:
  POST /api/redis/flush-clicks → GETSET + MongoDB $inc
```

---

## Key Naming Conventions

| Pattern | Type | Purpose |
|---------|------|---------|
| `url:{shortCode}` | STRING | Cached original URL |
| `clicks:{shortCode}` | STRING (number) | Click counter |
| `rate:{ip}` | STRING (number) | Rate limit counter |
| `meta:{shortCode}` | HASH | URL metadata |
