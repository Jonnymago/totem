const fs = require('fs');
const path = 'frontend/app/admin/(tabs)/settings.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove Server Locale section
content = content.replace(
  /<View style=\{styles\.section\}>\s*<Text style=\{styles\.sectionTitle\}>\s*<Ionicons name="wifi"[\s\S]*?<\/View>/,
  ''
);

// 2. Rewrite Distribuzione Backend & Gestione Remota section
const newRemoteSection = `
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="globe-outline" size={18} color="#FF6B6B" /> Gestione Remota (Senza Internet)
          </Text>
          <Text style={[styles.label, {marginBottom: 10, lineHeight: 22}]}>
            L'app fa ora da server locale. Puoi gestire i prodotti e vedere gli ordini da qualsiasi PC o smartphone collegato al tuo stesso Wi-Fi.
          </Text>
          <Text style={[styles.label, {marginBottom: 15, fontWeight: 'bold', color: '#333'}]}>
            Come accedere al Pannello:
          </Text>
          <Text style={{marginBottom: 15, lineHeight: 22, color: '#555'}}>
            1. Apri le impostazioni Wi-Fi di questo tablet e cerca il suo indirizzo IP (es: 192.168.1.9).
            2. Apri il browser dal PC/Smartphone.
            3. Vai all'indirizzo indicato qui sotto (sostituendo l'IP):
          </Text>

          <View style={styles.remoteUrlBox}>
             <Text style={styles.remoteUrlLabel}>URL del Server Locale:</Text>
             <Text style={styles.remoteUrl} selectable>http://IP-DEL-TOTEM:8000/remote/</Text>
          </View>
        </View>
`;

content = content.replace(
  /<View style=\{styles\.section\}>\s*<Text style=\{styles\.sectionTitle\}>\s*<Ionicons name="cloud-upload"[\s\S]*?<\/View>/,
  newRemoteSection.trim()
);

fs.writeFileSync(path, content);
