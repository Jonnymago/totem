sed -i '/<Text style={styles.label}>Personalizzazioni sul totem<\/Text>/i \
              {globalGroups.length > 0 && (\
                <View>\
                  <Text style={styles.label}>Gruppi Opzionali Globali (Salse, ecc.)<\/Text>\
                  <Text style={styles.hintSmall}>Seleziona i gruppi globali da attivare per questo prodotto. Le opzioni verranno mostrate al totem assieme alle personalizzazioni qui sotto.<\/Text>\
                  <View style={{ flexDirection: '\''row'\'', flexWrap: '\''wrap'\'', gap: 8, marginTop: 8, marginBottom: 16 }}>\
                    {globalGroups.map(g => {\
                      const isSelected = selectedGlobalGroupIds.includes(g.id);\
                      return (\
                        <TouchableOpacity\
                          key={g.id}\
                          style={[\
                            styles.addSectionBtn,\
                            { backgroundColor: isSelected ? '\''#43A047'\'' : '\''#ccc'\'' }\
                          ]}\
                          onPress={() => {\
                            if (isSelected) {\
                              setSelectedGlobalGroupIds(prev => prev.filter(id => id !== g.id));\
                            } else {\
                              setSelectedGlobalGroupIds(prev => [...prev, g.id]);\
                            }\
                          }}\
                        >\
                          <Text style={styles.addSectionText}>{g.name}<\/Text>\
                        <\/TouchableOpacity>\
                      );\
                    })}\
                  <\/View>\
                <\/View>\
              )}' frontend/app/admin/\(tabs\)/products.tsx
