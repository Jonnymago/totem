const fs = require('fs');
const file = 'frontend/app.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

// Delete owner, as it will be inferred or we let EAS handle it
delete data.expo.owner;
data.expo.extra.eas.projectId = "a3fa9eff-2d76-48e7-bb3b-9d2467da9237";

fs.writeFileSync(file, JSON.stringify(data, null, 2));
