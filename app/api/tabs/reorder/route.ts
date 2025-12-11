import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token || !(await verifyToken(token))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { order } = body; // Array of IDs in new order

        if (!Array.isArray(order)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        // Use db abstraction
        await db.tab.reorder(order);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Reorder tabs error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
