sed -i '/<Tabs.Screen/!b; /name="categories"/!b; :a; /<\/Tabs.Screen>/!{N;ba}; a\
      <Tabs.Screen\
        name="groups"\
        options={{\
          title: '\''Gruppi Extra'\'',\
          tabBarIcon: ({ color, size }) => (\
            <Ionicons name="list" size={size} color={color} />\
          ),\
        }}\
      />' frontend/app/admin/\(tabs\)/_layout.tsx
