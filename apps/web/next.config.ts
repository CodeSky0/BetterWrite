import type { NextConfig } from 'next';

const securityHeaders = [
  // 强制 HTTPS（1年，含子域名）
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // 禁止被嵌入 iframe，防止点击劫持
  { key: 'X-Frame-Options', value: 'DENY' },
  // 阻止 MIME 嗅探
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // 仅同源引用
  { key: 'Referrer-Policy', value: 'same-origin' },
  // 禁用不需要的浏览器特性
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  // 内容安全策略：默认同源；允许内联样式（Tailwind 需要）与必要的外部资源
  // Next.js 16 + Turbopack 的 RSC 流式传输、客户端水合与 Flight 数据均依赖内联 <script>
  // （每个请求的 payload 不同，无法预计算 hash），因此 script-src 必须包含 'unsafe-inline'。
  // 若需更严格的 CSP，可考虑：① 关闭 Turbopack 的 RSC 流式传输；② 在 middleware 中
  // 生成 nonce 并注入 HTML（需等待 Next.js 官方 nonce 支持）。
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  // Vercel 有自己的构建系统，不需要 standalone；Docker 部署需要 standalone 输出
  output: process.env.VERCEL ? undefined : 'standalone',
  poweredByHeader: false,
  compress: true,
  transpilePackages: [
    '@betterwrite/shared',
    '@betterwrite/db',
    '@betterwrite/ai',
    '@betterwrite/design-system',
    '@betterwrite/worker',
  ],
  typedRoutes: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
