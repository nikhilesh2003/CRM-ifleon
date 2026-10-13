const { spawn } = require('child_process');
const http = require('http');

const env = Object.assign({}, process.env, { PORT: '3999' });
const proc = spawn('node', ['.next/standalone/runner.js'], { env, stdio: 'pipe' });

proc.stdout.on('data', (d) => console.log('STDOUT:', d.toString().trim()));
proc.stderr.on('data', (d) => console.error('STDERR:', d.toString().trim()));

setTimeout(() => {
  http.get('http://localhost:3999/api/leads', (res) => {
    let body = '';
    res.on('data', (c) => body += c);
    res.on('end', () => {
      console.log('HTTP STATUS:', res.statusCode);
      const json = JSON.parse(body);
      console.log('LEADS COUNT:', json.leads ? json.leads.length : 'none');
      proc.kill();
      process.exit(0);
    });
  }).on('error', (err) => {
    console.error('HTTP GET ERROR:', err);
    proc.kill();
    process.exit(1);
  });
}, 2500);
