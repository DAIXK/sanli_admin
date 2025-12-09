import { NextResponse } from 'next/server';

export async function GET() {
    const windowDays = Number(process.env.AFTER_SALE_WINDOW_DAYS || 7);
    return NextResponse.json({
        code: 0,
        success: true,
        data: {
            windowDays,
        },
    });
}
