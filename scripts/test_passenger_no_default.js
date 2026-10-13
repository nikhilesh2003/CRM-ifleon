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
    mv /home/u408450631/domains/ifleon.com/public_html/crm/default.php /home/u408450631/domains/ifleon.com/public_html/crm/default.php.bak

    cat << 'EOF' > /home/u408450631/domains/ifleon.com/public_html/crm/app.js
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('PASSENGER_NODE_SUCCESS_PORT_' + (process.env.PORT || 'NONE'));
});
server.listen(process.env.PORT || 3000);
EOF

    cat << 'EOF' > /home/u408450631/domains/ifleon.com/public_html/crm/.htaccess
PassengerNodejs /opt/alt/alt-nodejs20/root/usr/bin/node
PassengerAppType node
PassengerStartupFile app.js
PassengerEnabled on
EOF

    echo "=== CURL RESULT ==="
    curl -s -i https://crm.ifleon.com/

    # Restore default.php for now
    mv /home/u408450631/domains/ifleon.com/public_html/crm/default.php.bak /home/u408450631/domains/ifleon.com/public_html/crm/default.php
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
