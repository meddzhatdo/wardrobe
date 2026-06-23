import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
const mockSelect = vi.fn();
const mockEq     = vi.fn();
const mockGte    = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: mockSelect,
    }),
  }),
}));

import { checkRateLimit } from '../_rateLimit.js';

function chainMock(result) {
  const chain = { eq: vi.fn(), gte: vi.fn() };
  chain.eq.mockReturnValue(chain);
  chain.gte.mockResolvedValue(result);
  mockSelect.mockReturnValue(chain);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.VITE_SUPABASE_URL         = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
});

describe('checkRateLimit', () => {
  it('returns limited: false when count is below the max', async () => {
    chainMock({ count: 5, error: null });
    const result = await checkRateLimit({
      userId: 'u1', endpoint: '/api/ai-stylist', maxRequests: 40, windowMinutes: 60,
    });
    expect(result).toEqual({ limited: false });
  });

  it('returns limited: true when count equals maxRequests', async () => {
    chainMock({ count: 40, error: null });
    const result = await checkRateLimit({
      userId: 'u1', endpoint: '/api/ai-stylist', maxRequests: 40, windowMinutes: 60,
    });
    expect(result).toEqual({ limited: true });
  });

  it('returns limited: true when count exceeds maxRequests', async () => {
    chainMock({ count: 99, error: null });
    const result = await checkRateLimit({
      userId: 'u1', endpoint: '/api/ai-stylist', maxRequests: 40, windowMinutes: 60,
    });
    expect(result).toEqual({ limited: true });
  });

  it('fails open (limited: false) when Supabase returns an error', async () => {
    chainMock({ count: null, error: new Error('db error') });
    const result = await checkRateLimit({
      userId: 'u1', endpoint: '/api/ai-stylist', maxRequests: 40, windowMinutes: 60,
    });
    expect(result).toEqual({ limited: false });
  });

  it('fails open when Supabase throws', async () => {
    mockSelect.mockImplementation(() => { throw new Error('network'); });
    const result = await checkRateLimit({
      userId: 'u1', endpoint: '/api/ai-stylist', maxRequests: 40, windowMinutes: 60,
    });
    expect(result).toEqual({ limited: false });
  });
});
