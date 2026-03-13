/**
 * Copy Angular build output to server/public for deployment.
 * Run after: cd client && npm run build
 * Angular outputs to: client/dist/client/browser/
 */
const fs = require('fs');
const path = require('path');

const serverRoot = path.join(__dirname, '..');
const clientBuild = path.join(serverRoot, '..', 'client', 'dist', 'client', 'browser');
const publicDir = path.join(serverRoot, 'public');

if (!fs.existsSync(clientBuild)) {
  console.error('❌ Angular build not found at:', clientBuild);
  console.error('   Run: cd client && npm install && ng build');
  process.exit(1);
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('📁 Created public/');
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursive(clientBuild, publicDir);
console.log('✅ Copied client/dist/client/browser/* to server/public/');
