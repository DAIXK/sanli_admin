import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const statusParam = searchParams.get('status');
        const status = statusParam !== null ? Number(statusParam) : undefined;

        const orders = await db.order.findMany({
            status: Number.isNaN(status) ? undefined : status,
        });

        return NextResponse.json({ success: true, data: orders });
    } catch (error) {
        console.error('Admin get orders error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
