import { NextResponse } from 'next/server';

export function middleware(request) {
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Admin route authentication check
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/changeworksadmin') &&
      !pathname.startsWith('/changeworksadmin/login')) {

    const adminToken = request.cookies.get('adminToken')?.value ||
                      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!adminToken && request.headers.get('accept')?.includes('text/html')) {
      return NextResponse.redirect(new URL('/changeworksadmin/login', request.url));
    }
  }

  // Add CORS headers to every API response
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/changeworksadmin',
    '/changeworksadmin/((?!login).)*',
  ],
};
