import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const items = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json(items);
}
