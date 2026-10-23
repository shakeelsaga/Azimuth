import { describe, expect, it, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: mocks.$queryRaw,
  },
}));

import { GET } from './route';

describe('health API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns status ok when database is accessible', async () => {
    mocks.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('ok');
    expect(json.database).toBe('connected');
    expect(json.timestamp).toBeDefined();
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('returns degraded status 503 when database query fails', async () => {
    mocks.$queryRaw.mockRejectedValue(new Error('Connection failed'));

    const res = await GET();
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.status).toBe('degraded');
    expect(json.database).toBe('disconnected');
    expect(json.timestamp).toBeDefined();
  });
});
