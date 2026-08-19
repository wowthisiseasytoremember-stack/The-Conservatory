#!/usr/bin/env python3
"""Merge Aquasabi + Flowgrow plant data into plant_library_enriched.json.

Run: python3 scripts/merge_plant_data.py
Output: src/data/plant_library_enriched.json
"""

import json, re, os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(SCRIPT_DIR, '..'))

# Normalize name for matching comparison
def norm(name):
    s = name.lower().strip()
    s = s.replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('á', 'a')
    s = s.replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue')
    s = s.replace('ß', 'ss')
    s = re.sub(r"[^\w\s']", '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

# Load
aqua = json.load(open(os.path.join(ROOT, 'src/data/plant_library.json')))
fg = json.load(open(os.path.join(ROOT, 'src/data/flowgrow_data.json')))

# Index Flowgrow by normalized name
fg_index = {}
for p in fg:
    key = norm(p.get('scientificName', '') or p['name'])
    fg_index[key] = p

enriched = []
merged_count = 0

for p_aqua in aqua:
    entry = dict(p_aqua)
    key = norm(entry.get('scientificName', '') or entry['name'])
    entry['listingType'] = 'aquasabi'

    if key in fg_index:
        match = fg_index[key]
        for fgk, fgv in match.get('traits', {}).items():
            if fgk not in entry['traits']:
                entry['traits'][fgk] = fgv
        entry['traits']['Source'] = 'Flowgrow'
        merged_count += 1

    enriched.append(entry)

# Track which Flowgrow plants were matched
matched_keys = set()
for p_aqua in aqua:
    key = norm(p_aqua.get('scientificName', '') or p_aqua['name'])
    matched_keys.add(key)
    if key in fg_index:
        matched_keys.add(key)

# Add Flowgrow-only plants
for fg_p in fg:
    key = norm(fg_p.get('scientificName', '') or fg_p['name'])
    if key not in matched_keys:
        entry = dict(fg_p)
        entry['listingType'] = 'flowgrow'
        enriched.append(entry)

print(f'Aquasabi: {len(aqua)}, Flowgrow: {len(fg)}')
print(f'Enriched total: {len(enriched)}')
print(f'Matched and enriched: {merged_count}')
print(f'Flowgrow-only added: {len(enriched) - len(aqua)}')
print(f'Missing scientificName: {len([p for p in enriched if not p.get("scientificName")])}')

json.dump(enriched, open(os.path.join(ROOT, 'src/data/plant_library_enriched.json'), 'w'),
          indent=2, ensure_ascii=False)
print('Saved ✅')
