// src/components/NavCard.tsx
import Link from 'next/link';

export function NavCard({ title, href }: { title: string; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border shadow-sm p-5 hover:shadow-md transition bg-white"
    >
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-sm text-gray-500 mt-1">{href}</div>
    </Link>
  );
}
