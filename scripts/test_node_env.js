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
    echo "=== TESTING NVM ==="
    [ -s "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh"
    nvm --version || echo "nvm not loaded"
    nvm ls || echo "no nvm versions"

    echo "=== TESTING ALT-NODEJS ==="
    /opt/alt/alt-nodejs20/root/usr/bin/node -v || true
    /opt/alt/alt-nodejs20/root/usr/bin/npm -v || true
    /opt/alt/alt-nodejs22/root/usr/bin/node -v || true

    echo "=== TESTING WEBSERVER (.htaccess in crm) ==="
    cat /home/u408450631/domains/ifleon.com/public_html/crm/.htaccess 2>/dev/null || echo "No .htaccess in crm"

    echo "=== TESTING PARENT .htaccess ==="
    cat /home/u408450631/domains/ifleon.com/public_html/.htaccess 2>/dev/null | head -n 30 || echo "No .htaccess in public_html"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
});

conn.connect(config);
