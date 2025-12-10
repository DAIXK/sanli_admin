import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Clean up numbers
        if (body.weight) body.weight = Number(body.weight);
        if (body.width) body.width = Number(body.width);
        if (body.goldWeight) body.goldWeight = Number(body.goldWeight);
        if (body.price) body.price = Number(body.price);
        if (body.processingFee) body.processingFee = Number(body.processingFee);
        if (body.extraPricingModes && !Array.isArray(body.extraPricingModes)) {
            body.extraPricingModes = [];
        }

        const updatedBead = await db.bead.update(id, body);

        if (!updatedBead) {
            return NextResponse.json({ error: 'Bead not found' }, { status: 404 });
        }

        return NextResponse.json(updatedBead);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await db.bead.delete(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
