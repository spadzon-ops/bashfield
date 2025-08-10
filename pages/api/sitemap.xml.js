
export default async function handler(req, res) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const urls = [
    '',
    '/post',
    '/profile',
    '/messages',
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(u => `<url><loc>${base}${u}</loc></url>`).join('')}
</urlset>`;
  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
}
