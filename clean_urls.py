from pathlib import Path
import re
import shutil
import json
import os
import sys
from datetime import datetime

ROOT = Path.cwd()

EXPECTED_FILES = [
    "index.html",
    "kana.html",
    "default.html",
    "reverse.html",
    "test.html",
    "wordbank.html",
]

missing = [name for name in EXPECTED_FILES if not (ROOT / name).exists()]
if missing:
    print("Missing expected files:")
    for name in missing:
        print(f"  - {name}")
    print("\nRun this script from the root of your mode-atlas folder.")
    sys.exit(1)

backup = ROOT.parent / f"{ROOT.name}-backup-before-clean-urls-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
print(f"Creating backup at:\n{backup}")
shutil.copytree(
    ROOT,
    backup,
    ignore=shutil.ignore_patterns(".git", "__MACOSX", ".DS_Store")
)

PAGE_URLS = {
    "index.html": "/",
    "kana.html": "/kana/",
    "default.html": "/reading/",
    "reverse.html": "/writing/",
    "test.html": "/results/",
    "wordbank.html": "/wordbank/",
}

MOVE_MAP = {
    "kana.html": "kana/index.html",
    "default.html": "reading/index.html",
    "reverse.html": "writing/index.html",
    "test.html": "results/index.html",
    "wordbank.html": "wordbank/index.html",
}

LINK_MAP = {
    "index.html": "/",
    "kana.html": "/kana/",
    "default.html": "/reading/",
    "reverse.html": "/writing/",
    "test.html": "/results/",
    "wordbank.html": "/wordbank/",
}

def read_text(path):
    return path.read_text(encoding="utf-8")

def write_text(path, text):
    path.write_text(text, encoding="utf-8")

def all_files_with_suffixes(suffixes):
    output = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [
            d for d in dirnames
            if d not in {".git", "__MACOSX", "node_modules"}
        ]
        for filename in filenames:
            path = Path(dirpath) / filename
            if any(filename.endswith(suffix) for suffix in suffixes):
                output.append(path)
    return output

def ensure_canonical_and_og_url(html, old_filename):
    canonical_url = f"https://mode-atlas.app{PAGE_URLS[old_filename]}"
    canonical_tag = f'<link rel="canonical" href="{canonical_url}" />'
    og_url_tag = f'<meta property="og:url" content="{canonical_url}" />'

    if '<link rel="canonical"' in html:
        html = re.sub(
            r'<link rel="canonical" href="[^"]*"\s*/?>',
            canonical_tag,
            html
        )
    else:
        html = html.replace("</title>", f"</title>\n  {canonical_tag}", 1)

    if 'property="og:url"' in html:
        html = re.sub(
            r'<meta property="og:url" content="[^"]*"\s*/?>',
            og_url_tag,
            html
        )
    elif 'property="og:image"' in html:
        html = html.replace(
            '<meta property="og:image"',
            f'{og_url_tag}\n  <meta property="og:image"',
            1
        )

    return html

def make_root_absolute_asset_paths(html):
    prefixes = [
        "assets/",
        "firebase-config.js",
        "cloud-sync.js",
        "site.webmanifest",
        "sw.js",
    ]

    for attr in ["href", "src", "content"]:
        for prefix in prefixes:
            html = html.replace(f'{attr}="{prefix}', f'{attr}="/{prefix}')
            html = html.replace(f"{attr}='{prefix}", f"{attr}='/{prefix}")

    html = re.sub(
        r'<meta property="og:image" content="[^"]*"\s*/?>',
        '<meta property="og:image" content="https://mode-atlas.app/assets/social-preview.svg" />',
        html
    )

    return html

def update_html_links(html):
    for old, new in LINK_MAP.items():
        html = re.sub(
            r'(?P<attr>href=["\'])' + re.escape(old) + r'(?P<query>\?[^"\']*)?(?P<end>["\'])',
            lambda m: f"{m.group('attr')}{new}{m.group('query') or ''}{m.group('end')}",
            html
        )
    return html

def update_html_file(path, old_filename):
    html = read_text(path)
    html = make_root_absolute_asset_paths(html)
    html = ensure_canonical_and_og_url(html, old_filename)
    html = update_html_links(html)
    write_text(path, html)

print("Updating HTML files...")
for old_filename in PAGE_URLS:
    path = ROOT / old_filename
    if path.exists():
        update_html_file(path, old_filename)

print("Moving pages into folder-style URLs...")
for old, new in MOVE_MAP.items():
    src = ROOT / old
    dst = ROOT / new
    dst.parent.mkdir(exist_ok=True)

    if src.exists():
        if dst.exists():
            dst.unlink()
        shutil.move(str(src), str(dst))

print("Creating redirect pages for old .html URLs...")
for old, target in PAGE_URLS.items():
    if old == "index.html":
        continue

    redirect_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="refresh" content="0; url={target}" />
  <link rel="canonical" href="https://mode-atlas.app{target}" />
  <title>Redirecting • Mode Atlas</title>
  <script>
    location.replace({target!r} + location.search + location.hash);
  </script>
</head>
<body>
  <p>Redirecting to <a href="{target}">{target}</a>…</p>
</body>
</html>
"""
    write_text(ROOT / old, redirect_html)

print("Updating JavaScript links and page detection...")
for path in all_files_with_suffixes([".js"]):
    text = read_text(path)

    text = text.replace(
        "(location.pathname.split('/').pop() || 'index.html').toLowerCase()",
        "(window.ModeAtlasPageName ? window.ModeAtlasPageName() : (location.pathname.split('/').pop() || 'index.html')).toLowerCase()"
    )
    text = text.replace(
        "(location.pathname.split('/').pop()||'index.html').toLowerCase()",
        "(window.ModeAtlasPageName ? window.ModeAtlasPageName() : (location.pathname.split('/').pop() || 'index.html')).toLowerCase()"
    )

    replacements = [
        ("default.html?", "/reading/?"),
        ("reverse.html?", "/writing/?"),
        ("test.html?", "/results/?"),
        ("kana.html?", "/kana/?"),
        ("wordbank.html?", "/wordbank/?"),
    ]

    for old, new in replacements:
        text = text.replace(old, new)

    for old, new in LINK_MAP.items():
        text = text.replace(f'href="{old}"', f'href="{new}"')
        text = text.replace(f"href='{old}'", f"href='{new}'")
        text = text.replace(f'href="{old}?', f'href="{new}?')
        text = text.replace(f"href='{old}?", f"href='{new}?")
        text = text.replace(f"setAttribute('href','{old}')", f"setAttribute('href','{new}')")
        text = text.replace(f'setAttribute("href","{old}")', f'setAttribute("href","{new}")')

    write_text(path, text)

head_bootstrap = ROOT / "assets/app/mode-atlas-head-bootstrap.js"
if head_bootstrap.exists():
    print("Updating head bootstrap...")
    text = read_text(head_bootstrap)

    text = re.sub(
        r"var APP_VERSION = '[^']+';",
        "var APP_VERSION = '2.11.5';",
        text
    )

    helper = """
  function getPageName(){
    var path = (location.pathname || '/').replace(/\\/+$/, '/');

    if (path === '/' || /\\/index\\.html$/i.test(path)) return 'index.html';
    if (/\\/kana\\/?$/i.test(path) || /\\/kana\\/index\\.html$/i.test(path)) return 'kana.html';
    if (/\\/reading\\/?$/i.test(path) || /\\/reading\\/index\\.html$/i.test(path) || /\\/default\\.html$/i.test(path)) return 'default.html';
    if (/\\/writing\\/?$/i.test(path) || /\\/writing\\/index\\.html$/i.test(path) || /\\/reverse\\.html$/i.test(path)) return 'reverse.html';
    if (/\\/results\\/?$/i.test(path) || /\\/results\\/index\\.html$/i.test(path) || /\\/test\\.html$/i.test(path)) return 'test.html';
    if (/\\/wordbank\\/?$/i.test(path) || /\\/wordbank\\/index\\.html$/i.test(path)) return 'wordbank.html';

    return (path.split('/').filter(Boolean).pop() || 'index.html').toLowerCase();
  }

  window.ModeAtlasPageName = getPageName;
"""

    if "window.ModeAtlasPageName" not in text:
        text = text.replace("  function safeStorageGet(key){", helper + "\n  function safeStorageGet(key){", 1)

    text = text.replace(
        "baseUrl: new URL('.', document.baseURI).href,",
        "baseUrl: location.origin + '/',"
    )
    text = text.replace(
        "link.href = new URL('site.webmanifest', document.baseURI).href;",
        "link.href = '/site.webmanifest';"
    )
    text = text.replace(
        "var swUrl = new URL('sw.js', document.baseURI).href;\n        navigator.serviceWorker.register(swUrl, { scope: new URL('./', document.baseURI).pathname })",
        "var swUrl = '/sw.js';\n        navigator.serviceWorker.register(swUrl, { scope: '/' })"
    )

    write_text(head_bootstrap, text)

qol = ROOT / "assets/app/mode-atlas-qol.js"
if qol.exists():
    print("Updating QoL navigation...")
    text = read_text(qol)
    text = text.replace(
        "if(['default.html','reverse.html','test.html'].includes(PAGE)) localStorage.setItem(LAST_PAGE_KEY, PAGE);",
        "if(['default.html','reverse.html','test.html'].includes(PAGE)){ const map={ 'default.html':'/reading/', 'reverse.html':'/writing/', 'test.html':'/results/' }; localStorage.setItem(LAST_PAGE_KEY, map[PAGE] || '/reading/'); }"
    )
    text = text.replace("href:'default.html", "href:'/reading/")
    write_text(qol, text)

confusable = ROOT / "assets/ui/mode-atlas-verified-preset-confusable.js"
if confusable.exists():
    text = read_text(confusable)
    text = text.replace(
        "a.setAttribute('href','default.html?confusable=1')",
        "a.setAttribute('href','/reading/?confusable=1')"
    )
    write_text(confusable, text)

print("Updating service worker...")
sw = ROOT / "sw.js"
if sw.exists():
    text = read_text(sw)

    text = re.sub(
        r"const MODE_ATLAS_VERSION = '[^']+';",
        "const MODE_ATLAS_VERSION = '2.11.5';",
        text
    )

    cache_entries = [
        ("./kana.html", "./kana/"),
        ("./default.html", "./reading/"),
        ("./reverse.html", "./writing/"),
        ("./test.html", "./results/"),
        ("./wordbank.html", "./wordbank/"),
    ]

    for old, new in cache_entries:
        if new not in text:
            text = text.replace(f"  '{old}',", f"  '{new}',\n  '{old}',")

    if "shouldBypassServiceWorker" not in text:
        text = text.replace(
            "self.addEventListener('fetch', event => {",
            """function shouldBypassServiceWorker(url) {
  return (
    url.pathname === '/sitemap.xml' ||
    url.pathname === '/robots.txt' ||
    url.pathname === '/CNAME' ||
    url.pathname.startsWith('/.well-known/')
  );
}

self.addEventListener('fetch', event => {""",
            1
        )
        text = text.replace(
            "  if (url.origin !== self.location.origin) return;",
            "  if (url.origin !== self.location.origin) return;\n  if (shouldBypassServiceWorker(url)) return;",
            1
        )

    write_text(sw, text)

print("Updating web manifest...")
manifest = ROOT / "site.webmanifest"
if manifest.exists():
    data = json.loads(read_text(manifest))

    data["id"] = "/"
    data["start_url"] = "/"
    data["scope"] = "/"

    for icon in data.get("icons", []):
        if "src" in icon and not icon["src"].startswith("/"):
            icon["src"] = "/" + icon["src"]

    manifest_url_map = {
        "./kana.html": "/kana/",
        "./default.html": "/reading/",
        "./reverse.html": "/writing/",
        "./test.html": "/results/",
        "kana.html": "/kana/",
        "default.html": "/reading/",
        "reverse.html": "/writing/",
        "test.html": "/results/",
    }

    for shortcut in data.get("shortcuts", []):
        old_url = shortcut.get("url")
        if old_url in manifest_url_map:
            shortcut["url"] = manifest_url_map[old_url]

    write_text(manifest, json.dumps(data, indent=2, ensure_ascii=False) + "\n")

print("Updating sitemap.xml...")
sitemap = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://mode-atlas.app/</loc></url>
  <url><loc>https://mode-atlas.app/kana/</loc></url>
  <url><loc>https://mode-atlas.app/reading/</loc></url>
  <url><loc>https://mode-atlas.app/writing/</loc></url>
  <url><loc>https://mode-atlas.app/results/</loc></url>
  <url><loc>https://mode-atlas.app/wordbank/</loc></url>
</urlset>
"""
write_text(ROOT / "sitemap.xml", sitemap)

print("Ensuring robots.txt exists...")
robots = """User-agent: *
Allow: /

Sitemap: https://mode-atlas.app/sitemap.xml
"""
write_text(ROOT / "robots.txt", robots)

for path in ROOT.rglob(".DS_Store"):
    path.unlink(missing_ok=True)

print("\nDone.")
print(f"Backup created at:\n{backup}")
print("\nNow test locally:")
print("  python3 -m http.server 8010")
print("\nThen visit:")
print("  http://localhost:8010/")
print("  http://localhost:8010/kana/")
print("  http://localhost:8010/reading/")
print("  http://localhost:8010/writing/")
print("  http://localhost:8010/results/")
print("  http://localhost:8010/wordbank/")