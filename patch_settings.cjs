const fs = require('fs');
let code = fs.readFileSync('frontend/app/admin/(tabs)/settings.tsx', 'utf8');

// Replace IP QR codes with standard web url QR
const target1 = `
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
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5F5', borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.remoteUrlLabel}>Apri nel browser del telefono o scansiona il QR:</Text>
                <Text selectable style={styles.remoteUrl}>{"http://" + localIp + ":8000/"}</Text>
              </View>
              <Image 
                source={{ uri: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent("http://" + localIp + ":8000/") }} 
                style={{ width: 100, height: 100, borderRadius: 8, marginLeft: 16 }} 
              />
            </View>
          )}
`;

const replacement1 = `
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5F5', borderRadius: 8, padding: 12, marginBottom: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.remoteUrlLabel}>Apri nel browser del telefono o scansiona il QR:</Text>
              <Text selectable style={styles.remoteUrl}>{customBackendUrl || getRemoteAdminUrl()}</Text>
            </View>
            <Image 
              source={{ uri: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(customBackendUrl || getRemoteAdminUrl()) }} 
              style={{ width: 100, height: 100, borderRadius: 8, marginLeft: 16 }} 
            />
          </View>
`;

code = code.replace(target1, replacement1);

const target2 = `
             <Text style={styles.remoteUrlLabel}>Apri il browser su un PC e vai a questo indirizzo:</Text>
             <Text style={styles.remoteUrl} selectable>{"http://" + localIp + ":8000/"}</Text>
`;
const replacement2 = `
             <Text style={styles.remoteUrlLabel}>Gestione Cloud Attiva</Text>
             <Text style={styles.remoteUrlLabel}>Apri il browser su un PC o Telefono ovunque tu sia e vai a questo indirizzo:</Text>
             <Text style={styles.remoteUrl} selectable>{customBackendUrl || getRemoteAdminUrl()}</Text>
`;
code = code.replace(target2, replacement2);

fs.writeFileSync('frontend/app/admin/(tabs)/settings.tsx', code);
console.log('patched settings QR code for cloud');
