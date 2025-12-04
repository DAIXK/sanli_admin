import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ROTATION_KEY_MAP: Record<string, 'RADIAL_ROTATION' | 'NORMAL_ROTATION' | null> = {
    radial: 'RADIAL_ROTATION',
    normal: 'NORMAL_ROTATION',
    tangent: null,
};

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tabs = await db.tab.findMany();
        const tab = tabs.find((t) => t.id === id);

        if (!tab) {
            return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
        }

        const beads = await db.bead.findMany();
        const products = beads
            .filter((b) => b.tabId === id && b.isVisible !== false)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((bead) => ({
                glb: bead.model,
                name: bead.name,
                weight: bead.weight,
                width: bead.width ? `${bead.width}mm` : '',
                price: bead.price,
                type: bead.hasGold ? 'gold' : 'normal',
                rotation: ROTATION_KEY_MAP[bead.orientation] ?? null,
                rotationAxis: bead.orientation || 'radial',
                png: bead.image,
            }));

        const detail = {
            price: '-',
            name: tab.name,
            background: [
                {
                    glb: tab.model,
                    name: tab.name,
                    length: tab.maxBeads || 0,
                    max: tab.maxBeads || 0,
                },
            ],
            product: products,
        };

        return NextResponse.json(detail);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
