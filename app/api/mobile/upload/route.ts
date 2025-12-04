import { NextResponse } from 'next/server';
import { uploadToOSS } from '@/lib/oss';

const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
];

function isImageFile(file: File) {
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) return true;
    const lower = file.name.toLowerCase();
    return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp') || lower.endsWith('.gif') || lower.endsWith('.heic');
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            console.warn('[mobile-upload] missing file field');
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        if (!isImageFile(file)) {
            console.warn('[mobile-upload] invalid file type', {
                name: file.name,
                type: file.type,
                size: file.size,
            });
            return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = file.name.replace(/\s+/g, '_');
        const objectKey = `images/${Date.now()}_${safeName}`;
        const result = await uploadToOSS(buffer, objectKey, file.type);

        console.info('[mobile-upload] upload success', {
            name: file.name,
            type: file.type,
            size: file.size,
            objectKey: result.objectKey,
        });

        return NextResponse.json({ success: true, url: result.url, path: result.objectKey });
    } catch (error) {
        console.error('Image upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
