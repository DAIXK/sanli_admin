import { NextResponse } from 'next/server';
import { uploadToOSS } from '@/lib/oss';

const ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/webm',
];

function isVideoFile(file: File) {
    if (ALLOWED_VIDEO_TYPES.includes(file.type)) return true;
    const lower = file.name.toLowerCase();
    return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.avi') || lower.endsWith('.mkv') || lower.endsWith('.webm');
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            console.warn('[upload-video] missing file field');
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        if (!isVideoFile(file)) {
            console.warn('[upload-video] invalid file type', {
                name: file.name,
                type: file.type,
                size: file.size,
            });
            return NextResponse.json({ error: 'Only video files are allowed' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = file.name.replace(/\s+/g, '_');
        const objectKey = `videos/${Date.now()}_${safeName}`;
        const result = await uploadToOSS(buffer, objectKey, file.type);

        console.info('[upload-video] upload success', {
            name: file.name,
            type: file.type,
            size: file.size,
            objectKey: result.objectKey,
        });

        return NextResponse.json({ success: true, url: result.url, path: result.objectKey });
    } catch (error) {
        console.error('Video upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
