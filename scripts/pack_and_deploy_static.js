const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Client } = require('ssh2');
const { generateDeploymentInfo } = require('./generate_deployment_info');

const rootDir = path.join(__dirname, '..');
const outDir = path.join(rootDir, 'out');

console.log('1. Preparing out/ directory...');

// Generate deployment & git commit metadata
generateDeploymentInfo();

// Ensure out/api directory exists
const apiDir = path.join(outDir, 'api');
if (!fs.existsSync(apiDir)) fs.mkdirSync(apiDir, { recursive: true });

// Copy PHP router to out/api/index.php
const phpRouterSrc = path.join(__dirname, 'remote_api_router.php');
fs.copyFileSync(phpRouterSrc, path.join(apiDir, 'index.php'));
console.log('   Copied api/index.php');

// Ensure out/data directory exists and copy crm-store.json & db-config.json
const outDataDir = path.join(outDir, 'data');
if (!fs.existsSync(outDataDir)) fs.mkdirSync(outDataDir, { recursive: true });
const backupsDir = path.join(outDataDir, 'backups');
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

const srcStore = path.join(rootDir, 'data', 'crm-store.json');
if (fs.existsSync(srcStore)) {
  fs.copyFileSync(srcStore, path.join(outDataDir, 'crm-store.json'));
  console.log('   Copied data/crm-store.json (' + fs.statSync(srcStore).size + ' bytes)');
}
const srcDbConfig = path.join(rootDir, 'data', 'db-config.json');
if (fs.existsSync(srcDbConfig)) {
  fs.copyFileSync(srcDbConfig, path.join(outDataDir, 'db-config.json'));
  console.log('   Copied data/db-config.json');
}
const srcDepInfo = path.join(rootDir, 'data', 'deployment-info.json');
if (fs.existsSync(srcDepInfo)) {
  fs.copyFileSync(srcDepInfo, path.join(outDataDir, 'deployment-info.json'));
  fs.copyFileSync(srcDepInfo, path.join(outDir, 'deployment-info.json'));
  console.log('   Copied data/deployment-info.json to out directory');
}

// Copy page.html to directory/index.html so both /route and /route/ work with 0 redirects!
const routeDirs = ['login', 'register', 'leads', 'quotations', 'tasks', 'analytics', 'projects', 'review-inbox', 'audit-log'];
for (const r of routeDirs) {
  const htmlFile = path.join(outDir, `${r}.html`);
  const destDir = path.join(outDir, r);
  if (fs.existsSync(htmlFile)) {
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(htmlFile, path.join(destDir, 'index.html'));
  }
}
console.log('   Created directory index.html fallbacks for zero-redirect clean routes');

// Write out/.htaccess
const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. Route API requests directly to PHP router
  RewriteRule ^api/(.*)$ api/index.php [QSA,L]
  RewriteRule ^api$ api/index.php [QSA,L]

  # 2. Existing static files
  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]

  # 3. Dynamic lead detail fallback: /leads/{any_id} -> leads/[id].html
  RewriteRule ^leads/([^/]+)/?$ leads/[id].html [L]

  # 4. Clean URLs without .html extension (serves $1.html directly with 0 redirects)
  RewriteCond %{DOCUMENT_ROOT}/$1.html -f
  RewriteRule ^([^/]+)/?$ $1.html [L]

  # 5. Clean URLs in subdirectories (admin/users, admin/settings)
  RewriteCond %{DOCUMENT_ROOT}/$1/$2.html -f
  RewriteRule ^([^/]+)/([^/]+)/?$ $1/$2.html [L]

  # 6. Existing directories
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # 6. SPA Fallback
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^ index.html [L]
</IfModule>
`;
fs.writeFileSync(path.join(outDir, '.htaccess'), htaccessContent);
console.log('   Wrote .htaccess');

// 2. Archive out/ folder
console.log('2. Compressing out/ directory into deploy_site.tar.gz ...');
const tarPath = path.join(rootDir, 'deploy_site.tar.gz');
execSync(`tar -czf "${tarPath}" -C "${outDir}" .`, { stdio: 'inherit' });
const tarSizeMB = (fs.statSync(tarPath).size / 1024 / 1024).toFixed(2);
console.log(`   Archive created: ${tarSizeMB} MB`);

// 3. Upload & Deploy to Hostinger via SFTP
console.log('3. Connecting to Hostinger server...');
const conn = new Client();
const config = {
  host: '86.38.243.155',
  port: 65002,
  username: 'u408450631',
  password: 'Nikhil@1122Z',
  readyTimeout: 40000,
};

const remoteTargetDir = '/home/u408450631/domains/ifleon.com/public_html/crm';
const remoteTar = remoteTargetDir + '/deploy_site.tar.gz';

conn.on('ready', () => {
  console.log('SSH connection established! Initializing SFTP...');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    console.log('Uploading deploy_site.tar.gz to remote server...');
    sftp.fastPut(tarPath, remoteTar, (upErr) => {
      if (upErr) throw upErr;
      console.log('Upload complete! Extracting on remote server...');

      const cmd = [
        `cd ${remoteTargetDir}`,
        'pkill -f "entry.js" 2>/dev/null || true',
        'rm -rf wp-admin wp-includes wp-content wp-*.php index.php xmlrpc.php default.php crm.sock crm.log',
        'tar -xzf deploy_site.tar.gz --overwrite',
        'rm -f deploy_site.tar.gz',
        'chmod -R 755 .',
        'chmod -R 777 data',
        'mkdir -p uploads data/backups',
        'chmod -R 777 uploads data/backups',
        'chmod 644 .htaccess',
        'echo "=== DEPLOYMENT COMPLETE ==="',
        'ls -la api',
        'wc -l api/index.php',
      ].join(' && ');

      conn.exec(cmd, (exErr, stream) => {
        if (exErr) throw exErr;
        stream.on('close', (code) => {
          console.log(`Remote extraction completed with code ${code}`);
          // Also explicitly upload out/api/index.php via sftp to be 100% sure
          const localPhp = path.join(outDir, 'api', 'index.php');
          const remotePhp = remoteTargetDir + '/api/index.php';
          console.log('Directly syncing api/index.php via SFTP...');
          sftp.fastPut(localPhp, remotePhp, (syncErr) => {
            if (syncErr) console.error('Direct PHP sync error:', syncErr);
            else console.log('Successfully verified and uploaded api/index.php directly via SFTP!');

            const localDep = path.join(rootDir, 'data', 'deployment-info.json');
            const remoteDep = remoteTargetDir + '/data/deployment-info.json';
            sftp.fastPut(localDep, remoteDep, (depErr) => {
              if (depErr) console.warn('Deployment info sync notice:', depErr.message);
              else console.log('Successfully uploaded data/deployment-info.json to remote server!');
              conn.end();
            });
          });
        });
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
      });
    });
  });
});

conn.connect(config);
