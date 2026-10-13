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
    echo "<?php echo 'PHP_AND_LITESPEED_OK'; ?>" > /home/u408450631/domains/ifleon.com/public_html/crm/test.php
    curl -s https://crm.ifleon.com/test.php
    rm -f /home/u408450631/domains/ifleon.com/public_html/crm/test.php
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
});

conn.connect(config);
