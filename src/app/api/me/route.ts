// src/app/api/me/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  // Siempre 200, aunque no haya sesión
  return NextResponse.json({
    role: s?.role ?? null,
  });
}
