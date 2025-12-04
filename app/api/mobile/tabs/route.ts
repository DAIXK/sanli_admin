import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const tabs = await db.tab.findMany();
        // 只返回可见分类
        const visibleTabs = tabs.filter((tab) => tab.isVisible !== false);
        return NextResponse.json(visibleTabs);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
