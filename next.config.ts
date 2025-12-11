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

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  images: { remotePatterns },
  // 支持按子路径部署（例如 /sanli-panel）
  ...(basePath ? { basePath } : {}),
  trailingSlash: true,
  webpack: (config) => {
    // Aliyun OSS dependencies optionally require coffee-script; keep it external to avoid bundling issues.
    if (Array.isArray(config.externals)) {
      config.externals.push("coffee-script");
    } else if (config.externals === undefined) {
      config.externals = ["coffee-script"];
    }
    return config;
  },
};

export default nextConfig;
