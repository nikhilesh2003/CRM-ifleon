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

    # Extract static build & PHP router
    tar -xzf deploy_site.tar.gz
    rm -f deploy_site.tar.gz

    # Permissions
    chmod -R 755 .
    chmod -R 777 data
    chmod 644 .htaccess

    echo "=== FILES EXTRACTED ==="
    ls -la
    echo "=== API CHECK ==="
    ls -la api
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
});

conn.connect(config);
