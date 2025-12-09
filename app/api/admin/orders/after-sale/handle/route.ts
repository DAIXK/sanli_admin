import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

// afterSaleStatus: 5 待审核, 6 处理中, 7 完成, 8 拒绝

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, afterSaleStatus, refundAmount, remark, returnCarrierCode, returnTrackingNumber } = body || {};

        if (!orderId || typeof afterSaleStatus !== 'number') {
            return NextResponse.json({ error: 'Missing orderId or afterSaleStatus' }, { status: 400 });
        }

        const allowed = [5, 6, 7, 8];
        if (!allowed.includes(afterSaleStatus)) {
            return NextResponse.json({ error: 'Invalid afterSaleStatus' }, { status: 400 });
        }

        const order = await db.order.findById(orderId);
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const updated = await db.order.update(orderId, {
            afterSaleStatus,
            refundAmount: refundAmount !== undefined ? Number(refundAmount) : order.refundAmount ?? null,
            remark: remark ?? order.remark,
            returnCarrierCode: returnCarrierCode ?? order.returnCarrierCode ?? null,
            returnTrackingNumber: returnTrackingNumber ?? order.returnTrackingNumber ?? null,
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error('Admin handle after-sale error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
