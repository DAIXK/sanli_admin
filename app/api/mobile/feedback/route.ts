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
        const { content, contact, openid: openidRaw, code } = body || {};

        if (!content || typeof content !== 'string' || !content.trim()) {
            return NextResponse.json({ code: 400, error: '内容不能为空' }, { status: 400 });
        }

        let openid = openidRaw as string | undefined;
        if (!openid && code) {
            try {
                openid = await codeToOpenId(code);
            } catch (err) {
                // 忽略 openid 获取失败，允许匿名
                console.warn('feedback get openid failed', err);
            }
        }

        const saved = await db.feedback.create({
            content: content.trim(),
            contact: contact?.trim?.() || null,
            openid: openid || null,
        });

        return NextResponse.json({ code: 0, success: true, data: saved });
    } catch (error: any) {
        console.error('Create feedback error:', error);
        return NextResponse.json({ code: 500, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
