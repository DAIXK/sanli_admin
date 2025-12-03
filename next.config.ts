import type { NextConfig } from "next";

const publicDomain = process.env.ALIYUN_OSS_PUBLIC_DOMAIN
  || (process.env.ALIYUN_OSS_BUCKET && process.env.ALIYUN_OSS_REGION
    ? `https://${process.env.ALIYUN_OSS_BUCKET}.${process.env.ALIYUN_OSS_REGION}.aliyuncs.com`
    : undefined);

const remotePatterns = [];
if (publicDomain) {
  try {
    const parsed = new URL(publicDomain);
    const protocol = parsed.protocol === 'http:' ? 'http' : 'https';
    remotePatterns.push({
      protocol,
      hostname: parsed.hostname,
    });
  } catch (e) {
    // Ignore invalid URL; image optimization will stay disabled for OSS domain
  }
}

const nextConfig: NextConfig = {
  images: remotePatterns.length > 0 ? { remotePatterns } : undefined,
};

export default nextConfig;
