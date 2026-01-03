# DIVIDENDS API Gateway Worker

Cloudflare Worker that acts as an edge API gateway for the DIVIDENDS application.

## Features

- **Reverse Proxy**: Routes `/api/*` requests to Render backend
- **Rate Limiting**: IP-based + endpoint-specific limits using KV storage
- **Edge Caching**: Caches snapshot endpoints with stale-while-revalidate
- **SSE Pass-Through**: Streams chat events without buffering
- **Zero Trust Enforcement**: Checks Cloudflare Access JWT for staff routes
- **Security Headers**: CORS, CSP, HSTS, and more

## Architecture

```
User Request
    ↓
Cloudflare Edge (Worker)
    ├─ Rate Limit Check (KV)
    ├─ Zero Trust Gate (Access JWT)
    ├─ Cache Check (KV)
    └─ Proxy to Origin
           ↓
    Render Backend
           ↓
    MongoDB + Solana RPC
```

## Protected Routes (Zero Trust)

These routes require Cloudflare Access authentication:

- `POST /api/community/chat/mod/action`
- `POST /api/community/mod/*`
- `POST /api/community/raids/create`
- `POST /api/community/raids/cancel`
- `POST /api/admin/*`

## Cached Routes (Edge)

These routes are cached for 60-120 seconds:

- `GET /api/bags/token/top-holders` (60s TTL, 10m SWR)
- `GET /api/market/prices` (120s TTL, 10m SWR)
- `GET /api/market/trending` (120s TTL, 10m SWR)

## Rate Limits

| Endpoint | Limit (per minute) |
|----------|-------------------|
| `/api/auth/challenge` | 10 |
| `/api/auth/verify` | 10 |
| `/api/auth/logout` | 5 |
| `/api/community/chat/send` | 20 |
| `/api/buy-stream` | 60 |
| Default (all others) | 100 |

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create KV Namespaces

```bash
# Production
wrangler kv:namespace create "RATE_LIMIT_KV"
wrangler kv:namespace create "CACHE_KV"

# Preview (for testing)
wrangler kv:namespace create "RATE_LIMIT_KV" --preview
wrangler kv:namespace create "CACHE_KV" --preview
```

### 3. Update `wrangler.toml`

Replace the placeholder KV IDs with the actual IDs from step 2.

### 4. Deploy

```bash
wrangler deploy
```

## Development

### Local Testing

```bash
wrangler dev
```

This starts a local server at `http://localhost:8787`.

### View Logs

```bash
wrangler tail
```

Shows real-time logs from the deployed Worker.

### Test Rate Limiting

```bash
# Spam endpoint to trigger rate limit
for i in {1..15}; do curl -I http://localhost:8787/api/auth/challenge?wallet=test; done
```

## Configuration

### Environment Variables

Set in `wrangler.toml`:

- `ORIGIN_URL`: Backend URL (default: `https://dividends-backend-28o8.onrender.com`)

### KV Namespaces

- `RATE_LIMIT_KV`: Stores rate limit counters
- `CACHE_KV`: Stores cached API responses

### Allowed Origins

Edit `ALLOWED_ORIGINS` in `src/worker.js`:

```javascript
const ALLOWED_ORIGINS = [
  'https://dividendspro.com',
  'https://www.dividendspro.com'
];
```

## Monitoring

### Cloudflare Dashboard

1. **Workers & Pages** → `dividends-api-gateway`
2. View metrics:
   - Requests per second
   - Error rate
   - CPU time
   - KV operations

### Analytics

1. **Analytics & Logs** → **Workers**
2. Filter by Worker name
3. View:
   - Request volume
   - Status code distribution
   - Top endpoints

## Troubleshooting

### Issue: 429 Too Many Requests

**Cause**: Rate limit exceeded

**Fix**: Increase limits in `RATE_LIMITS` object or wait 60 seconds

### Issue: CORS Errors

**Cause**: Origin not in `ALLOWED_ORIGINS`

**Fix**: Add origin to the list and redeploy

### Issue: Cache Not Working

**Cause**: KV namespace not bound or incorrect ID

**Fix**: Verify KV IDs in `wrangler.toml` and redeploy

### Issue: Zero Trust Blocking Everyone

**Cause**: Access policies misconfigured

**Fix**: Check Cloudflare Access dashboard, ensure staff emails are in Allow policy

## Security

### What's Protected

- ✅ Rate limiting prevents abuse
- ✅ CORS restricts origins
- ✅ Zero Trust protects staff routes
- ✅ Security headers prevent XSS/clickjacking

### What's NOT in Worker

- ❌ No private keys
- ❌ No database credentials
- ❌ No session secrets
- ❌ No PII storage

**All sensitive data stays in the origin backend.**

## Performance

### Benchmarks

- **Cache hit**: < 50ms
- **Cache miss (proxy)**: 100-300ms (depends on origin)
- **Rate limit check**: < 5ms

### Optimization Tips

1. **Increase cache TTL** for less-critical endpoints
2. **Use stale-while-revalidate** to serve cached data while refreshing
3. **Minimize KV operations** (batch reads if possible)

## Deployment

### Production

```bash
wrangler deploy
```

### Staging (if configured)

```bash
wrangler deploy --env staging
```

## Routes

Worker is bound to these routes:

- `dividendspro.com/api/*`
- `www.dividendspro.com/api/*`

Configure in Cloudflare Dashboard → Workers & Pages → Triggers.

## Support

For issues:

1. Check logs: `wrangler tail`
2. Review [cloudflare-deployment-guide.md](file:///C:/Users/bradf/.gemini/antigravity/brain/49e85c08-9065-4d52-99f3-95c3079e65e6/cloudflare-deployment-guide.md)
3. Consult [rollback-procedure.md](file:///C:/Users/bradf/.gemini/antigravity/brain/49e85c08-9065-4d52-99f3-95c3079e65e6/rollback-procedure.md) if needed

## License

Part of the DIVIDENDS project.
