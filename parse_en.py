import re, json

with open('frontend/src/utils/i18n.ts') as f:
    content = f.read()

en_dict = {}
for m in re.finditer(r'Object.assign\(LITERAL_TRANSLATIONS\.en,\s*(\{.*?\})\);', content, re.DOTALL):
    s = m.group(1)
    # very naive parse
    for kv in re.finditer(r'"([^"]+)":\s*"([^"]+)"', s):
        en_dict[kv.group(1)] = kv.group(2)

print("Total keys in EN:", len(en_dict))
import random
print("Sample keys:", random.sample(list(en_dict.keys()), 5))
