import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const { WECHAT_APP_ID, WECHAT_APP_SECRET } = process.env;

async function codeToOpenId(code: string) {
    if (!WECHAT_APP_ID || !WECHAT_APP_SECRET) {
        throw new Error('Missing WECHAT_APP_ID/WECHAT_APP_SECRET');
    }
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}&js_code=${code}&grant_type=authorization_code`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.openid) return data.openid as string;
    throw new Error(data.errmsg || 'Failed to get openid');
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const openidParam = searchParams.get('openid') || undefined;
        const code = searchParams.get('code') || undefined;
        const orderId = searchParams.get('orderId') || undefined;
        const statusParam = searchParams.get('status');
        const status = statusParam !== null ? Number(statusParam) : undefined;
        const afterSaleStatusParam = searchParams.get('afterSaleStatus');
        const afterSaleStatus = afterSaleStatusParam !== null ? Number(afterSaleStatusParam) : undefined;

        let openid = openidParam;
        if (!openid && code) {
            openid = await codeToOpenId(code);
        }

        if (!openid) {
            return NextResponse.json({ code: 400, error: 'Missing openid or code' }, { status: 400 });
        }

        if (orderId) {
            const order = await db.order.findById(orderId);
            if (!order) {
                return NextResponse.json({ code: 404, error: 'Order not found' }, { status: 404 });
            }
            if (order.openid && order.openid !== openid) {
                return NextResponse.json({ code: 403, error: 'Order and openid mismatch' }, { status: 403 });
            }
            return NextResponse.json({ code: 0, success: true, data: order });
        }

        let orders = await db.order.findMany({
            openid,
            status: Number.isNaN(status) ? undefined : status,
        });

        if (!Number.isNaN(afterSaleStatus) && afterSaleStatusParam !== null) {
            orders = orders.filter((o) => o.afterSaleStatus === afterSaleStatus);
        }

        return NextResponse.json({ code: 0, success: true, data: orders });
    } catch (error) {
        console.error('Get orders error:', error);
        return NextResponse.json({ code: 500, error: 'Internal Server Error' }, { status: 500 });
    }
}
