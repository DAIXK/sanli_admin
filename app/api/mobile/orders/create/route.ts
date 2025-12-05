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

interface CartItem {
    braceletId?: string;
    braceletName?: string;
    beadSummary?: any;
    price?: number | string;
    formattedPrice?: string;
    snapshotUrl?: string;
    videoUrl?: string;
    productImage?: string;
    ringSize?: string;
    marbleCount?: string | number;
    beadSize?: string;
    [key: string]: any;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, openid: openidRaw, cart, remark, address } = body || {};

        if (!Array.isArray(cart) || cart.length === 0) {
            return NextResponse.json({ code: 400, error: 'Cart is empty' }, { status: 400 });
        }

        let openid = openidRaw as string | undefined;
        if (!openid && code) {
            openid = await codeToOpenId(code);
        }
        if (!openid) {
            return NextResponse.json({ code: 400, error: 'Missing openid or code' }, { status: 400 });
        }

        const normalizedCart = cart.map((item: CartItem) => {
            const rawPrice = item.price ?? item.formattedPrice;
            const priceNum = Number(rawPrice) || 0;
            return {
                ...item,
                price: priceNum,
                formattedPrice: priceNum.toString(),
                snapshotUrl: item.snapshotUrl || item.productImage,
            };
        });

        const totalPrice = normalizedCart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour validity

        const order = await db.order.create({
            openid,
            products: normalizedCart,
            totalPrice,
            status: 0,
            remark,
            address: address || null,
            expiresAt,
        });

        return NextResponse.json({
            code: 0,
            success: true,
            data: {
                orderId: order.id,
                totalPrice,
                expiresAt,
                items: normalizedCart,
            },
        });
    } catch (error: any) {
        console.error('Create order error:', error);
        return NextResponse.json({ code: 500, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
