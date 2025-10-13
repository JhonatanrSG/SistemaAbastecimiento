// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = [
  '/login',
  '/api/login',
  '/api/health',
  '/api/po',                 // tus APIs seguirán accesibles según necesites
  '/api/rfqs',
  '/favicon.ico',
  '/_next',                  // assets
  '/rfqs/',                  // PDFs
  '/pos/',                   // PDFs
]

const ROLE_RULES: Array<{ regex: RegExp; roles: Array<'ADMIN'|'PROC'|'WAITER'|'INVENTORY'|'*'> }> = [
  { regex: /^\/$/, roles: ['*'] },
  { regex: /^\/requests|^\/rfqs|^\/suppliers|^\/pos($|\/)/, roles: ['ADMIN', 'PROC'] },
  { regex: /^\/inventory($|\/)/, roles: ['ADMIN', 'INVENTORY'] },
  { regex: /^\/catalog($|\/)|^\/orders($|\/)/, roles: ['ADMIN', 'WAITER'] },
]

function isPublic(path: string) {
  return PUBLIC_PATHS.some(p => path === p || path.startsWith(p))
}

async function readSession(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET || 'dev'))
    return payload as { role: 'ADMIN'|'PROC'|'WAITER'|'INVENTORY' }
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (isPublic(pathname)) return NextResponse.next()

  const session = await readSession(req)
  if (!session) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(url)
  }

  // Chequeo de roles por patrón
  for (const rule of ROLE_RULES) {
    if (rule.regex.test(pathname)) {
      if (rule.roles.includes('*') || rule.roles.includes(session.role)) return NextResponse.next()
      // sin permisos
      const url = req.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('denied', '1')
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}



// src/middleware.ts
export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/', '/catalog/:path*', '/suppliers/:path*', '/requests/:path*',
    '/rfqs/:path*', '/inventory/:path*', '/pos/:path*'
  ],
};

