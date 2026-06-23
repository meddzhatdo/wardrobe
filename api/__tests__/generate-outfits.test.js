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

// --- Global fetch mock (images + Anthropic) --------------------------------
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import handler from '../generate-outfits.js';

// ---------------------------------------------------------------------------

function makeReq(overrides = {}) {
  return {
    method: 'POST',
    headers: { authorization: 'Bearer valid-token', ...overrides.headers },
    body: {
      weather: { tempF: 65, conditionLabel: 'Clear', highF: 75, lowF: 55, laterCondition: null },
      items: [{ id: '1', name: 'White Tee', category: 'Tops', image: null }],
      userProfile: {},
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

const THREE_OUTFITS = [
  { outfitName: 'Casual Look',   description: 'Light and breezy.', itemIds: ['1', '2', '3'] },
  { outfitName: 'Smart Casual',  description: 'Polished yet relaxed.', itemIds: ['4', '5', '6'] },
  { outfitName: 'Weekend Vibes', description: 'Easy and comfortable.', itemIds: ['7', '8', '9'] },
];

function mockAnthropicOk(text) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ content: [{ text }] }),
    text: async () => text,
  });
}

beforeEach(() => { vi.clearAllMocks(); });

// ---------------------------------------------------------------------------

describe('generate-outfits handler — auth', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const req = makeReq({ headers: {} });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(401);
    expect(res._body.error).toMatch(/missing auth token/i);
  });

  it('returns 401 when token is invalid', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('bad token') });
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(401);
    expect(res._body.error).toMatch(/invalid token/i);
  });
});

describe('generate-outfits handler — method guard', () => {
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

describe('generate-outfits handler — input validation', () => {
  beforeEach(mockAuthed);

  it('returns 400 when weather is missing', async () => {
    const req = makeReq({ body: { items: [{ id: '1', name: 'Tee', category: 'Tops' }] } });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  it('returns 400 when items array is empty', async () => {
    const req = makeReq({ body: {
      weather: { tempF: 65, conditionLabel: 'Clear', highF: 75, lowF: 55 },
      items: [],
    }});
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  it('returns 400 when items is not provided', async () => {
    const req = makeReq({ body: {
      weather: { tempF: 65, conditionLabel: 'Clear', highF: 75, lowF: 55 },
    }});
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
  });
});

describe('generate-outfits handler — rate limit', () => {
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

describe('generate-outfits handler — happy path', () => {
  beforeEach(mockAuthed);

  it('returns the parsed outfit array', async () => {
    mockAnthropicOk(JSON.stringify(THREE_OUTFITS));
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(Array.isArray(res._body)).toBe(true);
    expect(res._body).toHaveLength(3);
    expect(res._body[0].outfitName).toBe('Casual Look');
  });

  it('strips markdown code fences before parsing', async () => {
    mockAnthropicOk('```json\n' + JSON.stringify(THREE_OUTFITS) + '\n```');
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(Array.isArray(res._body)).toBe(true);
    expect(res._body).toHaveLength(3);
  });
});

describe('generate-outfits handler — error handling', () => {
  beforeEach(mockAuthed);

  it('returns 502 when Anthropic returns a non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false, text: async () => 'overloaded', json: async () => ({}) });
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(502);
  });

  it('returns 502 when AI response is not a JSON array', async () => {
    mockAnthropicOk('{ "error": "unexpected format" }');
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(502);
  });

  it('returns 500 on an unexpected network error', async () => {
    mockFetch.mockRejectedValue(new Error('network failure'));
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(500);
  });
});
