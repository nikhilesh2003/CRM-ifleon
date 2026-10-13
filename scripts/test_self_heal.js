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

    echo "=== KILLING PROCESS AND DELETING SOCKET TO TEST SELF-HEALING ==="
    pkill -f "entry.js" 2>/dev/null || true
    rm -f crm.sock
    sleep 1

    echo "Socket exists before request? $([ -f crm.sock ] && echo YES || echo NO)"

    echo "=== SENDING REQUEST TO TRIGGER AUTO-START ==="
    curl -s -i https://crm.ifleon.com/api/leads | head -n 12

    echo "Socket exists after request? $([ -f crm.sock ] && echo YES || echo NO)"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
});

conn.connect(config);
