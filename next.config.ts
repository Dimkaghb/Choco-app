import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  /* config options here */
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // experimental: {
  //   // Отключаем символические ссылки для решения проблем с кириллическими путями
  //   turbotrace: {
  //     logLevel: 'error'
  //   }
  // },
  // // Отключаем оптимизации, которые могут вызывать проблемы с путями
  // swcMinify: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
