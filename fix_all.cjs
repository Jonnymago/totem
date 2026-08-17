const fs = require('fs');

// Fix LocalServer.ts
const serverFile = 'frontend/src/utils/LocalServer.ts';
let serverContent = fs.readFileSync(serverFile, 'utf8');
serverContent = serverContent.replace('api.getProductsAdmin()', 'api.getAllProductsAdmin()');
fs.writeFileSync(serverFile, serverContent);

// Fix settings.tsx
const settingsFile = 'frontend/app/admin/(tabs)/settings.tsx';
let settingsContent = fs.readFileSync(settingsFile, 'utf8');
settingsContent = settingsContent.replace(/<Text style=\{styles\.label\} style=\{\{(.*?)\}\}>/g, '<Text style={[styles.label, {$1}]}>');
if (!settingsContent.includes('desc: {')) {
  settingsContent = settingsContent.replace('const styles = StyleSheet.create({', 'const styles = StyleSheet.create({\n  desc: { fontSize: 14, color: "#666", marginBottom: 10, lineHeight: 20 },\n  inputContainer: { marginBottom: 15 },');
}
fs.writeFileSync(settingsFile, settingsContent);
