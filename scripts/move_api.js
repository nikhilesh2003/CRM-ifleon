const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'app', 'api');
const dest = path.join(__dirname, '..', 'api_routes_backup');

try {
  fs.renameSync(src, dest);
  console.log('Successfully moved app/api to api_routes_backup');
} catch (e) {
  console.error('Failed to rename:', e.message);
}
