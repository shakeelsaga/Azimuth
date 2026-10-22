import { Buffer } from 'node:buffer';
import { z } from 'zod';
import { createApiError } from '@/lib/env';
import { requireUser } from '@/lib/auth-route';
import { prisma } from '@/lib/prisma';

const SosSchema = z.object({
  tripId: z.string().trim().min(1).optional(),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  recentActivity: z.string().trim().max(1_000).optional(),
});

type Contact = { name: string; email: string | null; phone: string | null };
type DeliveryResult = { provider: 'email' | 'sms'; status: 'sent' | 'failed' | 'skipped'; errorCode?: string };

async function sendEmail(contact: Contact, message: string): Promise<DeliveryResult> {
  if (!contact.email || !process.env.RESEND_API_KEY || !process.env.SOS_FROM_EMAIL) return { provider: 'email', status: 'skipped' };
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.SOS_FROM_EMAIL,
        to: [contact.email],
        subject: 'Azimuth emergency alert',
        text: message,
      }),
    });
    if (!response.ok) return { provider: 'email', status: 'failed', errorCode: `http_${response.status}` };
    return { provider: 'email', status: 'sent' };
  } catch {
    return { provider: 'email', status: 'failed', errorCode: 'network_error' };
  }
}

async function sendSms(contact: Contact, message: string): Promise<DeliveryResult> {
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM_NUMBER: from } = process.env;
  if (!contact.phone || !sid || !token || !from) return { provider: 'sms', status: 'skipped' };
  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: contact.phone, From: from, Body: message }),
    });
    if (!response.ok) return { provider: 'sms', status: 'failed', errorCode: `http_${response.status}` };
    return { provider: 'sms', status: 'sent' };
  } catch {
    return { provider: 'sms', status: 'failed', errorCode: 'network_error' };
  }
}

async function cleanupExpiredSosEvents(): Promise<void> {
  const days = Number.parseInt(process.env.SOS_RETENTION_DAYS ?? '30', 10);
  const retentionDays = Number.isFinite(days) && days > 0 ? days : 30;
  await prisma.sosEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000) } } });
}

export async function POST(request: Request): Promise<Response> {
  const user = await requireUser();
  if (user instanceof Response) return user;
  await cleanupExpiredSosEvents();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createApiError('validation_failed', 'Live location is required for an SOS alert.', 400);
  }
  const parsed = SosSchema.safeParse(body);
  if (!parsed.success) return createApiError('validation_failed', 'Live location is required for an SOS alert.', 400);

  const contacts = await prisma.emergencyContact.findMany({
    where: { userId: user.id },
    select: { name: true, email: true, phone: true },
  });
  if (contacts.length === 0) return createApiError('contacts_required', 'Set at least one emergency contact before using SOS.', 409);

  let tripId: string | null = null;
  if (parsed.data.tripId) {
    const trip = await prisma.trip.findFirst({ where: { id: parsed.data.tripId, userId: user.id }, select: { id: true } });
    if (!trip) return createApiError('not_found', 'Trip not found.', 404);
    tripId = trip.id;
  }

  const mapUrl = `https://maps.google.com/?q=${parsed.data.latitude},${parsed.data.longitude}`;
  const message = [
    'Azimuth emergency alert: the traveler may need help.',
    `Live location: ${mapUrl}`,
    `Recent activity: ${parsed.data.recentActivity || 'Not provided.'}`,
  ].join('\n');
  const event = await prisma.sosEvent.create({
    data: {
      userId: user.id,
      tripId,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      recentActivity: parsed.data.recentActivity,
    },
  });

  const deliveryResults = await Promise.all(contacts.flatMap((contact) => [
    sendEmail(contact, message),
    sendSms(contact, message),
  ]));
  await prisma.sosDelivery.createMany({
    data: deliveryResults.map((result) => ({
      eventId: event.id,
      provider: result.provider,
      status: result.status,
      errorCode: result.errorCode,
    })),
  });
  const delivered = deliveryResults.some((result) => result.status === 'sent');
  await prisma.sosEvent.update({ where: { id: event.id }, data: { status: delivered ? 'sent' : 'failed' } });
  if (!delivered) return createApiError('delivery_failed', 'SOS could not be delivered. Configure an email or SMS provider.', 502);
  return Response.json({ id: event.id, status: 'sent' }, { status: 202 });
}
