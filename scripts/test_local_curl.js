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
    /opt/alt/alt-nodejs20/root/usr/bin/node -e "
      const http = require('http');
      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('NODE_PORT_TEST_OK');
      });
      server.listen(41234, '0.0.0.0', () => {
        console.log('LISTENING_ON_41234');
      });
      setTimeout(() => process.exit(0), 10000);
    " &
    PID=$!
    sleep 2
    echo "=== NETSTAT / SS ==="
    ss -tulpn 2>/dev/null | grep 41234 || netstat -tulpn 2>/dev/null | grep 41234 || echo "ss/netstat restricted"
    echo "=== CURL VERBOSE ==="
    curl -v http://127.0.0.1:41234/ 2>&1
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
