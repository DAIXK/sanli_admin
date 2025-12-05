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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId, address, openid: openidRaw, code } = body || {};

        if (!orderId || !address) {
            return NextResponse.json({ code: 400, error: 'Missing orderId or address' }, { status: 400 });
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
        if (order.status !== 0) {
            return NextResponse.json({ code: 400, error: 'Order already processed' }, { status: 400 });
        }

        const updated = await db.order.update(orderId, { address });

        return NextResponse.json({ code: 0, success: true, data: updated });
    } catch (error: any) {
        console.error('Update address error:', error);
        return NextResponse.json({ code: 500, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
