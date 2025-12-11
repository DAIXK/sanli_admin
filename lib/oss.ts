import OSS from 'ali-oss';

const {
    ALIYUN_OSS_REGION,
    ALIYUN_OSS_ACCESS_KEY_ID,
    ALIYUN_OSS_ACCESS_KEY_SECRET,
    ALIYUN_OSS_BUCKET,
    ALIYUN_OSS_PUBLIC_DOMAIN,
    ALIYUN_OSS_INTERNAL,
} = process.env;

function ensureConfig() {
    if (!ALIYUN_OSS_REGION || !ALIYUN_OSS_ACCESS_KEY_ID || !ALIYUN_OSS_ACCESS_KEY_SECRET || !ALIYUN_OSS_BUCKET) {
        throw new Error('Missing Aliyun OSS config. Please set ALIYUN_OSS_REGION, ALIYUN_OSS_ACCESS_KEY_ID, ALIYUN_OSS_ACCESS_KEY_SECRET and ALIYUN_OSS_BUCKET.');
    }
}

function createClient() {
    ensureConfig();
    return new OSS({
        region: ALIYUN_OSS_REGION as string,
        accessKeyId: ALIYUN_OSS_ACCESS_KEY_ID as string,
        accessKeySecret: ALIYUN_OSS_ACCESS_KEY_SECRET as string,
        bucket: ALIYUN_OSS_BUCKET as string,
        secure: true,
        // 如果是在阿里云 ECS 上运行，开启 internal 可以走内网，节省流量并加速
        internal: process.env.ALIYUN_OSS_INTERNAL === 'true',
    });
}

function buildPublicUrl(objectKey: string, fallbackUrl?: string) {
    const normalizedKey = objectKey.replace(/^\/+/, '');
    if (ALIYUN_OSS_PUBLIC_DOMAIN) {
        const domain = ALIYUN_OSS_PUBLIC_DOMAIN.replace(/\/+$/, '');
        return `${domain}/${normalizedKey}`;
    }

    if (fallbackUrl) {
        return fallbackUrl.replace('http://', 'https://');
    }

    if (ALIYUN_OSS_BUCKET && ALIYUN_OSS_REGION) {
        return `https://${ALIYUN_OSS_BUCKET}.${ALIYUN_OSS_REGION}.aliyuncs.com/${normalizedKey}`;
    }

    return normalizedKey;
}

export async function uploadToOSS(buffer: Buffer, objectKey: string, mimeType?: string) {
    const client = createClient();
    const key = objectKey.replace(/^\/+/, '');

    const { url } = await client.put(key, buffer, mimeType ? { mime: mimeType } : undefined);

    return {
        objectKey: key,
        url: buildPublicUrl(key, url),
    };
}
