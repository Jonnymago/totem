const fs = require('fs');
const file = 'frontend/src/api/api.impl.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "if (snapshot.products && Array.isArray(snapshot.products)) {\n    localDb.products = snapshot.products;\n  }\n  await saveLocalDb();",
  "if (snapshot.products && Array.isArray(snapshot.products)) {\n    localDb.products = snapshot.products;\n  }\n  if (snapshot.global_groups && Array.isArray(snapshot.global_groups)) {\n    localDb.global_groups = snapshot.global_groups;\n  }\n  await saveLocalDb();"
);

fs.writeFileSync(file, content);
