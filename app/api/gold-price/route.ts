import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const goldPrice = await db.goldPrice.get();
        return NextResponse.json(goldPrice);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { price } = body;

        if (typeof price !== 'number') {
            return NextResponse.json({ error: 'Price must be a number' }, { status: 400 });
        }

        const updatedPrice = await db.goldPrice.update(price);
        return NextResponse.json(updatedPrice);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
