import { hashOpaqueToken } from '@/lib/auth-email';
import { createApiError } from '@/lib/env';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get('token');
  if (!token || token.length > 200) return createApiError('invalid_token', 'This verification link is invalid.', 400);

  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hashOpaqueToken(token) } });
  if (!record || record.expires <= new Date()) return createApiError('invalid_token', 'This verification link is invalid or expired.', 400);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
    prisma.emailVerificationToken.delete({ where: { id: record.id } }),
  ]);
  return Response.json({ verified: true });
}
