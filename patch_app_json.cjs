const fs = require('fs');
const file = 'frontend/app.json';
let content = JSON.parse(fs.readFileSync(file, 'utf8'));

content.expo.runtimeVersion = {
  policy: "appVersion"
};

fs.writeFileSync(file, JSON.stringify(content, null, 2));
