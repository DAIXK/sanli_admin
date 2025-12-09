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
        const statusParam = searchParams.get('afterSaleStatus');
        const afterSaleStatus = statusParam !== null && statusParam !== '' ? Number(statusParam) : undefined;
        const keyword = searchParams.get('keyword') || undefined;
        const createdFrom = searchParams.get('createdFrom') || undefined;
        const createdTo = searchParams.get('createdTo') || undefined;

        let orders = await db.order.findMany({ keyword, createdFrom, createdTo });
        orders = orders.filter((o) => o.afterSaleStatus !== null && o.afterSaleStatus !== undefined);

        if (!Number.isNaN(afterSaleStatus) && statusParam !== null) {
            orders = orders.filter((o) => o.afterSaleStatus === afterSaleStatus);
        }

        return NextResponse.json({ success: true, data: orders });
    } catch (error) {
        console.error('Admin get after-sale orders error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
