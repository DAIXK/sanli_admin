import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { uploadToOSS } from '@/lib/oss';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = file.name.replace(/\s+/g, '_');
        const objectKey = `uploads/${Date.now()}_${safeName}`;
        const result = await uploadToOSS(buffer, objectKey, file.type);

        return NextResponse.json({ success: true, url: result.url, path: result.objectKey });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
