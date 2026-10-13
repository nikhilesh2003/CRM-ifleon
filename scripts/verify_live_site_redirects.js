const https = require('https');

const routes = [
  '/',
  '/leads',
  '/leads/',
  '/quotations/',
  '/tasks/',
  '/analytics/',
  '/admin/users',
  '/admin/settings',
  '/api/leads',
  '/api/auth',
  '/api/quotations',
  '/logo-dark-horizontal.png',
  '/logo-light-horizontal.png',
  '/leads/lead-1',
];

function fetchWithRedirect(url, maxRedirects = 3) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && maxRedirects > 0) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = `https://crm.ifleon.com${redirectUrl}`;
        }
        return resolve(fetchWithRedirect(redirectUrl, maxRedirects - 1));
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          contentType: res.headers['content-type'] || '',
          size: d.length,
        });
      });
    }).on('error', (err) => resolve({ error: err.message }));
  });
}

async function run() {
  console.log('Verifying routes on https://crm.ifleon.com (with redirect follow)...');
  for (const r of routes) {
    const res = await fetchWithRedirect(`https://crm.ifleon.com${r}`);
    console.log(`${r.padEnd(30)} => ${res.statusCode} (${res.contentType}, ${res.size} bytes)`);
  }
}

run();
