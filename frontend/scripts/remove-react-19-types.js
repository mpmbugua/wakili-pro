const fs = require('fs');
const path = require('path');

const typesDir = path.join(__dirname, '..', 'node_modules', '@types', 'react');
if (fs.existsSync(typesDir)) {
  fs.readdirSync(typesDir).forEach((subdir) => {
    if (subdir.startsWith('19.')) {
      const fullPath = path.join(typesDir, subdir);
      console.log('Removing:', fullPath);
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  });
}
