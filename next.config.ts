import type { NextConfig } from "next";

const publicDomain = process.env.ALIYUN_OSS_PUBLIC_DOMAIN
  || (process.env.ALIYUN_OSS_BUCKET && process.env.ALIYUN_OSS_REGION
    ? `https://${process.env.ALIYUN_OSS_BUCKET}.${process.env.ALIYUN_OSS_REGION}.aliyuncs.com`
    : undefined);

const remotePatterns: { protocol: 'http' | 'https'; hostname: string }[] = [];
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

// Fallback: allow直接访问常见 OSS 域名（本项目使用的 sanli-access bucket）
remotePatterns.push({
  protocol: 'https',
  hostname: 'sanli-access.oss-cn-shenzhen.aliyuncs.com',
});

const nextConfig: NextConfig = {
  images: { remotePatterns },
};

export default nextConfig;
