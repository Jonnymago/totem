const fs = require('fs');
const file = 'frontend/app/admin/(tabs)/settings.tsx';
let content = fs.readFileSync(file, 'utf8');

// The new JSX block
const jsx = `
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="wifi" size={18} color="#FF6B6B" /> Server Locale (Opzionale)
          </Text>
          <Text style={styles.desc}>
            Se il server Python non si trova nel cloud, ma su un PC nella tua rete WiFi (niente internet), scrivi qui l'IP del PC. Es: http://192.168.1.9:8000
          </Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>URL Backend (lascia vuoto per default)</Text>
            <TextInput
              style={styles.input}
              value={customBackendUrl}
              onChangeText={setCustomBackendUrl}
              placeholder="http://192.168.1.x:8000"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>
`;

content = content.replace('<View style={styles.section}>', jsx + '\n        <View style={styles.section}>');
fs.writeFileSync(file, content);
