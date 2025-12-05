import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';

const {
    WECHAT_APP_ID,
    WECHAT_MCH_ID,
    WECHAT_API_KEY,
    WECHAT_APP_SECRET,
    WECHAT_NOTIFY_URL,
} = process.env;

function ensureConfig() {
    if (!WECHAT_APP_ID || !WECHAT_MCH_ID || !WECHAT_API_KEY || !WECHAT_APP_SECRET || !WECHAT_NOTIFY_URL) {
        throw new Error('Missing WeChat payment config. Please set WECHAT_APP_ID, WECHAT_MCH_ID, WECHAT_API_KEY, WECHAT_APP_SECRET, WECHAT_NOTIFY_URL.');
    }
}

function md5(str: string) {
    return crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();
}

function generateNonce(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function buildSign(params: Record<string, string | number | undefined>) {
    const sortedKeys = Object.keys(params).filter((k) => params[k] !== undefined && params[k] !== '').sort();
    const stringA = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
    return md5(`${stringA}&key=${WECHAT_API_KEY}`);
}

function toXml(params: Record<string, string | number | undefined>) {
    const chunks: string[] = ['<xml>'];
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) {
            chunks.push(`<${k}><![CDATA[${v}]]></${k}>`);
        }
    });
    chunks.push('</xml>');
    return chunks.join('');
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

export async function POST(request: Request) {
    try {
        ensureConfig();

        const body = await request.json();
        const { code, openid: openidRaw, total_fee, description, out_trade_no, attach, orderId } = body || {};

        let openid = openidRaw as string | undefined;
        // 开发阶段强制 0.01 元，上线删除此常量并恢复下面被注释的真实金额逻辑
        const forceTestFee = true;
        let totalFee = Number(total_fee ?? 0);

        let outTradeNo = out_trade_no as string | undefined;
        let attachStr = attach as string | undefined;

        if (orderId) {
            const order = await db.order.findById(orderId);
            if (!order) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }
            if (openid && order.openid && openid !== order.openid) {
                return NextResponse.json({ error: 'Order and openid mismatch' }, { status: 403 });
            }
            // 过期判断
            const now = Date.now();
            if (order.expiresAt && new Date(order.expiresAt).getTime() < now) {
                await db.order.updateStatus(order.id, 4); // 4 = expired/cancelled
                return NextResponse.json({ error: 'Order expired' }, { status: 410 });
            }
            if (order.status !== 0) {
                return NextResponse.json({ error: 'Order already processed' }, { status: 400 });
            }
            // 真实金额逻辑（上线恢复）
            // const priceFen = Math.max(1, Math.round(Number(order.totalPrice) * 100));
            // totalFee = priceFen;
            outTradeNo = outTradeNo || order.id;
            attachStr = attachStr || `orderId=${order.id}`;
        }

        if (!totalFee || Number.isNaN(totalFee)) {
            totalFee = 1;
        }

        if (forceTestFee) {
            totalFee = 1; // 0.01元
        }

        if (code) {
            const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}&js_code=${code}&grant_type=authorization_code`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.openid) {
                openid = data.openid as string;
            } else {
                return NextResponse.json({ error: `Failed to get openid: ${data.errmsg || 'unknown'}` }, { status: 400 });
            }
        }

        if (!openid) {
            return NextResponse.json({ error: 'Missing openid or code' }, { status: 400 });
        }

        const unifiedParams: Record<string, string | number | undefined> = {
            appid: WECHAT_APP_ID,
            mch_id: WECHAT_MCH_ID,
            nonce_str: generateNonce(),
            body: description || '商品支付',
            out_trade_no: outTradeNo || `ORDER_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            total_fee: totalFee,
            spbill_create_ip: '127.0.0.1',
            notify_url: WECHAT_NOTIFY_URL,
            trade_type: 'JSAPI',
            openid,
            attach: attachStr,
        };

        unifiedParams.sign = buildSign(unifiedParams);
        const xmlData = toXml(unifiedParams);

        const wxRes = await fetch('https://api.mch.weixin.qq.com/pay/unifiedorder', {
            method: 'POST',
            headers: { 'Content-Type': 'text/xml' },
            body: xmlData,
        });
        const wxText = await wxRes.text();
        const wxData = parseXml(wxText);

        if (wxData.return_code !== 'SUCCESS') {
            return NextResponse.json({ error: `WeChat Error: ${wxData.return_msg || 'unknown'}` }, { status: 400 });
        }
        if (wxData.result_code !== 'SUCCESS') {
            return NextResponse.json({ error: `Business Error: ${wxData.err_code_des || 'unknown'}` }, { status: 400 });
        }

        const prepayId = wxData.prepay_id;
        if (!prepayId) {
            return NextResponse.json({ error: 'No prepay_id returned' }, { status: 400 });
        }

        const payParams: Record<string, string> = {
            appId: WECHAT_APP_ID,
            timeStamp: `${Math.floor(Date.now() / 1000)}`,
            nonceStr: generateNonce(),
            package: `prepay_id=${prepayId}`,
            signType: 'MD5',
        };
        payParams.paySign = buildSign(payParams);

        return NextResponse.json(payParams);
    } catch (error: any) {
        console.error('WeChat pay error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
