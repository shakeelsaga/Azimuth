import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  trip: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock('@/lib/auth-route', () => ({
  requireUser: mocks.requireUser,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    trip: mocks.trip,
  },
}));

import { GET as getTrips, POST as postTrips } from './route';
import { GET as getTripById, PATCH as patchTripById, DELETE as deleteTripById } from './[id]/route';

describe('trips API routes', () => {
  const dummyUser = { id: 'user-123', email: 'traveler@example.com' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/trips', () => {
    it('returns 401 when unauthorized', async () => {
      mocks.requireUser.mockResolvedValue(
        new Response(JSON.stringify({ error: 'unauthorized', message: 'Please sign in to continue.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const res = await getTrips();
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('unauthorized');
    });

    it('returns trips list for authorized user', async () => {
      mocks.requireUser.mockResolvedValue(dummyUser);
      mocks.trip.findMany.mockResolvedValue([
        {
          id: 'trip-1',
          title: 'Kyoto Cultural Trip',
          destination: 'Kyoto',
          lastActivity: 'Gion evening stroll',
          createdAt: new Date('2026-10-23T10:00:00Z'),
          updatedAt: new Date('2026-10-23T12:00:00Z'),
        },
      ]);

      const res = await getTrips();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json).toHaveLength(1);
      expect(json[0].id).toBe('trip-1');
      expect(mocks.trip.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, destination: true, lastActivity: true, createdAt: true, updatedAt: true },
      });
    });
  });

  describe('POST /api/trips', () => {
    it('validates required fields and creates trip', async () => {
      mocks.requireUser.mockResolvedValue(dummyUser);
      mocks.trip.create.mockResolvedValue({
        id: 'new-trip',
        title: 'Tokyo 3 Days',
        destination: 'Tokyo',
        lastActivity: 'Arrival',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = new Request('http://localhost/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Tokyo 3 Days',
          destination: 'Tokyo',
          itinerary: { days: [] },
          lastActivity: 'Arrival',
        }),
      });

      const res = await postTrips(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBe('new-trip');
    });

    it('rejects invalid payload', async () => {
      mocks.requireUser.mockResolvedValue(dummyUser);

      const req = new Request('http://localhost/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '',
        }),
      });

      const res = await postTrips(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('validation_failed');
    });
  });

  describe('GET /api/trips/[id]', () => {
    it('returns trip when found for user', async () => {
      mocks.requireUser.mockResolvedValue(dummyUser);
      mocks.trip.findFirst.mockResolvedValue({
        id: 'trip-1',
        title: 'Kyoto',
        userId: 'user-123',
      });

      const res = await getTripById(new Request('http://localhost/api/trips/trip-1'), {
        params: Promise.resolve({ id: 'trip-1' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe('trip-1');
    });

    it('returns 404 when trip not found', async () => {
      mocks.requireUser.mockResolvedValue(dummyUser);
      mocks.trip.findFirst.mockResolvedValue(null);

      const res = await getTripById(new Request('http://localhost/api/trips/missing'), {
        params: Promise.resolve({ id: 'missing' }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe('not_found');
    });
  });

  describe('PATCH /api/trips/[id]', () => {
    it('updates trip when authorized', async () => {
      mocks.requireUser.mockResolvedValue(dummyUser);
      mocks.trip.updateMany.mockResolvedValue({ count: 1 });

      const req = new Request('http://localhost/api/trips/trip-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' }),
      });

      const res = await patchTripById(req, {
        params: Promise.resolve({ id: 'trip-1' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.updated).toBe(true);
    });
  });

  describe('DELETE /api/trips/[id]', () => {
    it('deletes trip for user', async () => {
      mocks.requireUser.mockResolvedValue(dummyUser);
      mocks.trip.deleteMany.mockResolvedValue({ count: 1 });

      const res = await deleteTripById(new Request('http://localhost/api/trips/trip-1', { method: 'DELETE' }), {
        params: Promise.resolve({ id: 'trip-1' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.deleted).toBe(true);
      expect(mocks.trip.deleteMany).toHaveBeenCalledWith({
        where: { id: 'trip-1', userId: 'user-123' },
      });
    });

    it('returns 404 if trip to delete does not exist', async () => {
      mocks.requireUser.mockResolvedValue(dummyUser);
      mocks.trip.deleteMany.mockResolvedValue({ count: 0 });

      const res = await deleteTripById(new Request('http://localhost/api/trips/missing', { method: 'DELETE' }), {
        params: Promise.resolve({ id: 'missing' }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe('not_found');
    });
  });
});
