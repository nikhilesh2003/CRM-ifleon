const { Client } = require('ssh2');

function startProcess() {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      const cmd = `
        cd /home/u408450631/domains/ifleon.com/public_html/crm
        pkill -f "entry.js" 2>/dev/null || true
        rm -f crm.sock
        sleep 1
        nohup /opt/alt/alt-nodejs20/root/usr/bin/node entry.js </dev/null >crm.log 2>&1 &
        sleep 2
        ls -la crm.sock
      `;
      conn.exec(cmd, (err, stream) => {
        if (err) return reject(err);
        stream.on('close', () => {
          conn.end();
          resolve();
        });
        stream.on('data', d => process.stdout.write(d.toString()));
      });
    }).connect({ host: '86.38.243.155', port: 65002, username: 'u408450631', password: 'Nikhil@1122Z' });
  });
}

function verifyStillRunning() {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      const cmd = `
        cd /home/u408450631/domains/ifleon.com/public_html/crm
        echo "=== AFTER SSH DISCONNECT ==="
        ps aux | grep entry.js | grep -v grep || echo "NOT RUNNING"
        ls -la crm.sock || echo "NO SOCK"
        cat crm.log | tail -n 5
      `;
      conn.exec(cmd, (err, stream) => {
        if (err) return reject(err);
        stream.on('close', () => {
          conn.end();
          resolve();
        });
        stream.on('data', d => process.stdout.write(d.toString()));
      });
    }).connect({ host: '86.38.243.155', port: 65002, username: 'u408450631', password: 'Nikhil@1122Z' });
  });
}

async function run() {
  console.log('Step 1: Starting with nohup and disconnecting SSH...');
  await startProcess();
  console.log('Step 2: Waiting 5 seconds while disconnected...');
  await new Promise(r => setTimeout(r, 5000));
  console.log('Step 3: Opening new connection to verify persistence...');
  await verifyStillRunning();
}

run();
