import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Supabase mock --------------------------------------------------------
const mockGetUser = vi.fn();
const mockFrom    = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

// --- Audit / rate-limit / sentry mocks ------------------------------------
vi.mock('../_audit.js',     () => ({ logAuditEvent: vi.fn() }));
vi.mock('../_sentry.js',    () => ({ initSentry: vi.fn(), Sentry: { captureException: vi.fn() } }));
vi.mock('../_rateLimit.js', () => ({ checkRateLimit: vi.fn().mockResolvedValue({ limited: false }) }));

// --- Anthropic fetch mock --------------------------------------------------
const mockAnthropicFetch = vi.fn();
vi.stubGlobal('fetch', mockAnthropicFetch);

import handler from '../ai-stylist.js';

// ---------------------------------------------------------------------------

function makeReq(overrides = {}) {
  return {
    method: 'POST',
    headers: { authorization: 'Bearer valid-token', ...overrides.headers },
    body: {
      messages: [{ role: 'user', content: 'What should I wear?' }],
      includeWardrobe: false,
      includeCollage: false,
      items: [],
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

function mockAnthropicOk(text = 'Here is some advice.\nREFS:[]') {
  mockAnthropicFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ content: [{ text }] }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------

describe('ai-stylist handler — auth', () => {
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

describe('ai-stylist handler — method guard', () => {
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

describe('ai-stylist handler — input validation', () => {
  beforeEach(mockAuthed);

  it('returns 400 when messages is empty', async () => {
    const req = makeReq({ body: { messages: [] } });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  it('returns 400 when messages exceeds 100', async () => {
    const req = makeReq({ body: { messages: Array(101).fill({ role: 'user', content: 'hi' }) } });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  it('returns 400 when items exceeds 300', async () => {
    const req = makeReq({ body: {
      messages: [{ role: 'user', content: 'hi' }],
      items: Array(301).fill({ id: '1', name: 'Shirt' }),
    }});
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  it('returns 400 for a message with missing content field', async () => {
    const req = makeReq({ body: { messages: [{ role: 'user' }] } });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
  });
});

describe('ai-stylist handler — rate limit', () => {
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

describe('ai-stylist handler — happy path', () => {
  beforeEach(mockAuthed);

  it('returns the AI reply on a plain text response', async () => {
    mockAnthropicOk('Here is some style advice.');
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body.reply).toBe('Here is some style advice.');
  });

  it('strips the REFS line and returns referenced item ids', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    mockAnthropicOk('Wear the **White Tee** with the **Black Jeans**.\nREFS:["1","2"]');

    // Mock the image fetch for wardrobe items
    mockAnthropicFetch.mockImplementation((url) => {
      if (url === 'https://api.anthropic.com/v1/messages') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ content: [{ text: 'Wear the **White Tee**.\nREFS:["1"]' }] }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    const req = makeReq({ body: {
      messages: [{ role: 'user', content: 'What do I wear?' }],
      includeWardrobe: true,
      includeCollage: false,
      items: [{ id: '1', name: 'White Tee', category: 'Tops', image: null }],
      userProfile: { country: 'United States', outfitGoals: [], stylePreferences: ['neutral'] },
    }});
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body.reply).not.toMatch(/REFS:/);
    expect(res._body.referencedItemIds).toEqual(['1']);
  });
});
