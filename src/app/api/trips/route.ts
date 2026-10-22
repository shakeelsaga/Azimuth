import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { createApiError } from '@/lib/env';
import { requireUser } from '@/lib/auth-route';
import { prisma } from '@/lib/prisma';

const SaveTripSchema = z.object({
  title: z.string().trim().min(1).max(160),
  destination: z.string().trim().min(1).max(120),
  itinerary: z.record(z.unknown()),
  lastActivity: z.string().trim().max(500).optional(),
  lastLocation: z.object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
  }).optional(),
});

export async function GET(): Promise<Response> {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const trips = await prisma.trip.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, destination: true, lastActivity: true, createdAt: true, updatedAt: true },
  });
  return Response.json(trips, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request): Promise<Response> {
  const user = await requireUser();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createApiError('validation_failed', 'Please provide a valid trip.', 400);
  }
  const parsed = SaveTripSchema.safeParse(body);
  if (!parsed.success) return createApiError('validation_failed', 'Please provide a valid trip.', 400);

  const trip = await prisma.trip.create({
    data: { ...parsed.data, itinerary: parsed.data.itinerary as Prisma.InputJsonValue, userId: user.id },
    select: { id: true, title: true, destination: true, lastActivity: true, createdAt: true, updatedAt: true },
  });
  return Response.json(trip, { status: 201 });
}
