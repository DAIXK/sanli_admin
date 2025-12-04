import { NextResponse } from 'next/server';

const { WECHAT_APP_ID, WECHAT_APP_SECRET } = process.env;

function ensureConfig() {
    if (!WECHAT_APP_ID || !WECHAT_APP_SECRET) {
        throw new Error('Missing WECHAT_APP_ID/WECHAT_APP_SECRET');
    }
}

export async function GET(request: Request) {
    try {
        ensureConfig();
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'Missing code' }, { status: 400 });
        }

        const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}&js_code=${code}&grant_type=authorization_code`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.openid) {
            return NextResponse.json({
                openid: data.openid,
                session_key: data.session_key,
                unionid: data.unionid,
            });
        }

        return NextResponse.json({ error: data.errmsg || 'Failed to get openid' }, { status: 400 });
    } catch (error: any) {
        console.error('Get openid error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
