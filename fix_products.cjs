const fs = require('fs');
const path = 'frontend/app/admin/(tabs)/products.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /ui_sections: ordered,\s*\.\.\.legacy,\s*\};\s*if \(editingProduct\)/,
  `ui_sections: ordered,
        global_group_ids: selectedGlobalGroupIds,
        ...legacy,
      };

      if (editingProduct)`
);
fs.writeFileSync(path, content);
