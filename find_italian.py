import os
import re

files_to_check = [
    'frontend/app/admin/(tabs)/settings.tsx',
    'frontend/app/admin/(tabs)/license.tsx',
    'frontend/app/admin/(tabs)/printers.tsx',
    'src/views/AdminView.tsx',
]

for file in files_to_check:
    if not os.path.exists(file): continue
    with open(file, 'r') as f:
        content = f.read()
    print(f"--- {file} ---")
    
    # Simple regex to find words that look like Italian strings without t('')
    # We look for "label: '...', title: '...', subtitle: '...'" etc.
    matches = re.finditer(r'(title|subtitle|label|description|sub|text)="([^"]+)"', content)
    for m in matches:
        print(f"Prop string: {m.group(0)}")
        
    matches2 = re.finditer(r"(title|subtitle|label|description|sub|text|message):\s*'([^']+)'", content)
    for m in matches2:
        print(f"Object string: {m.group(0)}")
        
    # Find raw text in JSX: <Text> Qualcosa </Text>
    matches3 = re.finditer(r'>([^<]*[a-zA-Z]{4,}[^<]*)<', content)
    # Filter out empty or pure code
    for m in matches3:
        txt = m.group(1).strip()
        if txt and not '{' in txt and len(txt) > 3:
            print(f"JSX Text: {txt}")
