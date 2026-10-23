import { compare, hash } from 'bcryptjs';
import { z } from 'zod';
import { requireUser } from '@/lib/auth-route';
import { createApiError } from '@/lib/env';
import { prisma } from '@/lib/prisma';

const ChangePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.').max(200),
});

export async function POST(request: Request): Promise<Response> {
  const userSession = await requireUser();
  if (userSession instanceof Response) return userSession;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createApiError('validation_failed', 'Please provide valid password details.', 400);
  }

  const parsed = ChangePasswordSchema.safeParse(body);
  if (!parsed.success) {
    const errorMsg = parsed.error.errors[0]?.message || 'Please provide a valid password.';
    return createApiError('validation_failed', errorMsg, 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userSession.id },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    return createApiError('not_found', 'User account not found.', 404);
  }

  // If user already has a password, verify current password
  if (user.passwordHash) {
    if (!parsed.data.currentPassword) {
      return createApiError('validation_failed', 'Please provide your current password.', 400);
    }
    const isCurrentValid = await compare(parsed.data.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return createApiError('invalid_credentials', 'The current password you entered is incorrect.', 400);
    }
  }

  const newHash = await hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  return Response.json({ success: true, message: 'Password updated successfully.' });
}
