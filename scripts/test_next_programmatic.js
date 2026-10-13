const path = require('path');
const fs = require('fs');
const http = require('http');

const standaloneDir = path.join(__dirname, '..', '.next', 'standalone');
process.env.NODE_ENV = 'production';
process.chdir(standaloneDir);

const serverJs = fs.readFileSync(path.join(standaloneDir, 'server.js'), 'utf8');
const configMatch = serverJs.match(/const nextConfig = (\{.*?\})\r?\n/);
const nextConfig = JSON.parse(configMatch[1]);
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

const { startServer } = require(path.join(standaloneDir, 'node_modules', 'next', 'dist', 'server', 'lib', 'start-server'));

const testPort = 3888;

startServer({
  dir: standaloneDir,
  isDev: false,
  config: nextConfig,
  hostname: '127.0.0.1',
  port: testPort,
  allowRetry: false,
}).then(() => {
  console.log('NEXT_SERVER_STARTED_ON_PORT', testPort);
  setTimeout(() => {
    http.get(`http://127.0.0.1:${testPort}/api/leads`, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        const json = JSON.parse(d);
        console.log('LEADS:', json.leads ? json.leads.length : 0);
        process.exit(0);
      });
    }).on('error', (e) => {
      console.error('HTTP ERROR:', e);
      process.exit(1);
    });
  }, 1000);
}).catch(e => {
  console.error('CATCH:', e);
  process.exit(1);
});
