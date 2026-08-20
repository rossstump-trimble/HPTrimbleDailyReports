/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add transpilePackages configuration for Three.js
  transpilePackages: ["three"],

  // Add these optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Enable webpack optimization
  webpack: (config, { dev, isServer }) => {
    // Configure the resolver to handle Three.js imports
    config.resolve.alias = {
      ...config.resolve.alias,
      // This is important for handling the three.js modules correctly
      three: require.resolve("three"),
    };

    // Properly transpile the Three.js examples
    config.module.rules.push({
      test: /\.(js|mjs|jsx|ts|tsx)$/,
      include: [/node_modules\/three\/examples/],
      use: {
        loader: "babel-loader",
        options: {
          presets: ["next/babel"],
          plugins: [],
        },
      },
    });

    // Handle SVG files
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack", "url-loader"],
    });

    // Let Next.js manage its own chunk splitting defaults

    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },

  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Ensure static assets are properly handled
  assetPrefix: process.env.NODE_ENV === "production" ? undefined : undefined,

  // Redirect /mobile → /mobile/signin at the HTTP level (reliable on Vercel)
  async redirects() {
    return [
      {
        source: "/mobile",
        destination: "/mobile/signin",
        permanent: false,
      },
    ];
  },

  // Configure headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type",
          },
        ],
      },
      {
        source: "/_next/static/css/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Image config
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "liveblocks.io",
        pathname: "/avatars/**",
      },
    ],
  },
};

module.exports = nextConfig;
