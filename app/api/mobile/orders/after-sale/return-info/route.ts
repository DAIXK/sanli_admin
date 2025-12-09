import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    const info = await db.afterSaleReturnInfo.get();
    return NextResponse.json({
        code: 0,
        success: true,
        data: info,
    });
}
