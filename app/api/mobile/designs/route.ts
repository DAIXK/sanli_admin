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

        let openid = openidParam;
        if (!openid && code) {
            openid = await codeToOpenId(code);
        }

        if (!openid) {
            return NextResponse.json({ code: 400, error: 'Missing openid or code' }, { status: 400 });
        }

        const designs = await db.design.findMany({ openid });
        return NextResponse.json({ code: 0, success: true, data: designs });
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
