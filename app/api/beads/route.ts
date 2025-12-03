import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const beads = await db.bead.findMany();
        return NextResponse.json(beads);
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
        const { name, image, model, weight, width, material, orientation, hasGold, goldWeight, price, processingFee, tabId, isVisible } = body;

        if (!name || !tabId) {
            return NextResponse.json({ error: 'Name and Tab are required' }, { status: 400 });
        }

        const newBead = await db.bead.create({
            name,
            image: image || '',
            model: model || '',
            weight: Number(weight) || 0,
            width: Number(width) || 0,
            material: material || '',
            orientation: orientation || 'center',
            hasGold: !!hasGold,
            goldWeight: Number(goldWeight) || 0,
            price: Number(price) || 0,
            processingFee: Number(processingFee) || 0,
            tabId,
            isVisible: isVisible ?? true,
        });

        return NextResponse.json(newBead);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
