const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

const config = {
  host: '86.38.243.155',
  port: 65002,
  username: 'u408450631',
  password: 'Nikhil@1122Z',
  readyTimeout: 40000,
};

const localArchive = path.join(__dirname, '..', 'standalone.tar.gz');
const remoteTargetDir = '/home/u408450631/domains/ifleon.com/public_html/crm';
const remoteArchive = remoteTargetDir + '/standalone.tar.gz';

console.log('Connecting to SSH server...');

conn.on('ready', () => {
  console.log('SSH connection established!');

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP Error:', err);
      conn.end();
      return;
    }

    console.log('SFTP connected! Uploading standalone.tar.gz (' + (fs.statSync(localArchive).size / 1024 / 1024).toFixed(2) + ' MB)...');

    sftp.fastPut(localArchive, remoteArchive, (uploadErr) => {
      if (uploadErr) {
        console.error('Upload Error:', uploadErr);
        conn.end();
        return;
      }
      console.log('Upload complete! Extracting on remote server...');

      const deployCmd = `
        cd ${remoteTargetDir}

        # Backup default.php if present
        [ -f default.php ] && mv default.php default.php.bak

        # Extract archive
        tar -xzf standalone.tar.gz
        rm -f standalone.tar.gz

        # Kill any prior node crm process
        pkill -f "entry.js" 2>/dev/null || true
        rm -f crm.sock

        # Create entry.js
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

// Keep process running
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled Rejection:', err));
EOF

        # Create PHP Gateway with auto-start
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
    for ($i = 0; $i < 30; $i++) {
        usleep(100000); // 100ms
        if (file_exists($sock)) break;
    }
}

if (!file_exists($sock)) {
    http_response_code(503);
    echo "CRM Service starting up... Please refresh in a moment.";
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
    unlink($sock);
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

        # Create .htaccess for LiteSpeed routing
        cat << 'EOF' > .htaccess
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Serve existing static files directly
  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]

  # Route everything else to the index.php gateway
  RewriteRule ^ index.php [QSA,L]
</IfModule>
EOF

        # Start backend daemon
        nohup /opt/alt/alt-nodejs20/root/usr/bin/node ${remoteTargetDir}/entry.js > ${remoteTargetDir}/crm.log 2>&1 &
        sleep 3

        echo "=== CHECKING BACKEND STATUS ==="
        ls -la crm.sock || echo "crm.sock not yet created"
        cat crm.log | tail -n 10 || true

        echo "=== PUBLIC HEALTH CHECK ==="
        curl -s -i https://crm.ifleon.com/ | head -n 30
      `;

      conn.exec(deployCmd, (execErr, stream) => {
        if (execErr) {
          console.error('Exec error:', execErr);
          conn.end();
          return;
        }

        stream.on('close', (code) => {
          console.log(`Deployment script finished with exit code ${code}`);
          conn.end();
        });

        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
      });
    });
  });
});

conn.on('error', (err) => console.error('SSH Error:', err));
conn.connect(config);
