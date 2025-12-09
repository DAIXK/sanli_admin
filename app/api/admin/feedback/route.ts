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
        const keyword = searchParams.get('keyword') || undefined;
        const createdFrom = searchParams.get('createdFrom') || undefined;
        const createdTo = searchParams.get('createdTo') || undefined;

        const data = await db.feedback.findMany({ keyword, createdFrom, createdTo });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Admin get feedback error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
