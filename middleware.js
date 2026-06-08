import { NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Handle CORS preflight for all API routes
  if (pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  // Admin route authentication check
  if (pathname.startsWith('/changeworksadmin') &&
      !pathname.startsWith('/changeworksadmin/login')) {

    const adminToken = request.cookies.get('adminToken')?.value ||
                      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!adminToken && request.headers.get('accept')?.includes('text/html')) {
      return NextResponse.redirect(new URL('/changeworksadmin/login', request.url));
    }
  }

  const response = NextResponse.next();

  // Attach CORS headers to all API responses
  if (pathname.startsWith('/api/')) {
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/changeworksadmin',
    '/changeworksadmin/((?!login).)*',
  ],
};
