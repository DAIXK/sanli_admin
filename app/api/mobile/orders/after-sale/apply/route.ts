import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const { WECHAT_APP_ID, WECHAT_APP_SECRET } = process.env;
const AFTER_SALE_WINDOW_DAYS = Number(process.env.AFTER_SALE_WINDOW_DAYS || 7);

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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            orderId,
            type,
            reason,
            desc,
            images,
            openid: openidRaw,
            code,
        } = body || {};

        if (!orderId || !type) {
            return NextResponse.json({ code: 400, error: 'Missing orderId or type' }, { status: 400 });
        }

        let openid = openidRaw as string | undefined;
        if (!openid && code) {
            openid = await codeToOpenId(code);
        }
        if (!openid) {
            return NextResponse.json({ code: 400, error: 'Missing openid or code' }, { status: 400 });
        }

        const order = await db.order.findById(orderId);
        if (!order) {
            return NextResponse.json({ code: 404, error: 'Order not found' }, { status: 404 });
        }
        if (order.openid && order.openid !== openid) {
            return NextResponse.json({ code: 403, error: 'Order and openid mismatch' }, { status: 403 });
        }
        if (order.status !== 3) {
            return NextResponse.json({ code: 400, error: 'Only completed orders can apply after-sale' }, { status: 400 });
        }
        if (!order.paidAt) {
            return NextResponse.json({ code: 400, error: 'Order missing paid time' }, { status: 400 });
        }

        const paidTime = new Date(order.paidAt).getTime();
        const deadline = paidTime + AFTER_SALE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
        if (Date.now() > deadline) {
            return NextResponse.json({ code: 400, error: 'After-sale window expired' }, { status: 400 });
        }

        const updated = await db.order.update(orderId, {
            afterSaleStatus: 5,
            afterSaleType: type,
            afterSaleReason: reason || '',
            afterSaleDesc: desc || '',
            afterSaleImages: Array.isArray(images) ? images.slice(0, 9) : null,
            afterSaleDeadline: new Date(deadline).toISOString(),
        });

        return NextResponse.json({ code: 0, success: true, data: updated });
    } catch (error: any) {
        console.error('After-sale apply error:', error);
        return NextResponse.json({ code: 500, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
