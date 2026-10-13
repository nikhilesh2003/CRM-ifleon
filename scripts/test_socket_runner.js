const path = require('path');
const fs = require('fs');
const http = require('http');

const standaloneDir = path.join(__dirname, '..', '.next', 'standalone');
process.env.NODE_ENV = 'production';
process.chdir(standaloneDir);

const serverJs = fs.readFileSync(path.join(standaloneDir, 'server.js'), 'utf8');
const configMatch = serverJs.match(/const nextConfig = (\{.*?\})\r?\n/);
const nextConfig = JSON.parse(configMatch[1]);
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

const { startServer } = require(path.join(standaloneDir, 'node_modules', 'next', 'dist', 'server', 'lib', 'start-server'));

const socketPath = path.join(__dirname, 'test.sock');
if (fs.existsSync(socketPath)) fs.unlinkSync(socketPath);

console.log('Testing startServer on socket:', socketPath);

// In Node.js, server.listen(handle) accepts a string for UNIX sockets or Windows named pipes:
// On Windows, UNIX domain sockets must be AF_UNIX or named pipes (\\\\.\\pipe\\test).
// On Linux (our remote server), UNIX domain sockets are regular files like /home/.../crm.sock!
console.log('OS platform is:', process.platform);
