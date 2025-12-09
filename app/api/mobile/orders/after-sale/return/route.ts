import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const { WECHAT_APP_ID, WECHAT_APP_SECRET } = process.env;
const KUAIDI_KEY = process.env.KUAIDI100_KEY;

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

async function detectCarrierCode(trackingNumber: string) {
    if (!KUAIDI_KEY) return null;
    try {
        const res = await fetch(`https://www.kuaidi100.com/autonumber/auto?num=${trackingNumber}&key=${KUAIDI_KEY}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0]?.comCode) {
            return data[0].comCode as string;
        }
    } catch (err) {
        console.warn('Detect carrier code failed', err);
    }
    return null;
}

// 用户提交退货物流
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId, returnTrackingNumber, returnCarrierCode, openid: openidRaw, code } = body || {};

        if (!orderId || !returnTrackingNumber) {
            return NextResponse.json({ code: 400, error: 'Missing orderId or returnTrackingNumber' }, { status: 400 });
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
        if (order.afterSaleStatus !== 6 && order.afterSaleStatus !== 5) {
            // 只允许待审核/处理中阶段填写退货物流
            return NextResponse.json({ code: 400, error: 'After-sale not allowed to submit logistics' }, { status: 400 });
        }

        let carrierCode = returnCarrierCode || order.returnCarrierCode || null;
        if (!carrierCode) {
            carrierCode = await detectCarrierCode(returnTrackingNumber);
        }

        const updated = await db.order.update(orderId, {
            returnCarrierCode: carrierCode,
            returnTrackingNumber,
        });

        return NextResponse.json({ code: 0, success: true, data: updated });
    } catch (error: any) {
        console.error('After-sale return logistics error:', error);
        return NextResponse.json({ code: 500, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
