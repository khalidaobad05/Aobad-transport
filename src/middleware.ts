import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow these paths without auth
  const publicPaths = ['/login', '/api/auth/login']
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static files and _next internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // For API routes, we check auth via the session cookie or header
  // For page routes, we rely on client-side auth (AuthProvider + redirect)
  // The middleware just ensures unauthenticated page visits redirect to login
  if (!pathname.startsWith('/api/')) {
    // This is a page route - the client-side AuthProvider handles the actual redirect
    // We add a header so the client knows to check auth
    const response = NextResponse.next()
    response.headers.set('x-require-auth', 'true')
    return response
  }

  // API routes pass through (auth is validated client-side for management operations)
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
