export default function manifest() {
  return {
    name: 'IYF We Can Academy',
    short_name: 'IYF Academy',
    description: 'Book your practical driving sessions easily',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#1e3a8a',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
