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
    echo "=== CHECKING SELECTORCTL ==="
    which selectorctl 2>/dev/null || which cloudlinux-selector 2>/dev/null || echo "no selector command"
    cloudlinux-selector nodejs get --json 2>/dev/null || true

    echo "=== CHECKING PASSENGER DIRECTIVES IN HTACCESS ==="
    cat << 'EOF' > /home/u408450631/domains/ifleon.com/public_html/crm/app.js
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('PASSENGER_NODE_SUCCESS');
});
server.listen(process.env.PORT || 3000);
EOF

    cat << 'EOF' > /home/u408450631/domains/ifleon.com/public_html/crm/.htaccess
PassengerNodejs /opt/alt/alt-nodejs20/root/usr/bin/node
PassengerAppType node
PassengerStartupFile app.js
PassengerEnabled on
EOF

    curl -s -i https://crm.ifleon.com/ || echo "Curl failed"

    # Cleanup
    rm -f /home/u408450631/domains/ifleon.com/public_html/crm/.htaccess
    rm -f /home/u408450631/domains/ifleon.com/public_html/crm/app.js
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
});

conn.connect(config);
