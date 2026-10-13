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
    php -r "echo 'shell_exec: ' . (function_exists('shell_exec') ? 'ENABLED' : 'DISABLED') . PHP_EOL;"
    php -r "echo 'exec: ' . (function_exists('exec') ? 'ENABLED' : 'DISABLED') . PHP_EOL;"
    php -r "echo 'disable_functions: ' . ini_get('disable_functions') . PHP_EOL;"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
});

conn.connect(config);
