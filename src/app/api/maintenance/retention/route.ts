import { prisma } from '@/lib/prisma';

export async function POST(request: Request): Promise<Response> {
  const expected = process.env.RETENTION_JOB_SECRET;
  if (!expected || request.headers.get('authorization') !== `Bearer ${expected}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const days = Number.parseInt(process.env.SOS_RETENTION_DAYS ?? '30', 10);
  const retentionDays = Number.isFinite(days) && days > 0 ? days : 30;
  const result = await prisma.sosEvent.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000) } },
  });
  return Response.json({ deleted: result.count });
}
