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
        const { orderId, trackingNumber, carrierName, carrierCode } = body || {};

        if (!orderId || !trackingNumber || !carrierName) {
            return NextResponse.json({ error: 'Missing params' }, { status: 400 });
        }

        const order = await db.order.findById(orderId);
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
        if (![1, 2].includes(order.status)) {
            return NextResponse.json({ error: 'Order not paid or already completed' }, { status: 400 });
        }

        const updated = await db.order.update(orderId, {
            status: 2,
            trackingNumber,
            carrierName,
            carrierCode: carrierCode ?? order.carrierCode ?? null,
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error('Admin ship order error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
