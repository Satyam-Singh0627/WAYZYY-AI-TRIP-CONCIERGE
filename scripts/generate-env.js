const fs = require('fs');
const path = require('path');

const apiBaseUrl = process.env.API_BASE_URL || process.env.API_URL || 'https://wayzyy-ai-trip-concierge.onrender.com';
const content = `// Runtime environment config generated at build time
window.API_BASE_URL = "${apiBaseUrl.replace(/\/+$/, '')}";
`;

const targetPath = path.join(__dirname, '..', 'frontend', 'env-config.js');
fs.writeFileSync(targetPath, content, 'utf8');
console.log(`[build] Generated frontend/env-config.js with API_BASE_URL: ${apiBaseUrl}`);
