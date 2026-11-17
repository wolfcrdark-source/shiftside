# Builds game.zip with index.html at the zip root: python3 tools/make_zip.py
import zipfile, os
root = 'game'
with zipfile.ZipFile('game.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for d, _, fs in os.walk(root):
        for f in sorted(fs):
            p = os.path.join(d, f); z.write(p, os.path.relpath(p, root))
print('\n'.join(zipfile.ZipFile('game.zip').namelist()))
