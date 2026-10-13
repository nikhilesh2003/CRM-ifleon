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

    echo "=== TESTING LOGO ASSETS ==="
    curl -s -i https://crm.ifleon.com/logo-dark-horizontal.png | head -n 8
    curl -s -i https://crm.ifleon.com/logo-light-horizontal.png | head -n 8

    echo "=== TESTING CSS ASSETS ==="
    CSS_FILE=$(find .next/static/css -type f -name "*.css" | head -n 1)
    echo "Found CSS file: $CSS_FILE"
    CSS_PATH=$(echo $CSS_FILE | sed 's/^\.next/_next/')
    echo "Fetching: https://crm.ifleon.com/$CSS_PATH"
    curl -s -i "https://crm.ifleon.com/$CSS_PATH" | head -n 10

    echo "=== TESTING HOMEPAGE HTML ==="
    curl -s -i https://crm.ifleon.com/ | head -n 25
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
});

conn.connect(config);
