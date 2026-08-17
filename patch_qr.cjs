const fs = require('fs');
let code = fs.readFileSync('frontend/app/admin/(tabs)/settings.tsx', 'utf8');

const target = `
          {getRemoteAdminUrl() ? (
            <View style={styles.remoteUrlBox}>
              <Text style={styles.remoteUrlLabel}>Apri nel browser del telefono:</Text>
              <Text selectable style={styles.remoteUrl}>{customBackendUrl ? customBackendUrl + "/remote/" : getRemoteAdminUrl()}</Text>
            </View>
          ) : (
`;
const replacement = `
          {getRemoteAdminUrl() ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5F5', borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.remoteUrlLabel}>Apri nel browser del telefono o scansiona il QR:</Text>
                <Text selectable style={styles.remoteUrl}>{customBackendUrl ? customBackendUrl + "/" : getRemoteAdminUrl().replace('/remote/', '/')}</Text>
              </View>
              <Image 
                source={{ uri: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(customBackendUrl ? customBackendUrl + "/" : getRemoteAdminUrl().replace('/remote/', '/')) }} 
                style={{ width: 100, height: 100, borderRadius: 8, marginLeft: 16 }} 
              />
            </View>
          ) : (
`;
code = code.replace(target, replacement);

const target2 = `
             <Text style={styles.remoteUrlLabel}>Apri il browser su un PC e vai a questo indirizzo:</Text>
             <Text style={styles.remoteUrl} selectable>http://INSERISCI_IP_DEL_TABLET:8000/remote/</Text>
`;
const replacement2 = `
             <Text style={styles.remoteUrlLabel}>Apri il browser su un PC e vai a questo indirizzo:</Text>
             <Text style={styles.remoteUrl} selectable>http://INSERISCI_IP_DEL_TABLET:8000/</Text>
`;
code = code.replace(target2, replacement2);

fs.writeFileSync('frontend/app/admin/(tabs)/settings.tsx', code);
console.log('patched settings QR code');
