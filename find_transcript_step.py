import glob, json

files = glob.glob('C:/Users/rafae/.gemini/antigravity/brain/77c927c0-ec2f-40ac-8b6c-3097c8a36f82/.system_generated/logs/transcript_full.jsonl')
for f in files:
    with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
        for idx, line in enumerate(fp):
            if 'blackout' in line.lower() and 'hotel' in line.lower():
                obj = json.loads(line)
                txt = obj.get('content') or ''
                if not txt and obj.get('tool_calls'):
                    txt = str(obj.get('tool_calls'))
                print(f"Line {idx}: {txt[:300]}")
