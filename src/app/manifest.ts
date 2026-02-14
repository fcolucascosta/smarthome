import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Smart Life Controller',
        short_name: 'Smart Control',
        description: 'Control your smart home devices',
        start_url: '/',
        display: 'standalone',
        background_color: '#111318',
        theme_color: '#111318',
        icons: [
            {
                src: '/icon.svg',
                sizes: '192x192 512x512',
                type: 'image/svg+xml',
            },
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
        ],
    };
}
