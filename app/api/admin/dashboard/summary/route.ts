import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orders = await db.order.findMany();

        const totalOrders = orders.length;
        const paidOrders = orders.filter((o) => [1, 2, 3].includes(o.status));
        const totalSales = paidOrders.reduce((sum, o) => sum + (o.paidAmount ?? o.totalPrice ?? 0), 0);

        const afterSaleOrders = orders.filter((o) => o.afterSaleStatus !== null && o.afterSaleStatus !== undefined);
        const afterSaleTotal = afterSaleOrders.reduce((sum, o) => sum + (o.refundAmount ?? o.totalPrice ?? 0), 0);
        const afterSalePending = afterSaleOrders.filter((o) => o.afterSaleStatus === 5 || o.afterSaleStatus === 6).length;

        const pendingShip = orders.filter((o) => o.status === 1).length;
        const pendingPay = orders.filter((o) => o.status === 0).length;

        return NextResponse.json({
            success: true,
            data: {
                totalOrders,
                totalSales,
                afterSaleOrders: afterSaleOrders.length,
                afterSaleTotal,
                afterSalePending,
                pendingShip,
                pendingPay,
                completedOrders: orders.filter((o) => o.status === 3).length,
            },
        });
    } catch (error) {
        console.error('Admin dashboard summary error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
