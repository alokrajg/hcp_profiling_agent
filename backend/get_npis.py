import json, urllib.request, sys
state = sys.argv[1] if len(sys.argv) > 1 else 'CA'
url=f'https://npiregistry.cms.hhs.gov/api/?version=2.1&enumeration_type=NPI-1&state={state}&limit=5'
with urllib.request.urlopen(url, timeout=20) as r:
    data=json.load(r)
for res in data.get('results', [])[:5]:
    n = res.get('number')
    if n:
        print(n)
