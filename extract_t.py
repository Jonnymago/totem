import re, glob

terms = set()
for file in glob.glob('frontend/app/admin/(tabs)/*.tsx'):
    with open(file, 'r') as f:
        content = f.read()
    for m in re.finditer(r"t\(\`([^\`]+)\`\)", content):
        terms.add(m.group(1))
    for m in re.finditer(r"t\('([^']+)'\)", content):
        terms.add(m.group(1))

with open('frontend/src/utils/i18n.ts', 'r') as f:
    i18n = f.read()

missing = []
for t in terms:
    if f"'{t}':" not in i18n and f'"{t}":' not in i18n:
        missing.append(t)

print("Missing terms:")
for m in sorted(missing):
    print(m)
