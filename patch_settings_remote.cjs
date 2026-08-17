const fs = require('fs');
const file = 'frontend/app/admin/(tabs)/settings.tsx';
let content = fs.readFileSync(file, 'utf8');

// I'll add the new section before the chiusura di ScrollView
const remoteSection = `
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="cloud-upload" size={18} color="#FF6B6B" /> Distribuzione Backend & Gestione Remota
          </Text>
          <Text style={styles.label} style={{marginBottom: 10, lineHeight: 22}}>
            Il backend remoto conserva i backup, sincronizza i dispositivi e offre un pannello web di Gestione Remota.
          </Text>
          <Text style={styles.label} style={{marginBottom: 15, fontWeight: 'bold', color: '#333'}}>
            1. Per aggiornare o riavviare il backend (Deploy):
          </Text>
          <Text style={{marginBottom: 15, lineHeight: 22, color: '#555'}}>
            Utilizza la piattaforma cloud dove è in esecuzione il backend. Se stai usando un ambiente di sviluppo integrato (come AI Studio o Google Cloud), devi premere il pulsante "Deploy" o "Share" dalla barra superiore di quell'interfaccia. L'app del tablet non ha i permessi per compilare o distribuire autonomamente il codice del server.
          </Text>
          
          <Text style={styles.label} style={{marginBottom: 15, fontWeight: 'bold', color: '#333'}}>
            2. Pannello di Gestione Remota
          </Text>
          <Text style={{marginBottom: 15, lineHeight: 22, color: '#555'}}>
            Una volta effettuato il Deploy, puoi accedere al pannello remoto visitando questo indirizzo nel browser da un qualsiasi computer collegato a internet (aggiungi /remote/ alla fine dell'URL del server):
          </Text>

          <View style={styles.remoteUrlBox}>
             <Text style={styles.remoteUrlLabel}>URL del Server:</Text>
             <Text style={styles.remoteUrl} selectable>{getRemoteAdminUrl()}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.resetButton, { backgroundColor: '#4CAF50', flexDirection: 'row', justifyContent: 'center', gap: 10 }]} 
            onPress={() => {
              Alert.alert(
                'Gestione Remota', 
                \`Accedi all'URL: \\n\${getRemoteAdminUrl()}/remote/ \\n\\nSe il pannello non viene caricato, assicurati di aver eseguito un Deploy del backend.\`
              )
            }}
          >
            <Ionicons name="globe-outline" size={20} color="white" />
            <Text style={styles.resetButtonText}>Info Accesso Remoto</Text>
          </TouchableOpacity>
        </View>
`;

content = content.replace('</ScrollView>', remoteSection + '\n      </ScrollView>');
fs.writeFileSync(file, content);
