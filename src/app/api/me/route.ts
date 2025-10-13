// src/app/api/me/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

export async function GET() {
  try {
    const token = (await cookies()).get('auth')?.value;
    if (!token) return NextResponse.json({ user: null }, { status: 401 });
    const { payload } = await jwtVerify(token, secret);
    return NextResponse.json({
      user: { id: payload.id, email: payload.email, role: payload.role },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
