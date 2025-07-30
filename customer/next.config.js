const nextTranslate = require("next-translate-plugin");

// const withPWA = require("next-pwa")({
//   dest: "public",
//   register: true,
//   runtimeCaching,
//   buildExcludes: [/middleware-manifest\.json$/, /src\/components\/offer\/ComboDeals\.js$/],
//   scope: "/",
//   sw: "service-worker.js",
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === "development",
// });

// Log the API base URL during build
console.log("API Base URL:", process.env.NEXT_PUBLIC_API_BASE_URL || "https://e-commerce-backend-l0s0.onrender.com/api");

module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  
  poweredByHeader: false,
  generateEtags: true,
  
  compress: true,
  
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://e-commerce-backend-l0s0.onrender.com/api",
    CUSTOM_NODE_ENV: process.env.NODE_ENV,
  },
  
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  i18n: {
    // These are all the locales you want to support in
    // your application
    locales: ["en", "ar"],
    // This is the default locale you want to be used when visiting
    // a non-locale prefixed path e.g. `/hello`
    defaultLocale: "en",
    // Disable automatic locale detection to prevent browser language override
    localeDetection: false,
    // This is a list of locale domains and the default locale they
    // should handle (these are only required when setting up domain routing)
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  webpack: (config, { dev, isServer, webpack, nextRuntime }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            name: 'commons',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
      
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          })
        );
      }
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };

    return config;
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://e-commerce-backend-l0s0.onrender.com/api'}/:path*`,
      },
    ];
  },

  async redirects() {
    return [
      // Add any redirects here for better SEO
    ];
  },

  experimental: {
    esmExternals: true,
    serverComponentsExternalPackages: ['mongoose'],
    // optimizeCss: true,  // Temporarily disabled due to critters compatibility issues
    forceSwcTransforms: true,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  ...nextTranslate(),
};

// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: process.env.ANALYZE === 'true',
// });

// module.exports = withBundleAnalyzer({});
