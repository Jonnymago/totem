const fs = require('fs');
const file = 'frontend/app/admin/(tabs)/_layout.tsx';
let content = fs.readFileSync(file, 'utf8');
// Rimuoviamo tutte le Tabs.Screen name="groups"
content = content.replace(/<Tabs\.Screen\s+name="groups"\s+options=\{\{[\s\S]*?\}\}\s+\/>/g, '');
// Poi la inseriamo prima di settings
const insertion = `<Tabs.Screen
        name="groups"
        options={{
          title: 'Gruppi',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"`;
content = content.replace('<Tabs.Screen\n        name="settings"', insertion);
fs.writeFileSync(file, content);
