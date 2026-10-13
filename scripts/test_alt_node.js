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
    echo "=== NODE VERSION ==="
    /opt/alt/alt-nodejs20/root/usr/bin/node -v
    /opt/alt/alt-nodejs20/root/usr/bin/npm -v

    echo "=== CRM DIR ==="
    ls -la /home/u408450631/domains/ifleon.com/public_html/crm

    echo "=== CAN WE CREATE SYMLINK IN ~/bin ? ==="
    mkdir -p ~/bin
    ln -sf /opt/alt/alt-nodejs20/root/usr/bin/node ~/bin/node
    ln -sf /opt/alt/alt-nodejs20/root/usr/bin/npm ~/bin/npm
    ln -sf /opt/alt/alt-nodejs20/root/usr/bin/npx ~/bin/npx
    ~/bin/node -v
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
});

conn.connect(config);
