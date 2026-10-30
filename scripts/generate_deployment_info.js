const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function generateDeploymentInfo() {
  const rootDir = path.join(__dirname, '..');
  try {
    const hash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const shortHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const message = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    const author = execSync('git log -1 --pretty=%an', { encoding: 'utf8' }).trim();
    const date = execSync('git log -1 --pretty=%ad --date=iso', { encoding: 'utf8' }).trim();

    const logRaw = execSync('git log -n 12 --pretty=format:"%H:::%h:::%an:::%ad:::%s" --date=iso', { encoding: 'utf8' }).trim();
    const recentCommits = logRaw.split('\n').filter(Boolean).map(line => {
      const [h, sh, a, d, ...msgParts] = line.split(':::');
      return {
        hash: h,
        shortHash: sh,
        author: a,
        date: d,
        message: msgParts.join(':::'),
        isCurrent: (h === hash)
      };
    });

    const info = {
      status: 'healthy',
      environment: 'production',
      deployedAt: new Date().toISOString(),
      commitHash: hash,
      shortHash: shortHash,
      branch: branch,
      commitMessage: message,
      commitAuthor: author,
      commitDate: date,
      buildVersion: 'v1.4.2-prod',
      server: {
        host: '86.38.243.155',
        port: 65002,
        subdomain: 'crm.ifleon.com',
        deployTarget: '/home/u408450631/domains/ifleon.com/public_html/crm',
        engine: 'Hostinger CloudLinux / PHP 8.2 / LiteSpeed',
        phpVersion: '8.2.20',
        webServer: 'LiteSpeed / Apache 2.4 mod_rewrite'
      },
      recentCommits: recentCommits
    };

    const dataDir = path.join(rootDir, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'deployment-info.json'), JSON.stringify(info, null, 2));

    const outDir = path.join(rootDir, 'out');
    if (fs.existsSync(outDir)) {
      const outDataDir = path.join(outDir, 'data');
      if (!fs.existsSync(outDataDir)) fs.mkdirSync(outDataDir, { recursive: true });
      fs.writeFileSync(path.join(outDataDir, 'deployment-info.json'), JSON.stringify(info, null, 2));
      fs.writeFileSync(path.join(outDir, 'deployment-info.json'), JSON.stringify(info, null, 2));
    }

    console.log(`[Deployment Info] Successfully written deployment metadata for commit ${shortHash} (${branch})`);
    return info;
  } catch (err) {
    console.error('Error generating deployment info:', err);
    return null;
  }
}

if (require.main === module) {
  generateDeploymentInfo();
}

module.exports = { generateDeploymentInfo };
