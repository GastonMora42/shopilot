/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'storage.googleapis.com',
      'storage.cloud.google.com']
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  async redirects() {
    return []  // Ya no necesitamos redirecciones ya que las rutas son públicas
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Cualquier rewrite que necesites
      ],
      afterFiles: [
        // Reescribir rutas después de que Next.js busque archivos
      ],
      fallback: []
    }
  },
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL
  },
  // Optimizaciones para producción
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig