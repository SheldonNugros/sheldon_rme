import glob
import re

print("Scanning for suspicious unescaped braces inside backtick template literals...")
for path in sorted(glob.glob('src/frontend/*.html') + glob.glob('src/backend/*.gs')):
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    in_backtick = False
    for idx, line in enumerate(lines):
        # Count backticks
        count = line.count('`')
        # If line contains backticks or we are in multiline backtick
        # check for {var} not preceded by $
        matches = re.findall(r'(?<!\$)\{([a-zA-Z0-9_\.\|\|\'\-\+\s]+)\}', line)
        matches = [m for m in matches if not any(kw in m for kw in ['return', 'let ', 'var ', 'const ', 'function', 'if ']) and len(m) < 40]
        # Only report if it's within HTML tags or template context
        for m in matches:
            if any(marker in line for marker in ['`', 'class=', 'onclick=', 'id=', '>', '<']):
                print(f"[{path}:{idx+1}] match '{m}' in: {line.strip()[:100]}")
