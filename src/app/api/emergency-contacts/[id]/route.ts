import { createApiError } from '@/lib/env';
import { requireUser } from '@/lib/auth-route';
import { prisma } from '@/lib/prisma';

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const { id } = await context.params;
  const result = await prisma.emergencyContact.deleteMany({ where: { id, userId: user.id } });
  if (result.count === 0) return createApiError('not_found', 'Contact not found.', 404);
  return new Response(null, { status: 204 });
}
