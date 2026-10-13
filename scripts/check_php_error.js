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
    echo "=== PHP LINT ==="
    php -l index.php
    echo "=== PHP EXEC DIRECTLY ==="
    REQUEST_URI="/" REQUEST_METHOD="GET" php index.php || true
    echo "=== TAIL ERROR LOG ==="
    tail -n 20 error_log 2>/dev/null || tail -n 20 /home/u408450631/error_log 2>/dev/null || echo "no error log"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
});

conn.connect(config);
