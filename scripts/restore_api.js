const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'api_routes_backup');
const dest = path.join(__dirname, '..', 'app', 'api');

if (fs.existsSync(src)) {
  fs.renameSync(src, dest);
  console.log('Restored app/api from api_routes_backup');
}
