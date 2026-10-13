const { Client } = require('ssh2');

const conn = new Client();

const config = {
  host: '86.38.243.155',
  port: 65002,
  username: 'u408450631',
  password: 'Nikhil@1122Z',
};

const htaccess = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. API routes -> api/index.php
  RewriteRule ^api/(.*)$ api/index.php [QSA,L]
  RewriteRule ^api$ api/index.php [QSA,L]

  # 2. Existing static files and directories
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # 3. Two-level clean URLs: /leads/lead-1 -> leads/lead-1.html
  RewriteCond %{DOCUMENT_ROOT}/leads/$1.html -f
  RewriteRule ^leads/([^/]+)/?$ leads/$1.html [L]

  # 4. Fallback for newly created lead IDs -> leads/preview.html
  RewriteRule ^leads/([^/]+)/?$ leads/preview.html [L]

  # 5. Admin clean URLs: /admin/users -> admin/users.html
  RewriteCond %{DOCUMENT_ROOT}/admin/$1.html -f
  RewriteRule ^admin/([^/]+)/?$ admin/$1.html [L]

  # 6. Quotations clean URLs: /quotations/new -> quotations/new.html
  RewriteCond %{DOCUMENT_ROOT}/quotations/$1.html -f
  RewriteRule ^quotations/([^/]+)/?$ quotations/$1.html [L]

  # 7. Single-level clean URLs: /tasks -> tasks.html
  RewriteCond %{DOCUMENT_ROOT}/$1.html -f
  RewriteRule ^([^/]+)/?$ $1.html [L]

  # 8. Universal SPA fallback
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^ index.html [L]
</IfModule>
`;

conn.on('ready', () => {
  const cmd = `
    cd /home/u408450631/domains/ifleon.com/public_html/crm
    cat << 'EOF' > .htaccess
${htaccess}
EOF
    echo "=== TESTING /leads/lead-1 ==="
    curl -s -i https://crm.ifleon.com/leads/lead-1 | head -n 25
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
});

conn.connect(config);
