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
    cd /home/u408450631/domains/ifleon.com/public_html/crm

    # Write entry.js
    cat << 'EOF' > entry.js
const path = require('path');
const fs = require('fs');
const http = require('http');

process.env.NODE_ENV = 'production';
process.chdir(__dirname);

const socketPath = path.join(__dirname, 'crm.sock');
if (fs.existsSync(socketPath)) {
  try { fs.unlinkSync(socketPath); } catch (e) {}
}

const serverJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
const configMatch = serverJs.match(/const nextConfig = (\\{.*?\\})\\r?\\n/);
const nextConfig = JSON.parse(configMatch[1]);
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

const NextServer = require('next/dist/server/next-server').default;
const app = new NextServer({
  hostname: 'localhost',
  port: 3000,
  dir: __dirname,
  dev: false,
  customServer: false,
  conf: nextConfig,
});

const handler = app.getRequestHandler();

const server = http.createServer((req, res) => {
  handler(req, res);
});

server.listen(socketPath, () => {
  try { fs.chmodSync(socketPath, 0o777); } catch (e) {}
  console.log('Next.js CRM Server listening on UNIX socket:', socketPath);
});

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled Rejection:', err));
EOF

    # Write index.php
    cat << 'EOF' > index.php
<?php
$sock = __DIR__ . '/crm.sock';

function start_backend() {
    $nodeBin = '/opt/alt/alt-nodejs20/root/usr/bin/node';
    if (!file_exists($nodeBin)) {
        $nodeBin = 'node';
    }
    $cmd = "nohup " . $nodeBin . " " . __DIR__ . "/entry.js > " . __DIR__ . "/crm.log 2>&1 &";
    shell_exec($cmd);
}

if (!file_exists($sock)) {
    start_backend();
    for ($i = 0; $i < 35; $i++) {
        usleep(100000); // 100ms
        if (file_exists($sock)) break;
    }
}

if (!file_exists($sock)) {
    http_response_code(503);
    echo "CRM Service starting up... Please reload in a few seconds.";
    exit;
}

$ch = curl_init('http://localhost' . $_SERVER['REQUEST_URI']);
curl_setopt($ch, CURLOPT_UNIX_SOCKET_PATH, $sock);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);

$headers = [];
foreach (getallheaders() as $name => $value) {
    if (strtolower($name) !== 'host') {
        $headers[] = "$name: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    $input = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

curl_setopt($ch, CURLOPT_HEADER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);

if ($response === false) {
    @unlink($sock);
    start_backend();
    http_response_code(502);
    echo "CRM backend restarted. Please reload.";
    exit;
}
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

    # Write .htaccess
    cat << 'EOF' > .htaccess
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Serve existing static files directly from LiteSpeed
  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]

  # Route everything else to the index.php gateway
  RewriteRule ^ index.php [QSA,L]
</IfModule>
EOF

    # Kill prior node and launch entry.js
    pkill -f "entry.js" 2>/dev/null || true
    rm -f crm.sock crm.log
    nohup /opt/alt/alt-nodejs20/root/usr/bin/node /home/u408450631/domains/ifleon.com/public_html/crm/entry.js > /home/u408450631/domains/ifleon.com/public_html/crm/crm.log 2>&1 &
    sleep 3

    echo "=== SOCKET CHECK ==="
    ls -la crm.sock || echo "No crm.sock found"

    echo "=== LOG CHECK ==="
    cat crm.log || echo "No log content"

    echo "=== CURL CRM.IFLEON.COM ==="
    curl -s -i https://crm.ifleon.com/ | head -n 35
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
});

conn.connect(config);
