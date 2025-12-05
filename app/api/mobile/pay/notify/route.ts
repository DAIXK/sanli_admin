import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';

const { WECHAT_API_KEY } = process.env;

function md5(str: string) {
    return crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();
}

function buildSign(params: Record<string, string>) {
    if (!WECHAT_API_KEY) {
        throw new Error('Missing WECHAT_API_KEY');
    }
    const sortedKeys = Object.keys(params)
        .filter((k) => k !== 'sign' && params[k] !== undefined && params[k] !== '')
        .sort();
    const stringA = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
    return md5(`${stringA}&key=${WECHAT_API_KEY}`);
}

function parseXml(xml: string) {
    const result: Record<string, string> = {};
    const regex = /<(\w+)><!\[CDATA\[(.*?)\]\]><\/\1>|<(\w+)>([^<]*)<\/\3>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
        const key = match[1] || match[3];
        const value = match[2] ?? match[4] ?? '';
        result[key] = value;
    }
    return result;
}

function buildXml(obj: Record<string, string>) {
    const parts = ['<xml>'];
    Object.entries(obj).forEach(([k, v]) => {
        parts.push(`<${k}><![CDATA[${v}]]></${k}>`);
    });
    parts.push('</xml>');
    return parts.join('');
}

export async function POST(request: Request) {
    try {
        const raw = await request.text();
        const data = parseXml(raw);

        if (data.return_code !== 'SUCCESS' || data.result_code !== 'SUCCESS') {
            return new NextResponse(buildXml({ return_code: 'FAIL', return_msg: 'WX_ERROR' }), {
                status: 200,
                headers: { 'Content-Type': 'text/xml' },
            });
        }

        const sign = data.sign;
        const calcSign = buildSign(data);
        if (!sign || sign !== calcSign) {
            console.error('Notify sign mismatch', { sign, calcSign, data });
            return new NextResponse(buildXml({ return_code: 'FAIL', return_msg: 'SIGN_ERROR' }), {
                status: 200,
                headers: { 'Content-Type': 'text/xml' },
            });
        }

        const outTradeNo = data.out_trade_no;
        const transactionId = data.transaction_id;
        const totalFee = Number(data.total_fee || 0);

        if (!outTradeNo) {
            return new NextResponse(buildXml({ return_code: 'FAIL', return_msg: 'NO_ORDER' }), {
                status: 200,
                headers: { 'Content-Type': 'text/xml' },
            });
        }

        const order = await db.order.findById(outTradeNo);
        if (!order) {
            console.error('Notify order not found', outTradeNo);
            return new NextResponse(buildXml({ return_code: 'FAIL', return_msg: 'ORDER_NOT_FOUND' }), {
                status: 200,
                headers: { 'Content-Type': 'text/xml' },
            });
        }

        // Only update unpaid orders
        if (order.status === 0) {
            await db.order.update(outTradeNo, {
                status: 1,
                transactionId: transactionId || null,
                paidAmount: totalFee ? totalFee / 100 : null,
                paidAt: new Date().toISOString(),
            });
        }

        return new NextResponse(buildXml({ return_code: 'SUCCESS', return_msg: 'OK' }), {
            status: 200,
            headers: { 'Content-Type': 'text/xml' },
        });
    } catch (error) {
        console.error('WeChat notify error:', error);
        return new NextResponse(buildXml({ return_code: 'FAIL', return_msg: 'SERVER_ERROR' }), {
            status: 200,
            headers: { 'Content-Type': 'text/xml' },
        });
    }
}
