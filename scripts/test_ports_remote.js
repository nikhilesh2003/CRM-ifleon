const { Client } = require('ssh2');

const conn = new Client();

const config = {
  host: '86.38.243.155',
  port: 65002,
  username: 'u408450631',
  password: 'Nikhil@1122Z',
};

conn.on('ready', () => {
  const cmd = `
    # Test ports 3000, 8080, 8000
    /opt/alt/alt-nodejs20/root/usr/bin/node -e "
      const http = require('http');
      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('PORT_3000_OK');
      });
      server.listen(3000, '127.0.0.1', () => {
        console.log('LISTEN_3000');
      });
      setTimeout(() => process.exit(0), 10000);
    " &
    PID=$!
    sleep 2
    echo "=== CURL 3000 ==="
    curl -s http://127.0.0.1:3000/ || echo "Curl 3000 failed"
    kill $PID 2>/dev/null || true
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
});

conn.connect(config);
