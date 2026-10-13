const { Client } = require('ssh2');

const conn = new Client();

const config = {
  host: '86.38.243.155',
  port: 65002,
  username: 'u408450631',
  password: 'Nikhil@1122Z',
  readyTimeout: 30000,
};

console.log('Connecting to', config.host, 'on port', config.port, 'as', config.username, '...');

conn.on('ready', () => {
  console.log('SSH connection established successfully!');
  
  const cmd = `
    echo "=== SYSTEM INFO ==="
    uname -a
    whoami
    pwd
    echo "=== NODE & TOOLS ==="
    which node || echo "node not in PATH"
    node -v || echo "node not runnable"
    which npm || echo "npm not in PATH"
    npm -v || echo "npm not runnable"
    which pm2 || echo "pm2 not found"
    pm2 -v || true
    which git || echo "git not found"
    git --version || true
    echo "=== DOMAINS & DIRECTORIES ==="
    ls -la /home/u408450631/domains/ifleon.com
    echo "=== TARGET CRM DIR ==="
    ls -la /home/u408450631/domains/ifleon.com/public_html/crm || echo "crm dir does not exist or empty"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    
    stream.on('close', (code, signal) => {
      console.log(`Stream closed with code: ${code}`);
      conn.end();
    });
    
    stream.on('data', (data) => {
      process.stdout.write(data.toString());
    });
    
    stream.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
});

conn.on('error', (err) => {
  console.error('SSH connection error:', err);
});

conn.connect(config);
