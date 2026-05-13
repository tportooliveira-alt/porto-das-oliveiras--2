/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'porto-das-oliveiras.ddev.site',
        pathname: '/sites/default/files/**',
      },
      {
        protocol: 'http',
        hostname: 'porto-das-oliveiras.ddev.site',
        pathname: '/sites/default/files/**',
      },
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
    ],
  },

  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000', 'porto-das-oliveiras.vercel.app'] },
  },

  poweredByHeader: false,

  /**
   * Headers de segurança aplicados globalmente.
   *
   * - HSTS: força HTTPS em produção (1 ano).
   * - X-Content-Type-Options: bloqueia MIME sniffing.
   * - X-Frame-Options: previne clickjacking.
   * - Referrer-Policy: não vaza referer entre origens.
   * - Permissions-Policy: nega APIs que o site não usa.
   * - Content-Security-Policy: restringe origens. Em dev, permite
   *   unsafe-inline e unsafe-eval pro hot-reload. Em prod, mais estrito.
   */
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    const csp = [
      "default-src 'self'",
      `script-src 'self' ${isProd ? "'unsafe-inline'" : "'unsafe-inline' 'unsafe-eval'"} https://www.google.com https://maps.googleapis.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https: http://porto-das-oliveiras.ddev.site",
      "media-src 'self' blob:",
      "frame-src 'self' https://www.google.com https://accounts.google.com https://login.microsoftonline.com",
      `connect-src 'self' ${isProd ? 'https://porto-das-oliveiras.ddev.site' : 'http://porto-das-oliveiras.ddev.site ws: wss:'} https://generativelanguage.googleapis.com https://maps.googleapis.com`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://accounts.google.com https://login.microsoftonline.com",
      "frame-ancestors 'none'",
      isProd && 'upgrade-insecure-requests',
    ].filter(Boolean).join('; ');

    const common = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options',         value: 'DENY' },
      { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' },
      { key: 'Content-Security-Policy', value: csp },
    ];

    if (isProd) {
      common.push({ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' });
    }

    return [
      {
        source: '/:path*',
        headers: common,
      },
    ];
  },
};

export default nextConfig;
