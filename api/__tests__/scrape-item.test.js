import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Supabase mock --------------------------------------------------------
const mockGetUser = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { getUser: mockGetUser } }),
}));

// --- Audit / rate-limit / sentry mocks ------------------------------------
vi.mock('../_audit.js',     () => ({ logAuditEvent: vi.fn() }));
vi.mock('../_sentry.js',    () => ({ initSentry: vi.fn(), Sentry: { captureException: vi.fn() } }));
vi.mock('../_rateLimit.js', () => ({ checkRateLimit: vi.fn().mockResolvedValue({ limited: false }) }));

// --- safeFetch mock — keep the real BLOCKED regex so URL guards are tested -
// vi.mock is hoisted, so the factory must not reference outer const declarations.
// Import the mocked fn back after the import block so we can configure it.
vi.mock('../_safeFetch.js', () => ({
  safeFetch: vi.fn(),
  BLOCKED: /^(localhost|127\.|10\.|192\.168\.|169\.254\.|::1|fc00:|fe80:)/i,
}));

import handler from '../scrape-item.js';
import { safeFetch as mockSafeFetch } from '../_safeFetch.js';

// ---------------------------------------------------------------------------

function makeReq(overrides = {}) {
  return {
    method: 'POST',
    headers: { authorization: 'Bearer valid-token', ...overrides.headers },
    body: { url: 'https://shop.example.com/tee', ...overrides.body },
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  };
}

function makeRes() {
  const res = {
    _status: 200,
    _body: null,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; return this; },
    status(code) { this._status = code; return this; },
    json(body)   { this._body = body; return this; },
    end()        { return this; },
  };
  return res;
}

function mockAuthed() {
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
}

function makePageResponse(html, ok = true, status = 200) {
  return { ok, status, text: async () => html, headers: { get: () => null } };
}

beforeEach(() => { vi.clearAllMocks(); });

// ---------------------------------------------------------------------------

describe('scrape-item handler — auth', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const req = makeReq({ headers: {} });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(401);
  });

  it('returns 401 when token is invalid', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('bad token') });
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(401);
  });
});

describe('scrape-item handler — method guard', () => {
  it('returns 405 for GET requests', async () => {
    const req = makeReq({ method: 'GET' });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(405);
  });

  it('returns 200 for OPTIONS preflight', async () => {
    const req = makeReq({ method: 'OPTIONS' });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(200);
  });
});

describe('scrape-item handler — input validation', () => {
  beforeEach(mockAuthed);

  it('returns 400 when url is missing', async () => {
    const req = makeReq({ body: {} });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/url is required/i);
  });

  it('returns 400 for a non-HTTP protocol (ftp://)', async () => {
    const req = makeReq({ body: { url: 'ftp://shop.example.com/tee' } });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/invalid url/i);
  });

  it('returns 400 for localhost URLs (SSRF guard)', async () => {
    const req = makeReq({ body: { url: 'http://localhost/admin' } });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/invalid url/i);
  });

  it('returns 400 for internal 192.168.x.x URLs (SSRF guard)', async () => {
    const req = makeReq({ body: { url: 'http://192.168.1.1/secrets' } });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/invalid url/i);
  });

  it('returns 400 for 127.x.x.x loopback URLs (SSRF guard)', async () => {
    const req = makeReq({ body: { url: 'http://127.0.0.1:3000/api' } });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
  });
});

describe('scrape-item handler — rate limit', () => {
  beforeEach(mockAuthed);

  it('returns 429 when rate-limited', async () => {
    const { checkRateLimit } = await import('../_rateLimit.js');
    checkRateLimit.mockResolvedValueOnce({ limited: true });
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(429);
  });
});

describe('scrape-item handler — happy path', () => {
  beforeEach(mockAuthed);

  const PRODUCT_HTML = `
    <html>
    <head>
      <title>Classic White Tee | S | ShopBrand</title>
      <meta property="og:title" content="Classic White Tee" />
      <meta property="og:image" content="https://shop.example.com/images/tee.jpg" />
      <meta property="og:description" content="A comfortable 100% cotton tee." />
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Classic White Tee",
        "brand": { "@type": "Brand", "name": "ShopBrand" },
        "offers": { "@type": "Offer", "price": "29.99" }
      }
      </script>
    </head>
    <body></body>
    </html>`;

  it('extracts name, brand, price, and image from a standard product page', async () => {
    mockSafeFetch.mockResolvedValue(makePageResponse(PRODUCT_HTML));
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body.name).toBe('Classic White Tee');
    expect(res._body.brand).toBe('ShopBrand');
    expect(res._body.price).toBe('29.99');
    expect(res._body.images).toContain('https://shop.example.com/images/tee.jpg');
  });

  it('falls back to og:title when JSON-LD name is absent', async () => {
    const html = `<html><head>
      <meta property="og:title" content="Simple Product" />
      <meta property="og:image" content="https://shop.example.com/img.jpg" />
    </head><body></body></html>`;
    mockSafeFetch.mockResolvedValue(makePageResponse(html));
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body.name).toBe('Simple Product');
  });

  it('strips trailing site-name segments from the name', async () => {
    const html = `<html><head>
      <meta property="og:title" content="Silk Blouse | Women | BrandSite" />
    </head><body></body></html>`;
    mockSafeFetch.mockResolvedValue(makePageResponse(html));
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body.name).toBe('Silk Blouse');
  });

  it('returns empty name for a block/error page', async () => {
    const html = `<html><head><title>Access Denied</title></head><body></body></html>`;
    mockSafeFetch.mockResolvedValue(makePageResponse(html, false, 403));
    // page is non-ok but HTML is long enough — still parses but name gets cleared
    mockSafeFetch.mockResolvedValue(makePageResponse(html.repeat(3), true));
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body.name).toBe('');
  });
});

describe('scrape-item handler — error handling', () => {
  beforeEach(mockAuthed);

  it('returns 502 when the page fetch returns a short error body', async () => {
    mockSafeFetch.mockResolvedValue(makePageResponse('Error', false, 403));
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(502);
  });

  it('returns 500 on an unexpected fetch error', async () => {
    mockSafeFetch.mockRejectedValue(new Error('ECONNREFUSED'));
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(500);
  });
});
