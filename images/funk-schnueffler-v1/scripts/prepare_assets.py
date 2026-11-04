"""Prepare the portable landing asset library without altering the source game.

Requires Pillow and ffmpeg/ffprobe already available on this workstation.
Run: python scripts/prepare_assets.py --source-repo PATH
"""
import argparse
import hashlib
import html
import json
import shutil
import subprocess
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT.parents[1] / 'detective-funk-schnüffler_-rare-groove-hustle'
ARTIST = 'DJ noziy neigbour aka Detektiv Funk Schnüffler'
PALETTE = {'paper': '#EEDDAD', 'ink': '#211F18', 'petrol': '#39756F', 'rust': '#C75A27', 'light-paper': '#F6E9C9'}
CURRENT_BACKGROUNDS = {'berlin-map-rough-v1', 'kreuzberg-street-rough-v1', 'scene-home-rough-v1', 'scene-otto-rough-v1', 'scene-fritte-rough-v1'}
STANDING = {'npc-otto-standing-v1', 'npc-arthur-standing-v1', 'npc-mona-standing-v1'}
PORTRAITS = {'npc-otto', 'npc-arthur', 'npc-mona'}
SPRITES = {'schnueffler-walk-sprites', 'schnueffler-dj-sprites'}
CURATED = CURRENT_BACKGROUNDS | STANDING | PORTRAITS | SPRITES | {'funk-schnueffler-logo', 'schnueffler-comic', 'schnueffler-dj'}

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def relative(path):
    return path.relative_to(ROOT).as_posix()

def record(path, ident, kind, status, source, source_root, **extra):
    local = relative(path)
    entry = {'id': ident, 'kind': kind, 'status': status, 'localPath': local,
             'publicPath': '/site/' + local, 'targetPath': 'public/site/' + local,
             'url': None, 'bytes': path.stat().st_size, 'sha256': sha(path),
             'sourcePath': source.relative_to(source_root).as_posix(), 'sourceSha256': sha(source)}
    if path.suffix.lower() in {'.webp', '.png', '.jpg'}:
        with Image.open(path) as image:
            entry.update(width=image.width, height=image.height,
                         alpha='A' in image.getbands() and image.getchannel('A').getextrema()[0] < 255)
    entry.update(extra)
    return entry

def sprite_info(image, cols=1, rows=1, standing=False):
    """Measure visible content per cell; bounds are cell-local, rect is atlas-global."""
    alpha = image.convert('RGBA').getchannel('A')
    cells = []
    for row in range(rows):
        for col in range(cols):
            x0, y0 = round(col * image.width / cols), round(row * image.height / rows)
            x1, y1 = round((col + 1) * image.width / cols), round((row + 1) * image.height / rows)
            bounds = alpha.crop((x0, y0, x1, y1)).point(lambda value: 255 if value > 180 else 0).getbbox()
            if not bounds:
                raise ValueError('Empty alpha content in sprite cell')
            left, top, right, bottom = bounds
            px, py = (left + right) / 2, bottom
            width, height = x1 - x0, y1 - y0
            cells.append({'index': row * cols + col, 'rect': {'x': x0, 'y': y0, 'width': width, 'height': height},
                          'bounds': {'x': left, 'y': top, 'width': right - left, 'height': bottom - top},
                          'pivot': {'x': px, 'y': py}, 'pivotNormalized': {'x': round(px / width, 7), 'y': round(py / height, 7)},
                          'touchesCellEdge': left == 0 or top == 0 or right == width or bottom == height})
    return {'grid': {'columns': cols, 'rows': rows}, 'alphaThreshold': 180,
            'coordinateSpace': 'rect: atlas pixels; bounds/pivot: cell-local pixels; pivotNormalized: cell fractions',
            'anchorMeaning': 'visible sole baseline' if standing else 'bottom-center of visible content; DJ poses are waist-up, not standing feet',
            'cells': cells,
            'warnings': ['Cell edges are rounded independently; do not assume uniform integer cell width.'] if image.width % cols else []}

def kind_for(stem):
    if stem == 'funk-schnueffler-logo': return 'logo', 'logos', 'current'
    if stem in SPRITES: return 'sprite', 'sprites', 'current'
    if stem in STANDING: return 'character', 'characters', 'current'
    if stem.startswith('npc-'): return 'portrait', 'characters', 'current-dialogue' if stem in PORTRAITS else 'legacy-in-use'
    if stem.startswith('schnueffler-'): return 'character', 'characters', 'current'
    if stem == 'club-crowd-silhouette': return 'prop', 'characters', 'legacy-in-use'
    if stem in CURRENT_BACKGROUNDS: return 'background', 'backgrounds', 'preferred'
    return 'background', 'legacy', 'legacy-in-use'

def write_webp(image, output, lossless):
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, 'WEBP', lossless=lossless, quality=100 if lossless else 90, method=6, exact=True)

def probe(path):
    return json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,r_frame_rate', '-of', 'json', str(path)], text=True))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-repo', type=Path, default=DEFAULT_SOURCE)
    args = parser.parse_args()
    source_root = args.source_repo.resolve()
    source_assets = source_root / 'public/assets'
    if not source_assets.is_dir(): raise SystemExit('Source repository must contain public/assets')
    entries = []
    for source in sorted(source_assets.iterdir()):
        if source.suffix.lower() == '.mp4': continue
        if source.suffix.lower() == '.svg':
            output = ROOT / 'assets/legacy' / source.name
            output.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, output)
            entries.append(record(output, source.stem + '-svg', 'vector', 'legacy', source, source_root,
                                  description='Legacy vector retained for provenance; not the approved landing logo.'))
            continue
        if source.suffix.lower() not in {'.png', '.webp'}: continue
        ident = source.stem
        kind, group, status = kind_for(ident)
        with Image.open(source) as original:
            original.load()
            lossless = original.mode == 'RGBA' or kind in {'logo', 'sprite', 'character', 'portrait', 'prop'}
            output = ROOT / 'assets' / group / (ident + '.webp')
            write_webp(original, output, lossless)
            extra = {'encoding': 'lossless-webp' if lossless else 'webp-quality-90'}
            if ident in SPRITES or ident in STANDING:
                extra.update(sprite_info(original, cols=4 if ident in SPRITES else 1, standing=ident in STANDING or ident == 'schnueffler-walk-sprites'))
            if ident.startswith('npc-') and ident not in STANDING:
                extra['description'] = 'Upper-body portrait. Use for dialogue/cards; do not stand it directly on a scene floor.'
            if ident in CURRENT_BACKGROUNDS:
                extra['description'] = 'Approved-style flat scene plate; no independent depth, foreground, or light layers supplied.'
            entries.append(record(output, ident, kind, status, source, source_root, **extra))
            sizes = [1280, 768] if ident in CURRENT_BACKGROUNDS else [960, 480] if kind == 'logo' else [512] if ident == 'schnueffler-comic' else []
            for width in sizes:
                variant = original.resize((width, round(original.height * width / original.width)), Image.Resampling.LANCZOS)
                output = ROOT / 'assets' / group / f'{ident}-{width}.webp'
                write_webp(variant, output, lossless)
                entries.append(record(output, f'{ident}-{width}', kind, status, source, source_root,
                                      variantOf=ident, encoding='lossless-webp' if lossless else 'webp-quality-90'))
        if ident == 'funk-schnueffler-logo':
            output = ROOT / 'assets/logos/funk-schnueffler-logo-original.png'
            shutil.copy2(source, output)
            entries.append(record(output, ident + '-original-png', 'logo', 'fallback-original', source, source_root, variantOf=ident))

    evidence = source_root / 'production/qa/evidence/adventure-001'
    for source in sorted(evidence.glob('*.png')):
        with Image.open(source) as image:
            output = ROOT / 'standbilder' / (source.stem + '.webp')
            write_webp(image, output, False)
        entries.append(record(output, source.stem, 'screenshot', 'current-evidence', source, source_root,
                              description='Actual game capture, not a concept render. Some captures precede the last frame-color or sprite-padding adjustment; see source verification.'))

    for index in (1, 2):
        source = source_root / f'public/audio/noziy-0{index}.m4a'
        output = ROOT / f'assets/audio/noziy-0{index}-preview.m4a'
        output.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', '0', '-i', str(source), '-t', '12', '-vn', '-c:a', 'aac', '-b:a', '128k', str(output)], check=True)
        metadata = probe(output)
        entries.append(record(output, f'noziy-0{index}-preview', 'audio', 'preview-excerpt', source, source_root,
                              title=f'Gastbeat 0{index}', artist=ARTIST, durationSeconds=float(metadata['format']['duration']),
                              excerpt={'startSeconds': 0, 'requestedDurationSeconds': 12},
                              description='12-second preview from the user-supplied original recording; no generated replacement music. Start only after explicit user action.'))

    source = source_assets / 'funk-schnueffler-intro.mp4'
    output = ROOT / 'cutscenes/intro-original.mp4'
    output.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, output)
    metadata = probe(output)
    video = next(stream for stream in metadata['streams'] if stream['codec_type'] == 'video')
    entries.append(record(output, 'intro-original', 'cutscene', 'prototype-not-final', source, source_root,
                          width=video['width'], height=video['height'], durationSeconds=float(metadata['format']['duration']),
                          frameRate=video['r_frame_rate'], hasAudio=any(stream['codec_type'] == 'audio' for stream in metadata['streams']),
                          description='Unchanged supplied intro. Logo/subline repair and rerender explicitly deferred; never present as final trailer.'))
    poster = ROOT / 'cutscenes/intro-original-poster.jpg'
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source), '-frames:v', '1', '-q:v', '3', str(poster)], check=True)
    entries.append(record(poster, 'intro-original-poster', 'poster', 'prototype-not-final', source, source_root,
                          description='First frame of supplied original video; poster extraction only, no video rerender.'))

    for social in sorted((ROOT / 'social').glob('*.png')):
        composition = ROOT / 'website-brief/social-card.html'
        entries.append(record(social, social.stem, 'social', 'current', composition if composition.exists() else social, ROOT,
                              description='Native HTML share-card composition using the supplied logo and actual game artwork; not a gameplay screenshot.'))

    manifest = {'schemaVersion': 1, 'name': 'Detektiv Funk Schnüffler – portable asset library v1',
                'sourceCommit': '6493a04ab2abba95ed21e6a670509d895f7892f5', 'preparedDate': '2026-11-04',
                'palette': PALETTE, 'credit': {'musicArtist': ARTIST, 'art': 'Provided game artwork and AI-generated project assets; identities and original music retained.'},
                'publication': {'status': 'not-published', 'repositoryCandidate': 'kburna243/mikes-cytube-dist', 'pathCandidate': 'images/funk-schnueffler-v1', 'baseUrl': None},
                'usage': {'url': 'Null until actually published. Use localPath inside this package, targetPath when copying to a website, publicPath in its HTML.',
                          'backgrounds': 'Flat images. No real 3D mesh, depth map, isolated foreground, or light layer is supplied.',
                          'sprites': 'Use measured cells/bounds/pivot. Alpha threshold180 ignores faint transparent RGB/glow fringe; visually check edge-touching cells.'},
                'entries': entries}
    (ROOT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    website = []
    for entry in entries:
        ident = entry['id']
        base = entry.get('variantOf', ident)
        if base not in CURATED and entry['kind'] not in {'screenshot', 'audio', 'cutscene', 'poster', 'social'}: continue
        if entry['kind'] == 'screenshot': section = 'screenshots'
        elif entry['kind'] in {'cutscene', 'poster'}: section = 'trailer-optional'
        elif entry['kind'] == 'audio': section = 'platten'
        elif entry['kind'] == 'social': section = 'meta'
        elif base == 'berlin-map-rough-v1': section = 'map'
        elif base.startswith('scene-') or base == 'kreuzberg-street-rough-v1': section = 'kiez'
        elif base.startswith('npc-'): section = 'figuren'
        else: section = 'hero'
        website.append({**entry, 'section': section})
    website_manifest = {key: manifest[key] for key in ['schemaVersion', 'sourceCommit', 'preparedDate', 'palette', 'credit', 'publication']}
    website_manifest.update(name='Detektiv Funk Schnüffler – curated website assets', entries=website)
    (ROOT / 'website-brief').mkdir(exist_ok=True)
    (ROOT / 'website-brief/website-assets.json').write_text(json.dumps(website_manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    create_gallery(entries)
    total = sum(entry['bytes'] for entry in entries)
    print(json.dumps({'assets': len(entries), 'websiteAssets': len(website), 'bytes': total,
                      'sourceImageBytes': sum(path.stat().st_size for path in source_assets.iterdir() if path.suffix in {'.png', '.webp'}),
                      'optimizedBaseImageBytes': sum(entry['bytes'] for entry in entries if entry['kind'] not in {'audio', 'screenshot', 'cutscene', 'poster', 'vector'} and 'variantOf' not in entry and entry['status'] != 'fallback-original')}, indent=2))

def create_gallery(entries):
    cards = []
    for entry in entries:
        path, name, kind = map(html.escape, (entry['localPath'], entry['id'], entry['kind']))
        if kind in {'audio', 'cutscene'}:
            tag = 'audio' if kind == 'audio' else 'video'
            media = f'<{tag} controls preload="none" src="{path}"></{tag}>'
        else: media = f'<img src="{path}" alt="{name}" loading="lazy" width="320" height="190">'
        cards.append(f'<article data-kind="{kind}">{media}<h2>{name}</h2><p>{kind} · {html.escape(entry["status"])} · {entry["bytes"]//1024} KB</p><a href="{path}">Datei öffnen</a></article>')
    page = '''<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Funk Schnüffler – Asset-Galerie</title><style>
    *{box-sizing:border-box}body{margin:0;background:#eeddad;color:#211f18;font:15px/1.5 Arial,sans-serif}header{padding:25px;border-bottom:4px solid #211f18}h1{margin:0;font:36px Impact,sans-serif}a{color:#235b55}button,select{font:inherit;padding:9px;border:2px solid #211f18;background:#f6e9c9}main{padding:20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}article{padding:14px;border:2px solid #211f18;min-width:0;background:#f6e9c9}img,video{width:100%;height:190px;object-fit:contain;background:repeating-conic-gradient(#ccc 0% 25%,#eee 0% 50%) 0 0/20px 20px}audio{width:100%;height:190px}h2{font:700 14px monospace;overflow-wrap:anywhere}p{font-size:12px}*:focus-visible{outline:3px solid #c75a27;outline-offset:3px}article[hidden]{display:none}
    </style><header><h1>DETEKTIV FUNK SCHNÜFFLER</h1><p>Portable Asset-Galerie · lokale Dateien, kein CDN. Alte und neue Grafik sind im Status getrennt. Das Video ist ein unfertiger Original-Prototyp.</p><label>Art filtern <select id="filter"><option value="all">Alles</option>OPTIONS</select></label> <a href="manifest.json">Vollständiges Manifest</a> · <a href="website-brief/website-assets.json">Website-Auswahl</a></header><main>CARDS</main><script>document.querySelector('#filter').addEventListener('change',e=>document.querySelectorAll('article').forEach(card=>card.hidden=e.target.value!=='all'&&card.dataset.kind!==e.target.value));</script></html>'''
    page = page.replace('OPTIONS', ''.join(f'<option>{html.escape(kind)}</option>' for kind in sorted({entry['kind'] for entry in entries}))).replace('CARDS', '\n'.join(cards))
    (ROOT / 'gallery.html').write_text(page, encoding='utf-8')

if __name__ == '__main__': main()
