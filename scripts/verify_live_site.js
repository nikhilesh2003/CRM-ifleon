const https = require('https');

const routes = [
  '/',
  '/leads',
  '/quotations',
  '/tasks',
  '/analytics',
  '/admin/users',
  '/admin/settings',
  '/api/leads',
  '/api/quotations',
  '/logo-dark-horizontal.png',
  '/logo-light-horizontal.png',
];

async function checkRoute(route) {
  return new Promise((resolve) => {
    const url = `https://crm.ifleon.com${route}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        resolve({
          route,
          status: res.statusCode,
          contentType: res.headers['content-type'] || '',
          size: data.length,
          cache: res.headers['x-hcdn-cache-status'] || '',
        });
      });
    }).on('error', (err) => {
      resolve({ route, error: err.message });
    });
  });
}

async function run() {
  console.log('Testing live CRM at https://crm.ifleon.com ...');
  for (const r of routes) {
    const res = await checkRoute(r);
    console.log(`${res.route.padEnd(30)} => ${res.status || 'ERROR'} (${res.contentType}, ${res.size} bytes)`);
  }
}

run();
