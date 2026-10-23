import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { createApiError } from '@/lib/env';
import { requireUser } from '@/lib/auth-route';
import { prisma } from '@/lib/prisma';

const UpdateTripSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  itinerary: z.record(z.unknown()).optional(),
  lastActivity: z.string().trim().max(500).optional(),
  lastLocation: z.object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
  }).optional(),
});

export async function GET(_: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const { id } = await context.params;
  const trip = await prisma.trip.findFirst({ where: { id, userId: user.id } });
  if (!trip) return createApiError('not_found', 'Trip not found.', 404);
  return Response.json(trip, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createApiError('validation_failed', 'Please provide valid trip updates.', 400);
  }
  const parsed = UpdateTripSchema.safeParse(body);
  if (!parsed.success) return createApiError('validation_failed', 'Please provide valid trip updates.', 400);

  const data: Prisma.TripUpdateManyMutationInput = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.itinerary !== undefined) data.itinerary = parsed.data.itinerary as Prisma.InputJsonValue;
  if (parsed.data.lastActivity !== undefined) data.lastActivity = parsed.data.lastActivity;
  if (parsed.data.lastLocation !== undefined) data.lastLocation = parsed.data.lastLocation;
  const result = await prisma.trip.updateMany({ where: { id, userId: user.id }, data });
  if (result.count === 0) return createApiError('not_found', 'Trip not found.', 404);
  return Response.json({ updated: true });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const { id } = await context.params;
  const result = await prisma.trip.deleteMany({ where: { id, userId: user.id } });
  if (result.count === 0) return createApiError('not_found', 'Trip not found.', 404);
  return Response.json({ deleted: true });
}
