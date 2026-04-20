/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  pageExtensions: ['js', 'jsx'],
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
  // Rewrite requests to API routes
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        },
      ],
    };
  },
  // Redirect old single-file routes to new structure
  async redirects() {
    return [
      {
        source: '/signinorup.html',
        destination: '/signin',
        permanent: true,
      },
      {
        source: '/profile.html',
        destination: '/profile',
        permanent: true,
      },
      {
        source: '/settings.html',
        destination: '/settings',
        permanent: true,
      },
      {
        source: '/shop.html',
        destination: '/shop',
        permanent: true,
      },
      {
        source: '/about.html',
        destination: '/about',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
