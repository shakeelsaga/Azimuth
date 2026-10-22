import { prisma } from '@/lib/prisma';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const BLOCK_MS = 15 * 60 * 1000;

export async function isLoginBlocked(key: string): Promise<boolean> {
  const record = await prisma.loginThrottle.findUnique({ where: { key } });
  return Boolean(record?.blockedUntil && record.blockedUntil > new Date());
}

export async function recordLoginFailure(key: string): Promise<void> {
  const now = new Date();
  const record = await prisma.loginThrottle.findUnique({ where: { key } });
  const windowExpired = !record || now.getTime() - record.windowStart.getTime() >= WINDOW_MS;
  const failures = windowExpired ? 1 : record.failures + 1;
  await prisma.loginThrottle.upsert({
    where: { key },
    create: {
      key,
      failures,
      windowStart: now,
      blockedUntil: failures >= MAX_FAILURES ? new Date(now.getTime() + BLOCK_MS) : null,
    },
    update: {
      failures,
      windowStart: windowExpired ? now : record.windowStart,
      blockedUntil: failures >= MAX_FAILURES ? new Date(now.getTime() + BLOCK_MS) : null,
    },
  });
}

export async function clearLoginFailures(key: string): Promise<void> {
  await prisma.loginThrottle.deleteMany({ where: { key } });
}
