/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '3001',
                pathname: '/uploads/**',
            },
        ],
    },
    // Adicione essa configuração para evitar problemas de hidratação
    reactStrictMode: true,
    swcMinify: true,
};

export default nextConfig;