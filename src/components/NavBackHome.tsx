'use client';
import Link from 'next/link';

export default function NavBackHome() {
  return (
    <Link href="/home" className="text-sm text-indigo-600 hover:underline inline-flex items-center gap-1">
      ← Volver al inicio
    </Link>
  );
}
