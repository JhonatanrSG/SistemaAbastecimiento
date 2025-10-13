// src/app/login/page.tsx
'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!email || !password) {
      setErr('Por favor, completa correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Credenciales inválidas');
      }

      // Éxito: redirige al home web
      window.location.href = '/home';
    } catch (e: any) {
      setErr(e?.message ?? 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="relative">
          {/* Glow */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500/40 via-fuchsia-500/40 to-emerald-400/40 blur-xl opacity-60" />
          {/* Card */}
          <div className="relative rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-8">
            {/* Header / Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center font-bold">
                SA
              </div>
              <div>
                <h1 className="text-xl font-semibold leading-tight">Sistema de Abastecimiento</h1>
                <p className="text-xs/5 text-slate-300">Acceso administrativo</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              {err && (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {err}
                </div>
              )}

              <label className="block text-sm">
                <span className="mb-1 block text-slate-200">Correo</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@empresa.com"
                  className="w-full rounded-xl bg-white/10 border border-white/10 focus:border-indigo-400 outline-none px-3 py-2 placeholder:text-slate-400"
                  autoFocus
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-slate-200">Contraseña</span>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-white/10 border border-white/10 focus:border-indigo-400 outline-none px-3 py-2 pr-10 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-300 hover:text-white"
                    aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {show ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 px-4 py-2 font-medium transition"
              >
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-slate-300">
              © {new Date().getFullYear()} Konrad — Todos los derechos reservados.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
