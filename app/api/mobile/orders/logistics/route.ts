import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const { WECHAT_APP_ID, WECHAT_APP_SECRET } = process.env;
const KUAIDI_CUSTOMER = process.env.KUAIDI100_CUSTOMER;
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

function buildKuaidiSign(param: string) {
    if (!KUAIDI_CUSTOMER || !KUAIDI_KEY) {
        throw new Error('Missing KUAIDI100_CUSTOMER or KUAIDI100_KEY');
    }
    const crypto = require('crypto');
    return crypto.createHash('md5').update(param + KUAIDI_KEY + KUAIDI_CUSTOMER, 'utf8').digest('hex').toUpperCase();
}

const carrierAliasMap: Record<string, string> = {
    zto: 'zhongtong',
    zhongtong: 'zhongtong',
    yto: 'yuantong',
    yuantong: 'yuantong',
    sf: 'shunfeng',
    shunfeng: 'shunfeng',
    sto: 'shentong',
    shentong: 'shentong',
    yd: 'yunda',
    yunda: 'yunda',
    jd: 'jd',
    jdexpress: 'jd',
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId') || undefined;
        const openidParam = searchParams.get('openid') || undefined;
        const code = searchParams.get('code') || undefined;
        const direction = (searchParams.get('direction') || 'outbound').toLowerCase();
        const isReturn = direction === 'return';

        if (!orderId) {
            return NextResponse.json({ code: 400, error: 'Missing orderId' }, { status: 400 });
        }

        let openid = openidParam;
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

        const trackingNumber = isReturn
            ? searchParams.get('returnTrackingNumber') || order.returnTrackingNumber || ''
            : order.trackingNumber || '';
        const carrierCodeRaw = isReturn
            ? searchParams.get('returnCarrierCode') || order.returnCarrierCode || ''
            : order.carrierCode || '';
        const carrierCode = carrierAliasMap[carrierCodeRaw.trim().toLowerCase()] || carrierCodeRaw.trim().toLowerCase();
        const carrierName = isReturn ? order.carrierName || '' : order.carrierName || '';
        const phoneTailParam = searchParams.get('phoneTail');
        const phoneTail =
            phoneTailParam ||
            (order.address?.telNumber && order.address.telNumber.length >= 4
                ? order.address.telNumber.slice(-4)
                : null);

        const baseData = {
            carrierName,
            trackingNumber,
            status: trackingNumber ? '暂无物流更新' : isReturn ? '未填写退货物流' : '未发货',
            phoneTail,
            nodes: [] as Array<{ time: string; status: string; location?: string; desc?: string }>,
        };

        if (!trackingNumber || !carrierCode || !KUAIDI_CUSTOMER || !KUAIDI_KEY) {
            console.info('[kuaidi100] skip query', {
                trackingNumber,
                carrierCode,
                hasCustomer: !!KUAIDI_CUSTOMER,
                hasKey: !!KUAIDI_KEY,
            });
            return NextResponse.json({ code: 0, success: true, data: baseData });
        }

        const paramObj = {
            com: carrierCode,
            num: trackingNumber,
            phone: phoneTail || '',
        };
        const param = JSON.stringify(paramObj);
        const sign = buildKuaidiSign(param);

        const res = await fetch('https://poll.kuaidi100.com/poll/query.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                customer: KUAIDI_CUSTOMER,
                sign,
                param,
            }),
        });
        const kuaidiData = await res.json();
        console.info('[kuaidi100] request', {
            code: carrierCode,
            trackingNumber,
            phoneTail,
            response: kuaidiData,
        });

        if (kuaidiData.status !== '200') {
            console.warn('Kuaidi100 query failed', kuaidiData);
            return NextResponse.json({ code: 0, success: true, data: baseData });
        }

        const stateMap: Record<string, string> = {
            '0': '在途',
            '1': '揽收',
            '2': '疑难',
            '3': '签收',
            '4': '退签',
            '5': '派件',
            '6': '退回',
            '7': '转单',
        };
        const nodes =
            (kuaidiData.data || [])
                .map((n: any) => ({
                    time: n.time || n.ftime || '',
                    status: n.status || n.context || '',
                    location: n.areaName || '',
                    desc: n.context || n.status || '',
                }))
                .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());

        const latestStatus = stateMap[kuaidiData.state] || (nodes[0]?.status || baseData.status);

        // 如果快递已签收且订单仍为已发货，自动更新订单为已完成（仅正向物流）
        if (!isReturn && kuaidiData.state === '3' && order.status === 2) {
            try {
                await db.order.updateStatus(order.id, 3);
            } catch (err) {
                console.error('Auto-complete order failed', err);
            }
        }

        const data = {
            carrierName,
            trackingNumber,
            status: latestStatus,
            phoneTail,
            nodes,
        };

        return NextResponse.json({ code: 0, success: true, data });
    } catch (error: any) {
        console.error('Get logistics error:', error);
        return NextResponse.json({ code: 500, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
