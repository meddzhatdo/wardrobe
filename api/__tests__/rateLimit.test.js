import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSelect = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: mockSelect,
    }),
  }),
}));

import { checkRateLimit } from '../_rateLimit.js';

function chainMock(countResult, oldestData = []) {
  let calls = 0;
  mockSelect.mockImplementation(() => {
    calls++;
    const chain = { eq: vi.fn(), gte: vi.fn(), order: vi.fn(), limit: vi.fn() };
    chain.eq.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    if (calls === 1) {
      chain.gte.mockResolvedValue(countResult);
    } else {
      chain.gte.mockReturnValue(chain);
      chain.limit.mockResolvedValue({ data: oldestData, error: null });
    }
    return chain;
  });
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
    chainMock({ count: 40, error: null }, [{ created_at: '2026-06-23T10:00:00Z' }]);
    const result = await checkRateLimit({
      userId: 'u1', endpoint: '/api/ai-stylist', maxRequests: 40, windowMinutes: 60,
    });
    expect(result).toEqual(expect.objectContaining({ limited: true }));
  });

  it('returns limited: true when count exceeds maxRequests', async () => {
    chainMock({ count: 99, error: null }, [{ created_at: '2026-06-23T10:00:00Z' }]);
    const result = await checkRateLimit({
      userId: 'u1', endpoint: '/api/ai-stylist', maxRequests: 40, windowMinutes: 60,
    });
    expect(result).toEqual(expect.objectContaining({ limited: true }));
  });

  it('includes resetsAt when limited', async () => {
    chainMock({ count: 40, error: null }, [{ created_at: '2026-06-23T10:00:00Z' }]);
    const result = await checkRateLimit({
      userId: 'u1', endpoint: '/api/ai-stylist', maxRequests: 40, windowMinutes: 60,
    });
    expect(result.resetsAt).toBe(new Date(new Date('2026-06-23T10:00:00Z').getTime() + 60 * 60 * 1000).toISOString());
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
