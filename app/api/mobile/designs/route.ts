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

function sanitizeData(data: any): any {
    if (typeof data === 'string') {
        // Replace -internal in strings (e.g. oss-cn-shenzhen-internal.aliyuncs.com -> oss-cn-shenzhen.aliyuncs.com)
        return data.replace(/-internal/g, '');
    }
    if (Array.isArray(data)) {
        return data.map(sanitizeData);
    }
    if (typeof data === 'object' && data !== null) {
        const result: any = {};
        for (const key in data) {
            result[key] = sanitizeData(data[key]);
        }
        return result;
    }
    return data;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const openidParam = searchParams.get('openid') || undefined;
        const code = searchParams.get('code') || undefined;

        let openid = openidParam;
        if (!openid && code) {
            openid = await codeToOpenId(code);
        }

        if (!openid) {
            return NextResponse.json({ code: 400, error: 'Missing openid or code' }, { status: 400 });
        }

        const designs = await db.design.findMany({ openid });
        const sanitizedDesigns = designs.map(d => ({
            ...d,
            payload: sanitizeData(d.payload),
        }));
        return NextResponse.json({ code: 0, success: true, data: sanitizedDesigns });
    } catch (error: any) {
        console.error('Get designs error:', error);
        return NextResponse.json({ code: 500, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, openid: openidRaw, ...payload } = body || {};

        let openid = openidRaw as string | undefined;
        if (!openid && code) {
            openid = await codeToOpenId(code);
        }

        if (!openid) {
            return NextResponse.json({ code: 400, error: 'Missing openid or code' }, { status: 400 });
        }

        const design = await db.design.create({ openid, payload });
        return NextResponse.json({ code: 0, success: true, data: design });
    } catch (error: any) {
        console.error('Save design error:', error);
        return NextResponse.json({ code: 500, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
