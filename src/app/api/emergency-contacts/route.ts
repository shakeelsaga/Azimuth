import { z } from 'zod';
import { createApiError } from '@/lib/env';
import { requireUser } from '@/lib/auth-route';
import { prisma } from '@/lib/prisma';

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320).optional(),
  phone: z.string().trim().regex(/^\+[1-9]\d{7,14}$/).optional(),
}).refine((contact) => Boolean(contact.email || contact.phone), 'An email or E.164 phone number is required.');

export async function GET(): Promise<Response> {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const contacts = await prisma.emergencyContact.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true, phone: true },
  });
  return Response.json(contacts);
}

export async function POST(request: Request): Promise<Response> {
  const user = await requireUser();
  if (user instanceof Response) return user;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createApiError('validation_failed', 'Please provide a valid contact.', 400);
  }
  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) return createApiError('validation_failed', 'Provide a name and an email or E.164 phone number.', 400);
  const contact = await prisma.emergencyContact.create({
    data: { ...parsed.data, userId: user.id },
    select: { id: true, name: true, email: true, phone: true },
  });
  return Response.json(contact, { status: 201 });
}
