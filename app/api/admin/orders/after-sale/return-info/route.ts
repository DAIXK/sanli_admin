import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const info = await db.afterSaleReturnInfo.get();
        return NextResponse.json({ success: true, data: info });
    } catch (error) {
        console.error('Get after-sale return info error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { receiverName, telNumber, address, note } = body || {};
        const updated = await db.afterSaleReturnInfo.update({
            receiverName: receiverName ?? '',
            telNumber: telNumber ?? '',
            address: address ?? '',
            note: note ?? '',
        });
        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error('Update after-sale return info error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
