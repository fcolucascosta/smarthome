import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const token = req.cookies.get('auth_token');
    const isLoginPage = req.nextUrl.pathname === '/login';
    const isApiAuth = req.nextUrl.pathname.startsWith('/api/auth');

    // Allow assets (images, fonts, etc.)
    if (req.nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|ico|svg)$/)) {
        return NextResponse.next();
    }

    // If authenticated and visiting login page, redirect to home
    if (token && isLoginPage) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    // If accessing protected route without token
    if (!token) {
        // Allow access to login page and auth API
        if (isLoginPage || isApiAuth) {
            return NextResponse.next();
        }

        // API routes: return 401 JSON
        if (req.nextUrl.pathname.startsWith('/api')) {
            return NextResponse.json({ success: false, msg: 'Unauthorized' }, { status: 401 });
        }

        // Pageroutes: redirect to login
        return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
