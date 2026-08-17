const fs = require('fs');
const file = 'frontend/app/_layout.tsx';
let content = fs.readFileSync(file, 'utf8');

const importServer = "import { startLocalServer } from '../src/utils/LocalServer';";
content = content.replace('import { useIconFonts } from "@/src/hooks/use-icon-fonts";', importServer + '\nimport { useIconFonts } from "@/src/hooks/use-icon-fonts";');

const hook = `
  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        startLocalServer();
      } catch (e) {
        console.error('Local server error:', e);
      }
    }
  }, []);
`;
content = content.replace('  if (!loaded && !error) return null;', hook + '\n  if (!loaded && !error) return null;');

fs.writeFileSync(file, content);
