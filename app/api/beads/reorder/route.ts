import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { tabId, order } = body;

        if (!tabId || !Array.isArray(order)) {
            return NextResponse.json({ error: 'tabId and order are required' }, { status: 400 });
        }

        await db.bead.reorder(tabId, order as string[]);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
