export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md min-h-dvh">
      <header className="px-4 py-3 text-center font-semibold border-b">App Meseros</header>
      <main className="p-4">{children}</main>
    </div>
  );
}
