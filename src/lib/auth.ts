// src/lib/auth.ts
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export type Role = 'ADMIN' | 'PROC' | 'INVENTORY' | 'WAITER' | 'CHEF';

export type Session = {
  id: string;
  role: Role;
  name: string | null;
  email: string | null;
};

const SECRET = process.env.SESSION_SECRET ?? 'dev-secret-change-me';

// Genera el JWT que guardamos en la cookie "session"
export function createToken(payload: Session): string {
  return jwt.sign(payload, SECRET, { expiresIn: '8h' });
}

// Lee y valida la cookie "session" (AHORA ASYNC por Next 15)
export async function getSession(): Promise<Session | null> {
  const store = await cookies();                 // 👈 cookies() es async
  const raw = store.get('session')?.value;
  if (!raw) return null;
  try {
    return jwt.verify(raw, SECRET) as Session;
  } catch {
    return null;
  }
}
