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

// --- Global fetch mock (Anthropic) ----------------------------------------
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import handler from '../enrich-item.js';

// ---------------------------------------------------------------------------

function makeReq(overrides = {}) {
  return {
    method: 'POST',
    headers: { authorization: 'Bearer valid-token', ...overrides.headers },
    body: {
      imageUrl: 'https://example.com/shirt.jpg',
      name: 'White Tee',
      brand: 'Uniqlo',
      category: 'Tops',
      material: 'Cotton',
      color: 'White',
      ...overrides.body,
    },
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

function mockAnthropicOk(text = '{"attributes":{"warmthRating":"light"}}') {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ content: [{ text }] }),
    text: async () => text,
  });
}

beforeEach(() => { vi.clearAllMocks(); });

// ---------------------------------------------------------------------------

describe('enrich-item handler — auth', () => {
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

describe('enrich-item handler — method guard', () => {
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

describe('enrich-item handler — input validation', () => {
  beforeEach(mockAuthed);

  it('returns 400 when both imageUrl and imageBase64 are absent', async () => {
    const req = makeReq({ body: { name: 'Shirt' } });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/imageUrl or imageBase64/i);
  });
});

describe('enrich-item handler — rate limit', () => {
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

describe('enrich-item handler — happy path', () => {
  beforeEach(mockAuthed);

  it('returns attributes for a URL-based image', async () => {
    mockAnthropicOk('{"attributes":{"warmthRating":"light"}}');
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body.attributes.warmthRating).toBe('light');
  });

  it('accepts imageBase64 in place of imageUrl', async () => {
    mockAnthropicOk('{"attributes":{"warmthRating":"heavy"}}');
    const req = makeReq({ body: {
      imageBase64: 'abc123==',
      mediaType: 'image/png',
      name: 'Puffer Jacket',
      category: 'Outerwear',
    }});
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body.attributes.warmthRating).toBe('heavy');
  });

  it('parses JSON even when the model wraps it in extra text', async () => {
    mockAnthropicOk('Sure! Here is the result:\n{"attributes":{"warmthRating":"warm"}}\nLet me know if you need anything else.');
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body.attributes.warmthRating).toBe('warm');
  });
});

describe('enrich-item handler — error handling', () => {
  beforeEach(mockAuthed);

  it('returns 502 when Anthropic returns a non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false, text: async () => 'rate limited', json: async () => ({}) });
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(502);
  });

  it('returns 502 when AI response contains no parseable JSON', async () => {
    mockAnthropicOk('Sorry, I cannot analyze this image.');
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(502);
  });

  it('returns 500 on an unexpected network error', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(500);
  });
});
