import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const openid = searchParams.get('openid') || undefined;
        const statusParam = searchParams.get('status');
        const status = statusParam !== null ? Number(statusParam) : undefined;

        if (!openid) {
            return NextResponse.json({ error: 'Missing openid' }, { status: 400 });
        }

        const orders = await db.order.findMany({
            openid,
            status: Number.isNaN(status) ? undefined : status,
        });

        return NextResponse.json({ data: orders });
    } catch (error) {
        console.error('Get orders error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
