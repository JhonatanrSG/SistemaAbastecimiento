import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const list = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body?.name || !body?.email) return NextResponse.json({ error: 'name/email requeridos' }, { status: 400 });
  const created = await prisma.supplier.create({ data: { name: body.name, email: body.email } });
  return NextResponse.json({ id: created.id }, { status: 201 });
}
