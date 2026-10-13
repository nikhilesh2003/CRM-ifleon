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
    echo "=== CHECKING /opt/alt/alt-nodejs ==="
    ls -d /opt/alt/alt-nodejs* 2>/dev/null || echo "No alt-nodejs in /opt"

    echo "=== CHECKING USER HOME ==="
    ls -la /home/u408450631/

    echo "=== CHECKING CRONTAB / PROCESSES ==="
    ps aux | grep -v "ps aux" | head -n 20

    echo "=== CHECKING CRM DIR DEFAULT.PHP ==="
    head -n 20 /home/u408450631/domains/ifleon.com/public_html/crm/default.php

    echo "=== CHECKING CURL TO CRM.IFLEON.COM ==="
    curl -I -s http://crm.ifleon.com || echo "Curl failed"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
});

conn.connect(config);
