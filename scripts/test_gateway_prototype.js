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
    CRM_DIR="/home/u408450631/domains/ifleon.com/public_html/crm"
    SOCK="$CRM_DIR/crm.sock"
    rm -f $SOCK

    # Start Node server listening on UNIX socket
    /opt/alt/alt-nodejs20/root/usr/bin/node -e "
      const http = require('http');
      const fs = require('fs');
      if (fs.existsSync('$SOCK')) fs.unlinkSync('$SOCK');
      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', msg: 'NEXTJS_PHP_GATEWAY_SUCCESS', path: req.url }));
      });
      server.listen('$SOCK', () => {
        fs.chmodSync('$SOCK', 0o777);
        console.log('NODE_SOCK_READY');
      });
      setTimeout(() => process.exit(0), 15000);
    " &
    PID=$!
    sleep 2

    # Create PHP gateway
    cat << 'EOF' > $CRM_DIR/index.php
<?php
$sock = __DIR__ . '/crm.sock';
if (!file_exists($sock)) {
    http_response_code(503);
    echo "CRM backend service starting up...";
    exit;
}

$ch = curl_init('http://localhost' . $_SERVER['REQUEST_URI']);
curl_setopt($ch, CURLOPT_UNIX_SOCKET_PATH, $sock);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);

$headers = [];
foreach (getallheaders() as $name => $value) {
    if (strtolower($name) !== 'host') {
        $headers[] = "$name: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
    $input = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

curl_setopt($ch, CURLOPT_HEADER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

$headerStr = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

http_response_code($httpCode);
foreach (explode("\r\n", $headerStr) as $line) {
    if (!empty($line) && !preg_match('/^Transfer-Encoding:/i', $line) && !preg_match('/^HTTP\//i', $line)) {
        header($line, false);
    }
}
echo $body;
EOF

    # Configure .htaccess to route all paths to index.php
    cat << 'EOF' > $CRM_DIR/.htaccess
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^ index.php [QSA,L]
</IfModule>
EOF

    echo "=== PUBLIC CURL TO HTTPS://CRM.IFLEON.COM/ ==="
    curl -s -i https://crm.ifleon.com/
    echo ""
    echo "=== PUBLIC CURL TO HTTPS://CRM.IFLEON.COM/API/TEST ==="
    curl -s -i https://crm.ifleon.com/api/test

    # Cleanup test files
    rm -f $CRM_DIR/index.php $CRM_DIR/.htaccess $CRM_DIR/crm.sock
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
