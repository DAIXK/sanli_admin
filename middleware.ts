import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { basePath, withBasePath } from '@/lib/basePath';

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const relativePath = basePath && pathname.startsWith(basePath)
        ? pathname.slice(basePath.length) || '/'
        : pathname;

    const token = request.cookies.get('token')?.value;
    const verifiedToken = token && (await verifyToken(token));

    if (relativePath.startsWith('/dashboard')) {
        if (!verifiedToken) {
            return NextResponse.redirect(new URL(withBasePath('/login'), request.url));
        }
    }

    if (relativePath === '/login') {
        if (verifiedToken) {
            return NextResponse.redirect(new URL(withBasePath('/dashboard'), request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login'],
};
