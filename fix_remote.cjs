const fs = require('fs');
const path = 'frontend/app/admin/(tabs)/settings.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<View style=\{styles\.section\}>\s*<Text style=\{styles\.sectionTitle\}>\s*<Ionicons name="globe-outline"[\s\S]*?<\/ScrollView>/;
content = content.replace(regex, `<View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="globe-outline" size={18} color="#FF6B6B" /> Gestione Remota (Senza Internet)
          </Text>
          <Text style={[styles.label, {marginBottom: 10, lineHeight: 22}]}>
            L'app fa ora da server locale. Puoi gestire i prodotti e vedere gli ordini da qualsiasi PC collegato al tuo stesso Wi-Fi.
          </Text>
          
          <View style={styles.remoteUrlBox}>
             <Text style={styles.remoteUrlLabel}>Apri il browser su un PC e vai a questo indirizzo:</Text>
             <Text style={styles.remoteUrl} selectable>http://INSERISCI_IP_DEL_TABLET:8000/remote/</Text>
             <Text style={styles.hint}>Puoi trovare l'IP del tablet nelle impostazioni Wi-Fi di Android (es. 192.168.1.9).</Text>
          </View>
        </View>
      </ScrollView>`);
fs.writeFileSync(path, content);
