
export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /

Sitemap: ${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/sitemap.xml
`);
}
