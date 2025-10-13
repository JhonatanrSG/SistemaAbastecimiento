// Server Component
import { getSession, type Role } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function RoleGate({ allow, children }:{
  allow: Role[]; children: React.ReactNode;
}) {
  const s = await getSession();
  if (!s) redirect('/login');
  if (!allow.includes(s.role)) redirect('/home');
  return <>{children}</>;
}
