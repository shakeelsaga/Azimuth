import { auth } from '@/auth';
import { createApiError } from '@/lib/env';

export async function requireUser(): Promise<{ id: string; email?: string | null } | Response> {
  const session = await auth();
  if (!session?.user?.id) return createApiError('unauthorized', 'Please sign in to continue.', 401);
  return session.user;
}
