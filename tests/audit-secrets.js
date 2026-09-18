const fs = require('fs');
const path = require('path');

let secretsFound = 0;

function scan(dir) {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === '.git' || entry === '.temp-chrome-profile') continue;
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scan(full);
    } else {
      if (entry.endsWith('.js') || entry.endsWith('.json') || entry.endsWith('.env') || entry === '.env.example') {
        const text = fs.readFileSync(full, 'utf8');
        const lines = text.split('\n');
        lines.forEach((line, i) => {
          // Check for real secrets (sk-ant-..., sk-..., AIzaSy..., actual private tokens)
          if (/sk-ant-[a-zA-Z0-9_\-]{20,}/.test(line) ||
              /AIzaSy[a-zA-Z0-9_\-]{30,}/.test(line) ||
              /ghp_[a-zA-Z0-9]{30,}/.test(line) ||
              /bot[0-9]{8,}:[a-zA-Z0-9_\-]{30,}/.test(line)) {
            console.log(`[ALERT] Hardcoded secret pattern in ${full}:${i + 1}`);
            secretsFound++;
          }
        });
      }
    }
  }
}

scan(path.resolve(__dirname, '..'));
console.log(`Secret scan completed. Found: ${secretsFound} secrets.`);
