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
    # Start a quick node HTTP server on port 3311
    /opt/alt/alt-nodejs20/root/usr/bin/node -e "
      const http = require('http');
      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('HELLO_FROM_NODE_BACKEND_PORT_3311');
      });
      server.listen(3311, '127.0.0.1', () => {
        console.log('NODE_RUNNING');
      });
      setTimeout(() => process.exit(0), 15000);
    " &
    NODE_PID=$!
    sleep 2

    # Put a proxy .htaccess in crm
    cat << 'EOF' > /home/u408450631/domains/ifleon.com/public_html/crm/.htaccess
RewriteEngine On
RewriteRule ^(.*)$ http://127.0.0.1:3311/$1 [P,L]
EOF

    # Test curl locally and via public domain
    echo "=== LOCAL CURL ==="
    curl -s http://127.0.0.1:3311/ || echo "Local curl failed"

    echo "=== PUBLIC CURL VIA CRM.IFLEON.COM ==="
    curl -s -i https://crm.ifleon.com/test-proxy || echo "Public curl failed"

    # Cleanup .htaccess and kill test node
    rm -f /home/u408450631/domains/ifleon.com/public_html/crm/.htaccess
    kill $NODE_PID 2>/dev/null || true
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
});

conn.connect(config);
