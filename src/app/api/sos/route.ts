import { Buffer } from 'node:buffer';
import { z } from 'zod';
import nodemailer from 'nodemailer';
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

async function sendEmailWithGmail(
  to: string,
  subject: string,
  text: string,
  html: string,
): Promise<boolean> {
  const { GMAIL_USER: user, GMAIL_APP_PASSWORD: pass, GMAIL_FROM_EMAIL: from } = process.env;
  if (!user || !pass) return false;
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: from || `Azimuth Emergency <${user}>`,
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch {
    return false;
  }
}

async function sendEmail(
  contact: Contact,
  message: string,
  travelerName: string,
  travelerEmail: string,
  mapUrl: string,
  coordinates: string,
): Promise<DeliveryResult> {
  if (!contact.email) return { provider: 'email', status: 'skipped' };
  const fromEmail = process.env.SOS_FROM_EMAIL || process.env.AUTH_FROM_EMAIL;
  const subject = `🚨 EMERGENCY ALERT: ${travelerName} has triggered an SOS`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 2px solid #b91c1c; border-radius: 8px; background: #ffffff;">
      <div style="background: #b91c1c; color: #ffffff; padding: 10px 16px; border-radius: 4px; font-weight: 700; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase;">
        🚨 Azimuth Emergency SOS Alert
      </div>
      <h2 style="color: #111111; margin: 20px 0 12px 0; font-size: 22px;">
        ${travelerName} needs assistance
      </h2>
      <p style="color: #444444; font-size: 15px; line-height: 1.5; margin: 0 0 16px 0;">
        You are listed as a trusted emergency contact for <strong>${travelerName}</strong> (<a href="mailto:${travelerEmail}" style="color: #111111;">${travelerEmail}</a>). They have just triggered an emergency SOS alert.
      </p>
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <div style="font-size: 12px; font-weight: 700; color: #991b1b; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.04em;">
          Emergency Details
        </div>
        <div style="font-size: 14px; color: #111111; margin-bottom: 6px;">
          <strong>Traveler:</strong> ${travelerName} (${travelerEmail})
        </div>
        <div style="font-size: 14px; color: #111111; margin-bottom: 6px;">
          <strong>Coordinates:</strong> ${coordinates}
        </div>
        <div style="font-size: 14px; color: #111111;">
          <strong>Time of Alert:</strong> ${new Date().toUTCString()}
        </div>
      </div>
      <div style="margin: 24px 0;">
        <a href="${mapUrl}" style="background: #111111; color: #ffffff; padding: 13px 24px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block;">
          View Live Location on Google Maps →
        </a>
      </div>
      <p style="color: #777777; font-size: 13px; line-height: 1.4; margin: 20px 0 0 0; border-top: 1px solid #eeeeee; padding-top: 16px;">
        Please check in on ${travelerName} immediately or contact local emergency responders if you cannot reach them.
      </p>
    </div>
  `;

  // 1. Primary: Try Resend if configured
  if (process.env.RESEND_API_KEY && fromEmail) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: [contact.email],
          subject,
          text: message,
          html,
        }),
      });
      if (response.ok) return { provider: 'email', status: 'sent' };
    } catch {
      // Fall through to Gmail fallback
    }
  }

  // 2. Secondary: Try Gmail SMTP fallback
  const sentWithGmail = await sendEmailWithGmail(contact.email, subject, message, html);
  if (sentWithGmail) return { provider: 'email', status: 'sent' };

  return { provider: 'email', status: 'failed', errorCode: 'delivery_sandbox_restricted' };
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

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true },
  });
  const travelerName = dbUser?.name || 'Azimuth Traveler';
  const travelerEmail = dbUser?.email || user.email || 'Registered account';

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
  const coordinatesStr = `${parsed.data.latitude}, ${parsed.data.longitude}`;
  const message = [
    `EMERGENCY SOS ALERT: Traveler in Need of Assistance`,
    `----------------------------------------------------`,
    `Traveler: ${travelerName} (${travelerEmail})`,
    `Live Location: ${mapUrl}`,
    `Coordinates: ${coordinatesStr}`,
    `Recent Activity: ${parsed.data.recentActivity || 'Emergency alert dispatched from Azimuth planner.'}`,
    `Dispatched At: ${new Date().toUTCString()}`,
    `----------------------------------------------------`,
    `You are receiving this urgent broadcast because ${travelerName} added you as a trusted emergency contact in Azimuth. Please check in with them immediately or notify local emergency services if you cannot make contact.`,
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
    sendEmail(contact, message, travelerName, travelerEmail, mapUrl, coordinatesStr),
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
  await prisma.sosEvent.update({
    where: { id: event.id },
    data: { status: delivered ? 'sent' : 'logged' },
  });

  if (!delivered) {
    // In development / sandbox mode without a verified custom domain, transactional email is blocked
    // to arbitrary recipient addresses by Resend.
    // Return 200 with recorded alert details and the live Google Maps link so the traveler is never stranded.
    return Response.json(
      {
        id: event.id,
        status: 'recorded',
        delivered: false,
        mapUrl,
        warning: 'Alert recorded to database. Automated email dispatch restricted in sandbox mode (verified custom domain pending). Share the live GPS link directly.',
        deliveryResults,
      },
      { status: 200 }
    );
  }

  return Response.json({ id: event.id, status: 'sent', delivered: true, mapUrl }, { status: 202 });
}
