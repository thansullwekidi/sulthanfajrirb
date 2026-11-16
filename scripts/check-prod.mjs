const urls = [
  'https://sulthanfajrirb.vercel.app/',
  'https://sulthanfajrirb.vercel.app/cv',
  'https://sulthanfajrirb.vercel.app/kontak',
];

for (const url of urls) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    console.log(`\n=== ${url} [${res.status}] ===`);
    // Find error snippets
    const bodyEnd = html.slice(-800);
    console.log('HTML tail:', bodyEnd);
  } catch (e) {
    console.error(url, e.message);
  }
}
