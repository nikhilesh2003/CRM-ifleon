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
    SOCK=/home/u408450631/domains/ifleon.com/public_html/crm/test.sock
    rm -f $SOCK
    /opt/alt/alt-nodejs20/root/usr/bin/node -e "
      const http = require('http');
      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('UNIX_SOCKET_TEST_SUCCESS');
      });
      server.listen('$SOCK', () => {
        console.log('SOCKET_LISTENING');
      });
      setTimeout(() => process.exit(0), 10000);
    " &
    PID=$!
    sleep 2
    echo "=== CURL VIA UNIX DOMAIN SOCKET ==="
    curl -s --unix-socket $SOCK http://localhost/ || echo "Curl unix-socket failed"
    kill $PID 2>/dev/null || true
    rm -f $SOCK
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
});

conn.connect(config);
