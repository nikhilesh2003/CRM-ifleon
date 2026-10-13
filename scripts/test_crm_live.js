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
    /opt/alt/alt-nodejs20/root/usr/bin/node entry.js > crm.log 2>&1 &
    PID=$!
    sleep 2

    echo "=== PUBLIC CURL / ==="
    curl -s -i https://crm.ifleon.com/ | head -n 40

    echo "=== PUBLIC CURL /api/leads ==="
    curl -s -i https://crm.ifleon.com/api/leads
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
});

conn.connect(config);
